/*
 * Created with @iobroker/create-adapter v2.6.5
 */

type Coords = { lat: number; lon: number };

type Panel = ioBroker.AdapterConfig['panels'][0];
// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import { Library } from './lib/library';
import type { BrightskyCurrently, BrightskyHourly, BrightskyRadarResponse, BrightskyRadarData } from './lib/definition';
import {
    genericStateObjects,
    type BrightskyDailyData,
    type BrightskyDayNightData,
    type BrightskyWeather,
} from './lib/definition';
import * as suncalc from 'suncalc';

// Load your modules here, e.g.:
// import * as fs from "fs";

class Brightsky extends utils.Adapter {
    library: Library;
    unload: boolean = false;
    posId: string = '';
    weatherTimeout: (ioBroker.Timeout | null | undefined)[] = [];
    controller: AbortController | null = null;
    timeoutId: ioBroker.Timeout | undefined = undefined;
    groupArray: Panel[][] = [];
    wrArray: number[] = [];
    radarData: BrightskyRadarData[] = [];
    radarRotationTimeout: ioBroker.Timeout | null | undefined = undefined;
    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({
            ...options,
            name: 'brightsky',
        });
        this.on('ready', this.onReady.bind(this));
        // this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
        this.library = new Library(this, 'Brightsky');
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    private async onReady(): Promise<void> {
        // Create the connection state object if it doesn't exist
        await this.setObjectNotExistsAsync('info.connection', {
            type: 'state',
            common: {
                name: 'Connection status',
                type: 'boolean',
                role: 'indicator.connected',
                read: true,
                write: false,
            },
            native: {},
        });
        await this.setState('info.connection', false, true);
        if (!this.config.createDaily) {
            await this.delObjectAsync('daily', { recursive: true });
        } else {
            // Create the daily data folder
            await this.library.writedp('daily', null, genericStateObjects.weather.daily._channel);
        }
        if (!this.config.createCurrently) {
            await this.delObjectAsync('current', { recursive: true });
        } else {
            // Create the currently data folder
            await this.library.writedp('current', null, genericStateObjects.weather.current._channel);
        }
        if (!this.config.createHourly) {
            await this.delObjectAsync('hourly', { recursive: true });
        } else {
            // Create the hourly data folder
            await this.library.writedp('hourly', null, genericStateObjects.weather.hourly._channel);
            await this.library.writedp('hourly.sources', undefined, genericStateObjects.weather.sources._channel);
        }
        if (!this.config.createRadar) {
            await this.delObjectAsync('radar', { recursive: true });
        } else {
            // Create the radar data folder
            await this.library.writedp('radar', null, genericStateObjects.weather.radar._channel);
        }
        if (
            !this.config.createCurrently &&
            !this.config.createHourly &&
            !this.config.createDaily &&
            !this.config.createRadar
        ) {
            this.log.error(
                'No data creation is enabled in the adapter configuration. Please enable at least one of the options: Currently, Hourly, Daily, or Radar.',
            );
            return;
        }
        if (this.config.wmo_station == undefined || typeof this.config.wmo_station !== 'string') {
            this.log.warn(`Invalid WMO station ID. Using default value of "".`);
            this.config.wmo_station = ''; // Default to 0 if invalid
        }
        if (this.config.dwd_station_id == undefined || typeof this.config.dwd_station_id !== 'string') {
            this.log.warn(`Invalid DWD station ID. Using default value of "".`);
            this.config.dwd_station_id = ''; // Default to 0 if invalid
        }

        this.wrArray.push(this.config.wr1 ?? 0);
        this.wrArray.push(this.config.wr2 ?? 0);
        this.wrArray.push(this.config.wr3 ?? 0);
        this.wrArray.push(this.config.wr4 ?? 0);
        this.wrArray.forEach(() => {
            this.groupArray.push([]);
        });
        if (this.config.panels) {
            for (const p of this.config.panels) {
                const wr = (p.wr ?? 0) | 0; // default 0; ensure int
                if (wr >= 0 && wr < this.wrArray.length) {
                    this.groupArray[wr].push(p);
                }
            }
        }

        if (this.config.wmo_station !== '' && this.config.dwd_station_id !== '') {
            this.log.warn(
                'Both WMO station ID and DWD station ID are set. Using DWD station ID for location identification.',
            );
            this.config.wmo_station = ''; // Clear WMO station ID if DWD station ID is set
        }
        this.posId = this.config.dwd_station_id
            ? `dwd_station_id=${this.config.dwd_station_id}`
            : this.config.wmo_station == ''
              ? `lat=${this.config.position.split(',')[0]}&lon=${this.config.position.split(',')[1]}&`
              : `wmo_station_id=${this.config.wmo_station}`;
        if (
            !this.config.position ||
            typeof this.config.position !== 'string' ||
            !this.config.position.split(',').every(coord => !isNaN(parseFloat(coord)))
        ) {
            this.log.error('Position is not set in the adapter configuration. Please set it in the adapter settings.');
            return;
        }
        if (this.config.panels == undefined || !Array.isArray(this.config.panels)) {
            this.config.panels = [];
        }
        if (this.config.hours == undefined || this.config.hours < 0 || this.config.hours > 48) {
            this.log.warn(`Invalid hours to display: ${this.config.hours}. Using default value of 24 hours.`);
            this.config.hours = 24; // Default to 24 hours if invalid
        }

        if (
            this.config.pollInterval == undefined ||
            this.config.pollInterval < 1 ||
            this.config.pollInterval >= 2 ** 31 / (60000 * 60)
        ) {
            this.log.warn(`Invalid poll interval: ${this.config.pollInterval}. Using default value of 12 hour.`);
            this.config.pollInterval = 12; // Default to 1 hour if invalid
        }
        if (
            this.config.pollIntervalCurrently == undefined ||
            this.config.pollIntervalCurrently < 10 ||
            this.config.pollIntervalCurrently >= 2 ** 31 / 60000
        ) {
            this.log.warn(
                `Invalid poll interval currently: ${this.config.pollIntervalCurrently}. Using default value of 30 minute.`,
            );
            this.config.pollIntervalCurrently = 60; // Default to 1 minute if invalid
        }

        if (this.config.maxDistance == undefined || this.config.maxDistance < 1000) {
            this.log.warn(`Invalid max distance: ${this.config.maxDistance}. Using default value of 50000 meters.`);
            this.config.maxDistance = 50000; // Default to 50 km if invalid
        }

        if (
            this.config.pollIntervalRadar == undefined ||
            this.config.pollIntervalRadar < 5 ||
            this.config.pollIntervalRadar >= 2 ** 31 / 60000
        ) {
            this.log.warn(
                `Invalid poll interval radar: ${this.config.pollIntervalRadar}. Using default value of 10 minutes.`,
            );
            this.config.pollIntervalRadar = 10; // Default to 10 minutes if invalid
        }

        // Ensure radar interval is divisible by 5
        if (this.config.pollIntervalRadar % 5 !== 0) {
            const adjusted = Math.round(this.config.pollIntervalRadar / 5) * 5;
            this.log.warn(
                `Radar poll interval must be divisible by 5. Adjusting from ${this.config.pollIntervalRadar} to ${adjusted} minutes.`,
            );
            this.config.pollIntervalRadar = adjusted;
        }

        // Validate radar distance (max 50km)
        if (
            this.config.radarDistance == undefined ||
            this.config.radarDistance < 1000 ||
            this.config.radarDistance > 50000
        ) {
            this.log.warn(
                `Invalid radar distance: ${this.config.radarDistance}. Using default value of 10000 meters (10 km).`,
            );
            this.config.radarDistance = 10000; // Default to 10 km if invalid
        }

        if (this.config.createCurrently) {
            await this.delay(3000); // Wait for 1 second to ensure the adapter is ready
            await this.weatherCurrentlyLoop();
        }
        if (this.config.createHourly) {
            await this.delay(3000);
            await this.weatherHourlyLoop();
        }
        if (this.config.createDaily) {
            await this.delay(3000);
            await this.weatherDailyLoop();
        }
        if (this.config.createRadar) {
            await this.delay(3000);
            await this.weatherRadarLoop();
        }
        this.log.info(
            `Adapter started with configuration: Position: ${this.config.position}, WMO Station ID: ${this.config.wmo_station}, DWD Station ID: ${this.config.dwd_station_id}, ${this.config.createCurrently ? `Currently data enabled. Poll interval: ${this.config.pollIntervalCurrently} minutes` : 'Currently data disabled'} - ${this.config.createHourly ? `Hourly data enabled. Poll interval: ${this.config.pollInterval} hours` : 'Hourly data disabled'} - ${this.config.createDaily ? 'Daily data enabled' : 'Daily data disabled'} - ${this.config.createRadar ? `Radar data enabled. Poll interval: ${this.config.pollIntervalRadar} minutes` : 'Radar data disabled'}. Max distance: ${this.config.maxDistance} meters.`,
        );
        this.log.info(
            `Using ${this.config.dwd_station_id ? `WMO Station ID: ${this.config.dwd_station_id}` : `${this.config.wmo_station ? `WMO Station ID: ${this.config.wmo_station}` : `Position: ${this.config.position} with max distance: ${this.config.maxDistance} meters`}`}`,
        );
    }

    async weatherDailyLoop(): Promise<void> {
        if (this.weatherTimeout[2]) {
            this.clearTimeout(this.weatherTimeout[2]);
        }
        await this.weatherDailyUpdate();
        let loopTime = 100000;
        if (new Date().getHours() >= 5 && new Date().getHours() < 18) {
            loopTime = new Date().setHours(18, 0, 0, 0) + 30000 + Math.ceil(Math.random() * 5000);
        } else if (new Date().getHours() >= 18) {
            loopTime = new Date().setHours(0, 0, 0, 0) + 30000 + Math.ceil(Math.random() * 60000);
        } else {
            loopTime = new Date().setHours(5, 0, 0, 0) + 30000 + Math.ceil(Math.random() * 5000);
        }
        loopTime = loopTime - Date.now(); // Calculate the time until the next update
        if (loopTime <= 0) {
            loopTime = loopTime + 24 * 60 * 60 * 1000; // If the time is in the past, set it to the next day
        }
        this.weatherTimeout[2] = this.setTimeout(() => {
            void this.weatherDailyLoop();
        }, loopTime);
    }

    async weatherDailyUpdate(): Promise<void> {
        const startTime = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        const endTime = new Date(
            new Date(new Date().setHours(23, 59, 59, 999)).setDate(new Date().getDate() + 7),
        ).toISOString();
        try {
            const response = await this.fetch(
                `https://api.brightsky.dev/weather?${this.posId}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`,
            );
            this.log.debug(
                `https://api.brightsky.dev/weather?lat=${this.config.position.split(',')[0]}&lon=${this.config.position.split(',')[1]}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`,
            );
            if (response.status !== 200) {
                throw new Error(`Error fetching daily weather data: ${response.status} ${response.statusText}`);
            }
            const result = { data: await response.json() } as {
                data: { weather: BrightskyWeather[]; sources: any[] } | null;
            };
            if (result.data) {
                this.log.debug(`Daily weather data fetched successfully: ${JSON.stringify(result.data)}`);
                if (result.data.weather && Array.isArray(result.data.weather)) {
                    const weatherArr: Record<string, (string | number | null)[]>[] = [];
                    const resultArr: Partial<BrightskyDailyData>[] = [];
                    const currentDay = Math.floor(new Date().getTime() / (24 * 60 * 60 * 1000)); // Current day in milliseconds
                    for (const item of result.data.weather as BrightskyWeather[]) {
                        if (!item) {
                            continue; // Skip if item is null or undefined
                        }
                        const dataDay = Math.floor(new Date(item.timestamp).getTime() / (24 * 60 * 60 * 1000));
                        const day = dataDay - currentDay;
                        if (weatherArr[day] === undefined) {
                            weatherArr[day] = {};
                        }
                        for (const key of Object.keys(item)) {
                            if (weatherArr[day][key] === undefined) {
                                weatherArr[day][key] = [];
                            }
                            const k = key as keyof BrightskyWeather;
                            weatherArr[day][key].push(item[k] ?? null);
                        }
                    }
                    for (let i = 0; i < weatherArr.length; i++) {
                        const dailyData: Partial<BrightskyDailyData> = {};
                        this.log.debug(`Processing daily data for day ${i}: ${JSON.stringify(weatherArr[i])}`);
                        for (const key of Object.keys(weatherArr[i])) {
                            const k = key as keyof BrightskyWeather;
                            switch (k) {
                                case 'precipitation':
                                case 'wind_gust_speed':
                                case 'precipitation_probability':
                                case 'precipitation_probability_6h':
                                case 'wind_speed': {
                                    const values = weatherArr[i][k] as (number | null)[];
                                    if (values && values.length > 0) {
                                        for (let j = 0; j < values.length; j++) {
                                            if (values[j] === null) {
                                                values[j] = 0; // Set null values to 0
                                            }
                                        }
                                    }
                                }
                            }
                            switch (k) {
                                case 'timestamp': {
                                    dailyData.timestamp = weatherArr[i].timestamp[0] as string;
                                    break;
                                }
                                case 'source_id': {
                                    dailyData.source_id = weatherArr[i].source_id[0] as number;
                                    break;
                                }
                                case 'precipitation':
                                case 'wind_speed':
                                case 'solar':
                                case 'temperature': {
                                    const values = weatherArr[i][k] as (number | null)[];
                                    if (values && values.length > 0) {
                                        const min = Math.min(...(values.filter(v => v !== null) as number[]));
                                        const max = Math.max(...(values.filter(v => v !== null) as number[]));

                                        if (k !== 'solar') {
                                            dailyData[`${k}_min`] = min !== Infinity ? min : null;
                                        } else {
                                            dailyData.solar_estimate = 0;
                                            if (
                                                this.config.position.split(',').length === 2 &&
                                                this.config.panels.length > 0
                                            ) {
                                                dailyData.solar_estimate = values.reduce((sum, value, index) => {
                                                    if (typeof sum !== 'number') {
                                                        sum = 0; // Initialize sum to 0 if it's not a number
                                                    }
                                                    if (value) {
                                                        const newValue = this.estimatePVEnergyForHour(
                                                            value,
                                                            new Date(weatherArr[i].timestamp[index] as string),
                                                            {
                                                                lat: parseFloat(this.config.position.split(',')[0]),
                                                                lon: parseFloat(this.config.position.split(',')[1]),
                                                            },
                                                            this.config.panels,
                                                        );

                                                        return sum + newValue;
                                                    }
                                                    return sum;
                                                });
                                                dailyData.solar_estimate = dailyData.solar_estimate
                                                    ? Math.round(dailyData.solar_estimate * 1000) / 1000
                                                    : dailyData.solar_estimate;
                                            }
                                            if (new Date().getHours() === 5) {
                                                dailyData.solar_forHomoran = values.reduce((sum, value) => {
                                                    if (typeof sum !== 'number') {
                                                        sum = 0; // Initialize sum to 0 if it's not a number
                                                    }
                                                    if (value != null && typeof value === 'number') {
                                                        return sum + value;
                                                    }
                                                    return sum;
                                                });
                                                if (dailyData.solar_estimate != null) {
                                                    dailyData.solar_estimateForHomoran = dailyData.solar_estimate;
                                                }
                                            }
                                        }
                                        dailyData[`${k}_max`] = max !== -Infinity ? max : null;
                                    } else {
                                        if (k !== 'solar') {
                                            dailyData[`${k}_min`] = null;
                                        }
                                    }
                                }
                                // eslint-disable-next-line no-fallthrough
                                case 'sunshine': {
                                    if (k === 'precipitation' || k === 'sunshine' || k === 'solar') {
                                        const t = weatherArr[i][k].reduce((sum, value) => {
                                            if (typeof sum !== 'number') {
                                                sum = 0; // Initialize sum to 0 if it's not a number
                                            }
                                            if (value != null && typeof value === 'number') {
                                                return sum + value;
                                            }
                                            return sum;
                                        }, 0);
                                        dailyData[k] = null;
                                        if (t !== null && typeof t === 'number') {
                                            dailyData[k] =
                                                k !== 'solar' ? Math.round(t * 10) / 10 : Math.round(t * 1000) / 1000;
                                        }
                                        break;
                                    }
                                }
                                // eslint-disable-next-line no-fallthrough
                                case 'wind_direction':
                                case 'cloud_cover':
                                case 'dew_point':
                                case 'relative_humidity':
                                case 'visibility':
                                case 'wind_gust_direction':
                                case 'wind_gust_speed':
                                case 'precipitation_probability':
                                case 'precipitation_probability_6h': {
                                    const values = weatherArr[i][k] as (number | null)[];
                                    if (values && values.length > 0) {
                                        if (values && values.length > 0) {
                                            let median: number | null = null;
                                            if (values.filter(v => v !== null).length > 0) {
                                                const sortedValues = values
                                                    .filter(v => v !== null)
                                                    .sort((a, b) => a - b);
                                                const mid = Math.floor(sortedValues.length / 2);
                                                if (sortedValues.length % 2 === 0) {
                                                    median = (sortedValues[mid - 1] + sortedValues[mid]) / 2;
                                                } else {
                                                    median = sortedValues[mid];
                                                }
                                            }
                                            let avg = values.reduce((sum, value) => {
                                                if (value != null) {
                                                    return sum == null ? 0 + value : sum + value;
                                                }
                                                return sum;
                                            }, 0);
                                            if (avg != null) {
                                                if (values.filter(v => v !== null).length > 12) {
                                                    avg =
                                                        Math.round((avg / values.filter(v => v !== null).length) * 10) /
                                                        10;
                                                } else {
                                                    avg = null;
                                                }
                                            }
                                            dailyData[`${k}_median`] = median;
                                            dailyData[k] = avg;
                                        } else {
                                            dailyData[k] = null;
                                            dailyData[`${k}_median`] = null;
                                        }
                                    }
                                    break;
                                }
                                case 'icon':
                                case 'condition': {
                                    const tempArr: { value: string | number; count: number }[] = [];
                                    for (const value of weatherArr[i][k]) {
                                        if (value) {
                                            const index = tempArr.findIndex(el => el.value === value);
                                            if (index !== -1) {
                                                tempArr[index].count++;
                                            } else {
                                                tempArr.push({ value, count: 1 });
                                            }
                                        }
                                    }
                                    tempArr.sort((a, b) => b.count - a.count);
                                    if (tempArr.length > 0) {
                                        if (k === 'icon') {
                                            tempArr[0].value = (tempArr[0].value as string).replace('-night', '-day');
                                        }
                                        dailyData[k] = tempArr[0].value as string;
                                    } else {
                                        dailyData[k] = null;
                                    }
                                    const iconsDay = this.pickDailyWeatherIcon({
                                        condition: weatherArr[i].condition as (string | null | undefined)[],
                                        wind_speed: weatherArr[i].wind_speed as (number | null | undefined)[],
                                        cloud_cover: weatherArr[i].cloud_cover as (number | null | undefined)[],
                                    });
                                    dailyData.icon_special = iconsDay.mdi;
                                    (dailyData as any).iconUrl = iconsDay.url;
                                    break;
                                }
                            }
                        }

                        /*const dailyData: Partial<BrightskyDailyData> = {
                        ...weatherArr.d[i],
                        precipitation_min: weatherArr.min[i].precipitation,
                        precipitation_max: weatherArr.max[i].precipitation,
                        wind_speed_min: weatherArr.min[i].wind_speed,
                        wind_speed_max: weatherArr.max[i].wind_speed,
                        temperature_min: weatherArr.min[i].temperature,
                        temperature_max: weatherArr.max[i].temperature,
                    };*/
                        const times = suncalc.getTimes(
                            new Date(dailyData.timestamp as string),
                            parseFloat(this.config.position.split(',')[0]),
                            parseFloat(this.config.position.split(',')[1]),
                        );
                        dailyData.sunset = times.sunset.getTime();
                        dailyData.sunrise = times.sunrise.getTime();

                        // Calculate day and night data
                        const { dayData, nightData } = this.calculateDayNightData(
                            weatherArr[i],
                            times.sunrise,
                            times.sunset,
                        );
                        dailyData.day = dayData;
                        dailyData.night = nightData;

                        resultArr.push(dailyData);
                    }

                    await this.library.writeFromJson('daily.r', 'weather.daily', genericStateObjects, resultArr, true);

                    await this.setState('info.connection', true, true);
                }
            }
        } catch (error) {
            await this.setState('info.connection', false, true);
            this.log.error(`Error fetching daily weather data: ${JSON.stringify(error)}`);
        }
    }

    async weatherCurrentlyLoop(): Promise<void> {
        if (this.weatherTimeout[0]) {
            this.clearTimeout(this.weatherTimeout[0]);
        }
        await this.weatherCurrentlyUpdate();

        let nextInterval = this.config.pollIntervalCurrently * 60000 + Math.ceil(Math.random() * 8000);

        const coords = this.config.position.split(',').map(parseFloat);
        const { sunrise, sunset } = suncalc.getTimes(new Date(), coords[0], coords[1]);

        const now = Date.now();
        const testTime = now > sunset.getTime() ? sunrise : now > sunrise.getTime() ? sunset : sunrise;

        if (now + nextInterval > testTime.getTime() && testTime.getTime() > now) {
            nextInterval = testTime.getTime() - now + 30000 + Math.ceil(Math.random() * 5000);
        }

        this.weatherTimeout[0] = this.setTimeout(() => {
            void this.weatherCurrentlyLoop();
        }, nextInterval);
    }

    async weatherHourlyLoop(): Promise<void> {
        if (this.weatherTimeout[1]) {
            this.clearTimeout(this.weatherTimeout[1]);
        }
        await this.weatherHourlyUpdate();
        const loopTime =
            new Date().setHours(new Date().getHours() + this.config.pollInterval, 0, 0) +
            3000 +
            Math.ceil(Math.random() * 5000); // Add a random delay of up to 5 second
        this.weatherTimeout[1] = this.setTimeout(() => {
            void this.weatherHourlyLoop();
        }, loopTime - Date.now());
    }
    async weatherHourlyUpdate(): Promise<void> {
        const startTime = new Date(new Date().setMinutes(0, 0, 0)).toISOString();
        const endTime = new Date(new Date().setHours(new Date().getHours() + this.config.hours, 0, 0, 0)).toISOString();
        try {
            const response = await this.fetch(
                `https://api.brightsky.dev/weather?${this.posId}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`,
            );
            if (response.status !== 200) {
                throw new Error(`Error fetching hourly weather data: ${response.status} ${response.statusText}`);
            }
            const result = { data: await response.json() } as {
                data: BrightskyHourly | null;
            };
            if (result.data) {
                this.log.debug(`Hourly weather data fetched successfully: ${JSON.stringify(result.data)}`);

                if (result.data.weather && Array.isArray(result.data.weather)) {
                    const coords = this.config.position.split(',').map(parseFloat);
                    for (const item of result.data.weather) {
                        if (!item) {
                            continue; // Skip if item is null or undefined
                        }
                        item.solar_estimate = 0;
                        item.wind_bearing_text = this.getWindBearingText(item.wind_direction ?? undefined);
                        // Determine day/night for this hour
                        const t = new Date(item.timestamp);
                        const { sunrise, sunset } = suncalc.getTimes(t, coords[0], coords[1]);
                        const isDayTime = t >= sunrise && t <= sunset;
                        // Icons for hourly
                        const iconsHour = this.pickHourlyWeatherIcon({
                            condition: item.condition,
                            wind_speed: item.wind_speed,
                            cloud_cover: item.cloud_cover,
                            day: isDayTime,
                            precipitation_probability: item.precipitation_probability,
                        });
                        (item as any).icon_special = iconsHour.mdi;
                        (item as any).iconUrl = iconsHour.url;
                        if (
                            this.config.position.split(',').length === 2 &&
                            this.config.panels.length > 0 &&
                            item.solar
                        ) {
                            item.solar_estimate = this.estimatePVEnergyForHour(
                                item.solar ?? 0,
                                item.timestamp,
                                {
                                    lat: parseFloat(this.config.position.split(',')[0]),
                                    lon: parseFloat(this.config.position.split(',')[1]),
                                },
                                this.config.panels,
                            );
                            if (item.solar_estimate) {
                                item.solar_estimate = Math.round(item.solar_estimate * 1000) / 1000;
                            }
                        }
                    }
                    await this.library.writeFromJson(
                        'hourly.r',
                        'weather.hourly',
                        genericStateObjects,
                        result.data.weather,
                        true,
                    );
                    await this.library.writedp(
                        'hourly.sources',
                        undefined,
                        genericStateObjects.weather.sources._channel,
                    );
                    await this.library.writeFromJson(
                        'hourly.sources.r',
                        'weather.sources',
                        genericStateObjects,
                        result.data.sources,
                        true,
                    );
                    await this.setState('info.connection', true, true);
                }
            }
        } catch (error) {
            await this.setState('info.connection', false, true);
            this.log.error(`Error fetching weather data: ${JSON.stringify(error)}`);
        }
    }
    async weatherCurrentlyUpdate(): Promise<void> {
        try {
            const response = await this.fetch(
                `https://api.brightsky.dev/current_weather?${this.posId}&max_dist=${this.config.maxDistance}`,
            );
            if (response.status !== 200) {
                throw new Error(`Error fetching current weather data: ${response.status} ${response.statusText}`);
            }
            const result = { data: await response.json() } as any;
            if (result.data) {
                this.log.debug(`Currently weather data fetched successfully: ${JSON.stringify(result.data)}`);
                if (result.data.weather) {
                    const weather = result.data.weather as BrightskyCurrently;
                    weather.wind_bearing_text = this.getWindBearingText(weather.wind_direction_10 ?? undefined);

                    const coords = this.config.position.split(',').map(parseFloat);
                    const { sunrise, sunset } = suncalc.getTimes(new Date(), coords[0], coords[1]);
                    const now = new Date();
                    const isDayTime = now >= sunrise && now <= sunset;

                    const iconsNow = this.pickHourlyWeatherIcon({
                        condition: weather.condition,
                        wind_speed: weather.wind_speed_10,
                        cloud_cover: weather.cloud_cover,
                        day: isDayTime,
                    });
                    weather.icon_special = iconsNow.mdi;
                    weather.iconUrl = iconsNow.url;
                    await this.library.writeFromJson('current', 'weather.current', genericStateObjects, weather, true);
                    await this.library.writedp(
                        'current.sources',
                        undefined,
                        genericStateObjects.weather.sources._channel,
                    );
                    await this.library.writeFromJson(
                        'current.sources.r',
                        'weather.sources',
                        genericStateObjects,
                        result.data.sources,
                        true,
                    );
                    await this.setState('info.connection', true, true);
                }
            }
        } catch (error) {
            await this.setState('info.connection', false, true);
            this.log.error(`Error fetching weather data: ${JSON.stringify(error)}`);
        }
    }

    async weatherRadarLoop(): Promise<void> {
        if (this.weatherTimeout[3]) {
            this.clearTimeout(this.weatherTimeout[3]);
        }
        await this.weatherRadarUpdate();

        // Calculate next interval: configured minutes + 15s + random 0-5s
        const nextInterval = this.config.pollIntervalRadar * 60000 + 15000 + Math.ceil(Math.random() * 5000);

        this.weatherTimeout[3] = this.setTimeout(() => {
            void this.weatherRadarLoop();
        }, nextInterval);
    }

    async weatherRadarUpdate(): Promise<void> {
        try {
            const coords = this.config.position.split(',').map(parseFloat);
            const now = new Date();
            const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

            // Format date for API (ISO 8601)
            const dateParam = now.toISOString();

            const response = await this.fetch(
                `https://api.brightsky.dev/radar?lat=${coords[0]}&lon=${coords[1]}&distance=${this.config.radarDistance}&date=${dateParam}&format=plain`,
            );

            if (response.status !== 200) {
                throw new Error(`Error fetching radar data: ${response.status} ${response.statusText}`);
            }

            const result = (await response.json()) as BrightskyRadarResponse;

            if (result && result.radar && Array.isArray(result.radar)) {
                this.log.debug(`Radar data fetched successfully: ${result.radar.length} items`);

                // Filter data for now to +2 hours
                const filteredRadar = result.radar.filter(item => {
                    const itemTime = new Date(item.timestamp);
                    return itemTime >= now && itemTime <= twoHoursLater;
                });

                // Store radar data with forecast metadata
                const fetchTime = now.toISOString();
                this.radarData = filteredRadar.map(item => {
                    // Collect all precipitation values from 2D array
                    const values: number[] = [];
                    if (Array.isArray(item.precipitation_5)) {
                        for (const row of item.precipitation_5) {
                            if (Array.isArray(row)) {
                                for (const value of row) {
                                    if (typeof value === 'number') {
                                        values.push(value);
                                    }
                                }
                            }
                        }
                    }

                    // Calculate statistics
                    let avg = 0;
                    let min = 0;
                    let max = 0;
                    let median = 0;

                    if (values.length > 0) {
                        // Average
                        const sum = values.reduce((acc, val) => acc + val, 0);
                        avg = sum / values.length;

                        // Min and Max
                        min = Math.min(...values);
                        max = Math.max(...values);

                        // Median
                        const sorted = [...values].sort((a, b) => a - b);
                        const mid = Math.floor(sorted.length / 2);
                        median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
                    }

                    return {
                        timestamp: item.timestamp,
                        source: item.source,
                        precipitation_5: Math.round(avg * 100) / 100, // Round to 2 decimal places
                        precipitation_5_min: Math.round(min * 100) / 100,
                        precipitation_5_max: Math.round(max * 100) / 100,
                        precipitation_5_median: Math.round(median * 100) / 100,
                        forecast_time: fetchTime,
                    };
                });

                // Sort by timestamp to ensure correct order (index 0 = now, index 1 = +5min, etc.)
                this.radarData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                // Write initial data
                await this.writeRadarData();

                // Setup rotation if poll interval > 5 minutes
                if (this.config.pollIntervalRadar > 5) {
                    this.setupRadarRotation();
                }

                await this.setState('info.connection', true, true);
            }
        } catch (error) {
            await this.setState('info.connection', false, true);
            this.log.error(`Error fetching radar data: ${JSON.stringify(error)}`);
        }
    }

    private setupRadarRotation(): void {
        // Clear any existing rotation timeout
        if (this.radarRotationTimeout) {
            this.clearTimeout(this.radarRotationTimeout);
        }

        // Set up rotation every 5 minutes
        const rotateRadarData = async (): Promise<void> => {
            if (this.radarData.length === 0) {
                return;
            }

            // Remove the first item (oldest)
            this.radarData.shift();

            // Add a placeholder at the end to clear outdated values
            // This ensures all time slots get updated properly
            if (this.radarData.length > 0) {
                const lastItem = this.radarData[this.radarData.length - 1];
                const lastTime = new Date(lastItem.timestamp);
                const nextTime = new Date(lastTime.getTime() + 5 * 60 * 1000); // +5 minutes

                this.radarData.push({
                    timestamp: nextTime.toISOString(),
                    source: lastItem.source,
                    precipitation_5: -1, // Placeholder value
                    precipitation_5_min: -1,
                    precipitation_5_max: -1,
                    precipitation_5_median: -1,
                    forecast_time: lastItem.forecast_time,
                });
            }

            // Write rotated data
            await this.writeRadarData();

            // Schedule next rotation
            if (this.radarData.length > 0) {
                this.radarRotationTimeout = this.setTimeout(
                    () => {
                        void rotateRadarData();
                    },
                    5 * 60 * 1000,
                ); // 5 minutes
            }
        };

        // Schedule first rotation in 5 minutes
        this.radarRotationTimeout = this.setTimeout(
            () => {
                void rotateRadarData();
            },
            5 * 60 * 1000,
        );
    }

    private async writeRadarData(): Promise<void> {
        // Create folders named 0, 5, 10, 15, etc. for each 5-minute interval
        const dataToWrite: any[] = [];

        for (let i = 0; i < this.radarData.length; i++) {
            const item = this.radarData[i];
            const minutesOffset = i * 5;

            dataToWrite.push({
                _index: minutesOffset,
                ...item,
            });
        }

        if (dataToWrite.length > 0) {
            await this.library.writeFromJson('radar.r', 'weather.radar', genericStateObjects, dataToWrite, true);
        }
    }

    private getWindBearingText(windBearing: number | undefined): string {
        if (windBearing === undefined) {
            return '';
        }
        const directions = [
            'N',
            'NNE',
            'NE',
            'ENE',
            'E',
            'ESE',
            'SE',
            'SSE',
            'S',
            'SSW',
            'SW',
            'WSW',
            'W',
            'WNW',
            'NW',
            'NNW',
        ];
        const index = Math.round((windBearing % 360) / 22.5) % 16;
        return this.library.getTranslation(directions[index]);
    }

    private onUnload(callback: () => void): void {
        this.unload = true;

        try {
            for (const timeout of this.weatherTimeout) {
                if (timeout) {
                    this.clearTimeout(timeout);
                }
            }
            if (this.radarRotationTimeout) {
                this.clearTimeout(this.radarRotationTimeout);
            }
            if (this.timeoutId) {
                this.clearTimeout(this.timeoutId);
            }
            if (this.controller) {
                this.controller.abort();
                this.controller = null;
            }

            callback();
        } catch {
            callback();
        }
    }
    /**
     * Pick best fitting weather icon (MDI day variant only) for one aggregated daily bucket.
     * Works directly on hourly values (conditions, wind, precipitation, etc.).
     *
     * @param bucket Aggregated hourly data for one day
     * @param bucket.condition Hourly condition values
     * @param bucket.wind_speed Hourly wind speed values
     * @param bucket.cloud_cover Hourly cloud cover values
     * @param bucket.day If false, night icons will be used; defaults to true
     * @returns Weather icon string (MDI icon name, day variant only)
     */
    pickDailyWeatherIcon(bucket: {
        condition: (string | null | undefined)[];
        wind_speed: (number | null | undefined)[];
        cloud_cover?: (number | null | undefined)[];
        day?: boolean;
    }): { mdi: string; url: string } {
        // --- Konstanten (zentral konfigurierbar) ---
        const T = {
            wind: {
                dangerous: 118.8, // km/h Orkan
                strong: 61.2, // km/h Sturm
                breezy: 35, // km/h böig
            },
            rain: {
                heavy: 0.5, // Anteil für heavy rain
                light: 0.2, // Anteil für light rain
                possibleMin: 0.1, // Anteil für possible rain
                possibleMax: 0.35,
                minCount: 2, // min. Stunden für rain relevant
            },
            drizzle: {
                minCount: 2,
                possibleMin: 0.1,
                possibleMax: 0.35,
            },
            snow: {
                heavy: 0.3,
                possibleMin: 0.1,
                possibleMax: 0.35,
                minCount: 2,
            },
            sleet: {
                heavy: 0.3,
                possibleMin: 0.1,
                possibleMax: 0.35,
                minCount: 2,
            },
            hail: {
                possibleMin: 0.01,
                possibleMax: 0.35,
                minCount: 1,
            },
            fog: {
                present: 0.2,
                possibleMin: 0.1,
                possibleMax: 0.35,
                minCount: 4,
            },
            smoke: {
                present: 0.2,
                possibleMin: 0.1,
                possibleMax: 0.35,
                minCount: 3,
            },
            thunder: {
                partly: 0.1,
                solid: 0.35,
            },
            clouds: {
                cloudy: 70,
                partly: 30,
            },
            bucket: {
                minHours: 1,
                defaultHours: 24,
            },
            defaults: {
                iceDay: 'clear-day',
                iceNight: 'clear-night',
            },
        } as const;

        // --- Helpers ---
        /*const avg = (arr: (number | null | undefined)[]): number => {
            const xs = arr.filter((v): v is number => v != null);
            return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
        };*/
        const median = (arr: (number | null | undefined)[]): number => {
            const xs = arr.filter((v): v is number => v != null).sort((a, b) => a - b);
            if (!xs.length) {
                return 0;
            }
            const mid = Math.floor(xs.length / 2);
            return xs.length % 2 === 0 ? (xs[mid - 1] + xs[mid]) / 2 : xs[mid];
        };
        const maxN = (arr: (number | null | undefined)[]): number => {
            const xs = arr.filter((v): v is number => v != null);
            return xs.length ? Math.max(...xs) : 0;
        };
        const count = (arr: (string | null | undefined)[], labels: string[]): number =>
            arr.filter(v => v != null && labels.includes(v)).length;
        // Typ-spezifische possible-Range-Checks
        const inPossibleRange = (frac: number, min: number, max: number): boolean => frac >= min && frac < max;

        // --- Basiswerte aus dem Bucket ---
        const isDay = bucket.day !== false;
        const hours = Math.max(T.bucket.minHours, bucket.condition.length || T.bucket.defaultHours);
        const medianClouds = bucket.cloud_cover ? median(bucket.cloud_cover) : 0;
        const maxWind = maxN(bucket.wind_speed);

        const thunderCount = count(bucket.condition, ['thunderstorm']);
        const hailCount = count(bucket.condition, ['hail']);
        const snowCount = count(bucket.condition, ['snow']);
        const sleetCount = count(bucket.condition, ['sleet']);
        const drizzleCount = count(bucket.condition, ['drizzle']);
        const rainCount = count(bucket.condition, ['rain']);
        const fogCount = count(bucket.condition, ['fog', 'mist', 'haze']);
        const smokeCount = count(bucket.condition, ['smoke']);

        const rainFrac = (rainCount + drizzleCount) / hours;
        const snowFrac = snowCount / hours;
        const sleetFrac = sleetCount / hours;
        const thunderFrac = thunderCount / hours;
        const hailFrac = hailCount / hours;
        const fogFrac = fogCount / hours;
        const smokeFrac = smokeCount / hours;

        // --- Flags (Thunderstorm separat behandeln) ---
        const hasDangerousWind = maxWind >= T.wind.dangerous;
        const hasStrongWind = maxWind >= T.wind.strong;
        const hasBreezyWind = maxWind >= T.wind.breezy;

        const hasThunderSolid = thunderFrac >= T.thunder.solid;
        const hasThunderPartly = !hasThunderSolid && thunderFrac >= T.thunder.partly;

        const hasHeavyRain = rainFrac >= T.rain.heavy;
        const hasLightRain = !hasHeavyRain && rainFrac >= T.rain.light;
        const hasHeavySnow = snowFrac >= T.snow.heavy;
        const hasSleet = sleetCount >= T.sleet.minCount;
        const hasHail = hailCount >= T.hail.minCount;
        const hasFogPresent = fogFrac >= T.fog.present;
        const hasSmokePresent = smokeFrac >= T.smoke.present;

        // --- MDI Auswahl ---
        const selectMdi = (): string => {
            if (hasDangerousWind) {
                return 'weather-tornado';
            }
            if (hasThunderSolid) {
                return 'weather-lightning';
            }
            if (hasThunderPartly) {
                return 'weather-partly-lightning';
            }
            if (hasHail) {
                return 'weather-hail';
            }
            if (hasHeavySnow) {
                return 'weather-snowy-heavy';
            }
            if (hasSleet) {
                return 'weather-snowy-rainy';
            }
            if (hasHeavyRain) {
                return 'weather-pouring';
            }
            if (hasStrongWind) {
                return 'weather-windy';
            }

            if (hasFogPresent || hasSmokePresent) {
                return 'weather-fog';
            }
            if (hasLightRain) {
                return 'weather-rainy';
            }
            if (medianClouds > T.clouds.cloudy) {
                return 'weather-cloudy';
            }
            if (medianClouds > T.clouds.partly) {
                return isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy';
            }
            if (!isDay) {
                return 'weather-night';
            }

            return 'weather-sunny';
        };

        // --- Icebear Auswahl ---
        const selectIcebear = (): string => {
            const daySuffix = isDay ? 'day' : 'night';
            if (hasDangerousWind) {
                return 'dangerous-wind';
            }

            // Thunderstorm ist speziell: kein "possible"-Handling hier
            if (hasThunderSolid || hasThunderPartly) {
                return 'thunderstorm';
            }

            // Hail
            if (hailCount >= T.hail.minCount) {
                if (inPossibleRange(hailFrac, T.hail.possibleMin, T.hail.possibleMax)) {
                    return `possible-hail-${daySuffix}`;
                }
                return 'hail';
            }

            // Snow
            if (snowCount >= T.snow.minCount) {
                if (snowFrac >= T.snow.heavy) {
                    return 'snow';
                }
            }

            // Sleet
            if (sleetCount >= T.sleet.minCount) {
                if (sleetFrac >= T.sleet.heavy) {
                    return 'sleet';
                }
            }

            // Rain
            if (rainCount >= T.rain.minCount) {
                if (rainFrac >= T.rain.heavy) {
                    return 'rain';
                }
            }

            if (hasStrongWind) {
                return 'wind';
            }
            if (snowCount >= T.snow.minCount) {
                if (inPossibleRange(snowFrac, T.snow.possibleMin, T.snow.possibleMax)) {
                    return `possible-snow-${daySuffix}`;
                }
            }

            // Sleet
            if (sleetCount >= T.sleet.minCount) {
                if (inPossibleRange(sleetFrac, T.sleet.possibleMin, T.sleet.possibleMax)) {
                    return `possible-sleet-${daySuffix}`;
                }
            }
            if (rainCount >= T.rain.minCount) {
                if (inPossibleRange(rainFrac, T.rain.possibleMin, T.rain.possibleMax)) {
                    return `possible-rain-${daySuffix}`;
                }
            }

            // Drizzle
            if (drizzleCount >= T.drizzle.minCount) {
                return 'drizzle';
            }

            // Fog
            if (fogCount >= T.fog.minCount) {
                if (fogFrac >= T.fog.present) {
                    return 'fog';
                }
                if (inPossibleRange(fogFrac, T.fog.possibleMin, T.fog.possibleMax)) {
                    return `possible-fog-${daySuffix}`;
                }
            }

            // Smoke
            if (smokeCount >= T.smoke.minCount) {
                if (smokeFrac >= T.smoke.present) {
                    return 'smoke';
                }
                if (inPossibleRange(smokeFrac, T.smoke.possibleMin, T.smoke.possibleMax)) {
                    return `possible-smoke-${daySuffix}`;
                }
            }

            if (medianClouds > T.clouds.cloudy) {
                return 'cloudy';
            }
            if (medianClouds > T.clouds.partly) {
                return `partly-cloudy-${daySuffix}`;
            }

            if (hasBreezyWind) {
                return 'breezy';
            }
            return isDay ? T.defaults.iceDay : T.defaults.iceNight;
        };

        const mdi = selectMdi();
        const iceFile = selectIcebear();
        const icebear = `/adapter/${this.name}/icons/icebear/${iceFile}.svg`;
        return { mdi, url: icebear };
    }

    /**
     * Pick best fitting weather icon for a single hour, honoring day/night, for both MDI and Icebear.
     * Inputs are single values (not arrays) from one hourly datapoint.
     *
     * @param hour Inputs for one hour
     * @param hour.condition Condition string (e.g. rain, snow, fog, thunderstorm, ...)
     * @param hour.wind_speed Wind speed in km/h
     * @param hour.cloud_cover Cloud cover in %
     * @param hour.precipitation_probability Probability of precipitation in % (0..100)
     * @param hour.day Whether it is day (true) or night (false); default true
     */
    pickHourlyWeatherIcon(hour: {
        condition?: string | null;
        wind_speed?: number | null;
        cloud_cover?: number | null;
        precipitation_probability?: number | null; // percent 0..100
        day?: boolean;
    }): { mdi: string; url: string } {
        const T = {
            wind: { dangerous: 118.8, strong: 61.2, breezy: 35 }, // km/h
            clouds: { cloudy: 80, partly: 40 }, // %
            precip: {
                // possible rain via probability window (if no solid precip condition)
                possibleMinPct: 20,
                possibleMaxPct: 60,
            },
        } as const;

        const isDay = hour.day !== false;
        const cond = hour.condition ?? '';
        const wind = hour.wind_speed ?? 0;
        const clouds = hour.cloud_cover ?? 0;
        const prob = hour.precipitation_probability ?? null; // 0..100

        const hasDangerousWind = wind >= T.wind.dangerous;
        const hasStrongWind = wind >= T.wind.strong;
        const hasBreezyWind = wind >= T.wind.breezy;

        const isThunder = cond === 'thunderstorm';
        const isHail = cond === 'hail';
        const isSnow = cond === 'snow';
        const isSleet = cond === 'sleet';
        const isDrizzle = cond === 'drizzle';
        const isRain = cond === 'rain';
        const isFogLike = cond === 'fog' || cond === 'mist' || cond === 'haze';
        const isSmoke = cond === 'smoke';

        const selectMdi = (): string => {
            if (hasDangerousWind) {
                return 'weather-tornado';
            }
            if (isThunder) {
                return 'weather-lightning';
            }
            if (isHail) {
                return 'weather-hail';
            }
            if (isSnow) {
                return 'weather-snowy-heavy';
            }
            if (isSleet) {
                return 'weather-snowy-rainy';
            }
            if (isRain) {
                return 'weather-pouring';
            }
            if (isDrizzle) {
                return 'weather-rainy';
            }
            if (isFogLike || isSmoke) {
                return 'weather-fog';
            }
            if (hasStrongWind) {
                return 'weather-windy';
            }
            if (clouds > T.clouds.cloudy) {
                return 'weather-cloudy';
            }
            if (clouds > T.clouds.partly) {
                return isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy';
            }

            if (!isDay) {
                return 'weather-night';
            }
            return 'weather-sunny';
        };

        const selectIcebear = (): string => {
            const daySuffix = isDay ? 'day' : 'night';
            if (hasDangerousWind) {
                return 'dangerous-wind';
            }
            if (isThunder) {
                return 'thunderstorm';
            }
            if (isHail) {
                return 'hail';
            }
            if (isSnow) {
                return 'snow';
            }
            if (isSleet) {
                return 'sleet';
            }

            // possible rain via probability window when no solid precip condition
            if (!cond && prob != null && prob >= T.precip.possibleMinPct && prob < T.precip.possibleMaxPct) {
                return `possible-rain-${daySuffix}`;
            }

            if (isFogLike) {
                return 'fog';
            }
            if (isSmoke) {
                return 'smoke';
            }
            if (isRain) {
                return 'rain';
            }
            if (isDrizzle) {
                return 'drizzle';
            }

            if (hasStrongWind) {
                return 'wind';
            }
            if (clouds > T.clouds.cloudy) {
                return 'cloudy';
            }

            if (hasBreezyWind) {
                return 'breezy';
            }
            if (clouds > T.clouds.partly) {
                return `partly-cloudy-${daySuffix}`;
            }
            return isDay ? 'clear-day' : 'clear-night';
        };

        const mdi = selectMdi();
        const iceFile = selectIcebear();
        const icebear = `/adapter/${this.name}/icons/icebear/${iceFile}.svg`;
        return { mdi, url: icebear };
    }

    /**
     * Calculate day and night aggregated data from hourly data based on sunrise/sunset times
     *
     * @param dayWeatherArr Hourly weather data for one day
     * @param sunrise Sunrise time
     * @param sunset Sunset time
     * @returns Object containing aggregated day and night data
     */
    private calculateDayNightData(
        dayWeatherArr: Record<string, (string | number | null)[]>,
        sunrise: Date,
        sunset: Date,
    ): { dayData: Partial<BrightskyDayNightData>; nightData: Partial<BrightskyDayNightData> } {
        const dayValues: Record<string, (string | number | null)[]> & { day?: boolean } = {};
        const nightValues: Record<string, (string | number | null)[]> & { day?: boolean } = {};

        dayValues.day = true;
        nightValues.day = false;

        // Initialize arrays for each weather parameter
        for (const key of Object.keys(dayWeatherArr)) {
            dayValues[key] = [];
            nightValues[key] = [];
        }

        // Separate hourly data into day and night based on sunrise/sunset
        const timestamps = dayWeatherArr.timestamp as string[];
        for (let i = 0; i < timestamps.length; i++) {
            if (!timestamps[i]) {
                continue;
            }

            const hourTime = new Date(timestamps[i]);
            const isDayTime = hourTime >= sunrise && hourTime <= sunset;

            for (const key of Object.keys(dayWeatherArr)) {
                const value = dayWeatherArr[key][i];
                if (isDayTime) {
                    dayValues[key].push(value);
                } else {
                    nightValues[key].push(value);
                }
            }
        }

        // Process day data
        const dayData = this.processAggregatedWeatherData(dayValues);

        // Process night data
        const nightData = this.processAggregatedWeatherData(nightValues);

        return { dayData, nightData };
    }

    /**
     * Process aggregated weather data (common logic for both day and night)
     *
     * @param weatherValues Weather data arrays
     * @returns Processed weather data
     */
    private processAggregatedWeatherData(
        weatherValues: Record<string, (string | number | null)[]> & { day?: boolean },
    ): Partial<BrightskyDayNightData> {
        const result: Partial<BrightskyDayNightData> = {};

        for (const key of Object.keys(weatherValues)) {
            const k = key as keyof BrightskyWeather;

            switch (k) {
                case 'precipitation':
                case 'wind_gust_speed':
                case 'precipitation_probability':
                case 'precipitation_probability_6h':
                case 'wind_speed': {
                    const values = weatherValues[k] as (number | null)[];
                    if (values && values.length > 0) {
                        for (let j = 0; j < values.length; j++) {
                            if (values[j] === null) {
                                values[j] = 0; // Set null values to 0
                            }
                        }
                    }
                }
            }

            switch (k) {
                case 'timestamp': {
                    result.timestamp = weatherValues.timestamp[0] as string;
                    break;
                }
                case 'source_id': {
                    result.source_id = weatherValues.source_id[0] as number;
                    break;
                }
                case 'precipitation':
                case 'wind_speed':
                case 'solar':
                case 'temperature': {
                    const values = weatherValues[k] as (number | null)[];
                    if (values && values.length > 0) {
                        const min = Math.min(...(values.filter(v => v !== null) as number[]));
                        const max = Math.max(...(values.filter(v => v !== null) as number[]));

                        if (k !== 'solar') {
                            (result as any)[`${k}_min`] = min !== Infinity ? min : null;
                        }
                        (result as any)[`${k}_max`] = max !== -Infinity ? max : null;
                    } else {
                        if (k !== 'solar') {
                            (result as any)[`${k}_min`] = null;
                        }
                        (result as any)[`${k}_max`] = null;
                    }
                }
                // eslint-disable-next-line no-fallthrough
                case 'sunshine': {
                    if (k === 'precipitation' || k === 'sunshine' || k === 'solar') {
                        const t = weatherValues[k].reduce((sum, value) => {
                            if (typeof sum !== 'number') {
                                sum = 0; // Initialize sum to 0 if it's not a number
                            }
                            if (value != null && typeof value === 'number') {
                                return sum + value;
                            }
                            return sum;
                        }, 0);
                        result[k] = null;
                        if (t !== null && typeof t === 'number') {
                            result[k] = k !== 'solar' ? Math.round(t * 10) / 10 : Math.round(t * 1000) / 1000;
                        }
                        break;
                    }
                }
                // eslint-disable-next-line no-fallthrough
                case 'wind_direction':
                case 'cloud_cover':
                case 'dew_point':
                case 'relative_humidity':
                case 'visibility':
                case 'wind_gust_direction':
                case 'wind_gust_speed':
                case 'precipitation_probability':
                case 'precipitation_probability_6h': {
                    const values = weatherValues[k] as (number | null)[];
                    if (values && values.length > 0) {
                        let median: number | null = null;
                        if (values.filter(v => v !== null).length > 0) {
                            const sortedValues = values
                                .filter(v => v !== null)
                                .sort((a, b) => (a as number) - (b as number));
                            const mid = Math.floor(sortedValues.length / 2);
                            if (sortedValues.length % 2 === 0) {
                                median = ((sortedValues[mid - 1] as number) + (sortedValues[mid] as number)) / 2;
                            } else {
                                median = sortedValues[mid] as number;
                            }
                        }
                        let avg = values.reduce((sum, value) => {
                            if (value != null) {
                                return sum == null ? 0 + (value as number) : (sum as number) + (value as number);
                            }
                            return sum;
                        }, 0);
                        if (avg != null) {
                            if (values.filter(v => v !== null).length > 2) {
                                avg = Math.round(((avg as number) / values.filter(v => v !== null).length) * 10) / 10;
                            } else {
                                avg = null;
                            }
                        }
                        (result as any)[`${k}_median`] = median;
                        result[k] = avg as number;
                    } else {
                        result[k] = null;
                        (result as any)[`${k}_median`] = null;
                    }
                    break;
                }
                case 'icon':
                case 'condition': {
                    const tempArr: { value: string | number; count: number }[] = [];
                    for (const value of weatherValues[k]) {
                        if (value) {
                            const index = tempArr.findIndex(el => el.value === value);
                            if (index !== -1) {
                                tempArr[index].count++;
                            } else {
                                tempArr.push({ value, count: 1 });
                            }
                        }
                    }
                    tempArr.sort((a, b) => b.count - a.count);
                    if (tempArr.length > 0) {
                        if (k === 'icon') {
                            if (weatherValues.day !== false) {
                                tempArr[0].value = (tempArr[0].value as string).replace('-night', '-day');
                            }
                        }
                        result[k] = tempArr[0].value as string;
                    } else {
                        result[k] = null;
                    }
                    const iconsAgg = this.pickDailyWeatherIcon({
                        condition: weatherValues.condition as (string | null | undefined)[],
                        wind_speed: weatherValues.wind_speed as (number | null | undefined)[],
                        cloud_cover: weatherValues.cloud_cover as (number | null | undefined)[],
                        day: weatherValues.day,
                    });
                    result.icon_special = iconsAgg.mdi;
                    result.iconUrl = iconsAgg.url;
                    break;
                }
                case 'pressure_msl': {
                    const values = weatherValues[k] as (number | null)[];
                    if (values && values.length > 0) {
                        let median: number | null = null;
                        if (values.filter(v => v !== null).length > 0) {
                            const sortedValues = values
                                .filter(v => v !== null)
                                .sort((a, b) => (a as number) - (b as number));
                            const mid = Math.floor(sortedValues.length / 2);
                            if (sortedValues.length % 2 === 0) {
                                median = ((sortedValues[mid - 1] as number) + (sortedValues[mid] as number)) / 2;
                            } else {
                                median = sortedValues[mid] as number;
                            }
                        }
                        let avg = values.reduce((sum, value) => {
                            if (value != null) {
                                return sum == null ? 0 + (value as number) : (sum as number) + (value as number);
                            }
                            return sum;
                        }, 0);
                        if (avg != null && values.filter(v => v !== null).length > 2) {
                            avg = Math.round(((avg as number) / values.filter(v => v !== null).length) * 10) / 10;
                        } else {
                            avg = null;
                        }
                        (result as any)[`${k}_median`] = median;
                        result[k] = avg as number;
                    } else {
                        result[k] = null;
                        (result as any)[`${k}_median`] = null;
                    }
                    break;
                }
            }
        }

        return result;
    }

    /**
     * Schätzt die erzeugte elektrische Energie (Wh) für die kommende Stunde.
     *
     * @param valueWhPerM2 GHI für die Stunde (Wh/m²) auf horizontaler Ebene
     * @param time Zeitstempel dieser Stunde (Date | number | string)
     * @param coords { lat, lon }
     * @param panels Array von Panels (azimuth, tilt, area, efficiency in %)
     * @returns Wh (elektrisch) für alle Panels zusammen
     */
    estimatePVEnergyForHour(
        valueWhPerM2: number,
        time: Date | number | string,
        coords: Coords,
        panels: Panel[],
    ): number {
        let quarterHoursValueSum = 0;
        for (let i = 0; i < 4; i++) {
            const quarterHourTime =
                time instanceof Date
                    ? new Date(time.getTime() + i * 15 * 60000)
                    : typeof time === 'number'
                      ? new Date(time + i * 15 * 60000)
                      : new Date(new Date(time).getTime() + i * 15 * 60000);
            quarterHoursValueSum += this.estimatePvEnergy(valueWhPerM2, quarterHourTime, coords, panels, this.wrArray);
        }
        return quarterHoursValueSum / 4;
    }
    estimatePvEnergy(
        valueWhPerM2: number,
        time: Date | number | string,
        coords: Coords,
        panels: Panel[],
        wrArray: number[],
    ): number {
        // ===== Helpers (funktion-lokal) =====
        const toRad = (d: number): number => (d * Math.PI) / 180;
        const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
        const normEff = (pct: number): number => clamp01(pct / 100); // 0..100% → 0..1

        // Konstanten (einfaches, robustes Modell)
        const ALBEDO = 0.2; // Bodenreflexionsfaktor

        // Sonnenstand holen
        const date = time instanceof Date ? time : new Date(time);
        const pos = suncalc.getPosition(date, coords.lat, coords.lon);
        const sunEl = pos.altitude; // Elevation in rad
        // SunCalc-Azimut: 0 = Süd, +West; auf 0=N, 90=E normieren:
        const sunAzDeg = ((pos.azimuth * 180) / Math.PI + 180 + 360) % 360;
        const sunAz = toRad(sunAzDeg);

        if (sunEl <= 0 || valueWhPerM2 <= 0 || panels.length === 0) {
            return 0;
        }

        // Grobe Aufteilung in Direkt/Diffus aus Elevation (ohne externe Daten):
        const beamFraction = clamp01(Math.sin(sunEl) * 1.1);
        const diffuseFraction = 1 - beamFraction;

        let totalWh = 0;
        for (let w = 0; w < wrArray.length; w++) {
            const maxPower = wrArray[w];
            let totalGroupPower = 0;

            for (const p of this.groupArray[w]) {
                p.wr = p.wr ?? 0;
                if (p.wr !== w) {
                    continue;
                }
                const eff = normEff(p.efficiency);
                if (eff <= 0 || p.area <= 0) {
                    continue;
                }

                const tilt = toRad(p.tilt);
                const az = toRad(((p.azimuth % 360) + 360) % 360);

                // Modulnormalen-Vektor
                const nx = Math.sin(tilt) * Math.sin(az);
                const ny = Math.sin(tilt) * Math.cos(az);
                const nz = Math.cos(tilt);

                // Sonnenvektor
                const sx = Math.cos(sunEl) * Math.sin(sunAz);
                const sy = Math.cos(sunEl) * Math.cos(sunAz);
                const sz = Math.sin(sunEl);

                // Einfallswinkel
                const cosTheta = Math.max(0, nx * sx + ny * sy + nz * sz);

                // Direktanteil von horizontal → Modulfläche
                const dirGain = cosTheta / Math.max(1e-6, Math.sin(sunEl));

                // Diffus isotrop + Bodenreflexion
                const skyDiffuseGain = (1 + Math.cos(tilt)) / 2;
                const groundRefGain = (ALBEDO * (1 - Math.cos(tilt))) / 2;

                // POA-Energie (Wh/m²) auf dem Modul für die Stunde
                const poaWhPerM2 =
                    valueWhPerM2 * (beamFraction * dirGain + diffuseFraction * skyDiffuseGain + groundRefGain);

                // Elektrische Energie
                const elecWh = Math.max(0, poaWhPerM2) * p.area * eff;
                totalGroupPower += elecWh; // max. Wechselrichter-Leistung beachten
            }
            totalWh += maxPower > 0 ? Math.min(maxPower, totalGroupPower) : totalGroupPower;
        }

        return totalWh;
    }

    async fetch(url: string, init?: RequestInit): Promise<Response> {
        this.controller = new AbortController();
        const currentController = this.controller;
        this.timeoutId = this.setTimeout(() => {
            if (this.controller === currentController && this.controller) {
                this.controller.abort();
                this.controller = null;
            }
        }, 30000); // 30 seconds timeout

        try {
            const response = await fetch(url, {
                ...init,
                method: init?.method ?? 'GET',
                signal: this.controller.signal,
            });

            // Clear the timeout since the request completed
            this.clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
            this.controller = null;
            return response;
        } catch (error) {
            this.clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
            this.controller = null;
            throw error;
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Brightsky(options);
} else {
    // otherwise start the instance directly
    (() => new Brightsky())();
}
