/*
 * Created with @iobroker/create-adapter v2.6.5
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import axios from 'axios';
import { Library } from './lib/library';
import { genericStateObjects, type BrightskyDailyData, type BrightskyWeather } from './lib/definition';

axios.defaults.timeout = 15000; // Set a default timeout of 10 seconds for all axios requests

// Load your modules here, e.g.:
// import * as fs from "fs";

class Brightsky extends utils.Adapter {
    library: Library;
    unload: boolean = false;
    posId: string = '';
    weatherTimeout: (ioBroker.Timeout | null | undefined)[] = [];

    weatherArray: any[] = [];
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
        await this.setState('info.connection', false, true);
        if (!this.config.createDaily) {
            await this.delObjectAsync('daily', { recursive: true });
        }
        if (!this.config.createCurrently) {
            await this.delObjectAsync('current', { recursive: true });
        }
        if (!this.config.createHourly) {
            await this.delObjectAsync('hourly', { recursive: true });
        }
        if (!this.config.createCurrently && !this.config.createHourly && !this.config.createDaily) {
            this.log.error(
                'No data creation is enabled in the adapter configuration. Please enable at least one of the options: Currently, Hourly, or Daily.',
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
        if (this.config.hours == undefined || this.config.hours < 0 || this.config.hours > 48) {
            this.log.warn(`Invalid hours to display: ${this.config.hours}. Using default value of 24 hours.`);
            this.config.hours = 24; // Default to 24 hours if invalid
        }

        if (this.config.pollInterval == undefined || this.config.pollInterval < 1) {
            this.log.warn(`Invalid poll interval: ${this.config.pollInterval}. Using default value of 12 hour.`);
            this.config.pollInterval = 12; // Default to 1 hour if invalid
        }
        if (
            this.config.pollIntervalCurrently == undefined ||
            this.config.pollIntervalCurrently < 10 ||
            this.config.pollIntervalCurrently >= 2 ** 21 / 60000
        ) {
            this.log.warn(
                `Invalid poll interval currently: ${this.config.pollIntervalCurrently}. Using default value of 30 minute.`,
            );
            this.config.pollIntervalCurrently = 30; // Default to 1 minute if invalid
        }

        if (this.config.maxDistance == undefined || this.config.maxDistance < 1000) {
            this.log.warn(`Invalid max distance: ${this.config.maxDistance}. Using default value of 50000 meters.`);
            this.config.maxDistance = 50000; // Default to 50 km if invalid
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
        this.log.info(
            `Adapter started with configuration: Position: ${this.config.position}, WMO Station ID: ${this.config.wmo_station}, DWD Station ID: ${this.config.dwd_station_id}, ${this.config.createCurrently ? `Currently data enabled. Poll interval: ${this.config.pollIntervalCurrently} minutes` : 'Currently data disabled'} - ${this.config.createHourly ? `Hourly data enabled. Poll interval: ${this.config.pollInterval} hours` : 'Hourly data disabled'} - ${this.config.createDaily ? 'Daily data enabled.' : 'Daily data disabled'}, Max distance: ${this.config.maxDistance} meters.`,
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
            const result = await axios.get(
                `https://api.brightsky.dev/weather?${this.posId}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`,
            );
            this.log.debug(
                `https://api.brightsky.dev/weather?lat=${this.config.position.split(',')[0]}&lon=${this.config.position.split(',')[1]}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`,
            );
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
                                        }
                                        dailyData[`${k}_max`] = max !== -Infinity ? max : null;
                                    } else {
                                        if (k !== 'solar') {
                                            dailyData[`${k}_min`] = null;
                                        }
                                        dailyData[`${k}_max`] = null;
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

        this.weatherTimeout[0] = this.setTimeout(
            () => {
                void this.weatherCurrentlyLoop();
            },
            this.config.pollIntervalCurrently * 60000 + Math.ceil(Math.random() * 8000),
        );
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
            const result = await axios.get(
                `https://api.brightsky.dev/weather?${this.posId}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`,
            );
            if (result.data) {
                this.log.debug(`Hourly weather data fetched successfully: ${JSON.stringify(result.data)}`);
                if (result.data.weather && Array.isArray(result.data.weather)) {
                    /*for (const item in result.data.weather) {
                        const index = this.weatherArray.findIndex(
                            el => el.timestamp === result.data.weather[item].timestamp,
                        );
                        if (index !== -1) {
                            this.weatherArray[index] = result.data.weather[item];
                        } else {
                            this.weatherArray.push(result.data.weather[item]);
                        }
                    }*/
                    await this.library.writeFromJson(
                        'hourly.r',
                        'weather.hourly',
                        genericStateObjects,
                        result.data.weather,
                        true,
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
            const result = await axios.get(
                `https://api.brightsky.dev/current_weather?${this.posId}&max_dist=${this.config.maxDistance}`,
            );
            if (result.data) {
                this.log.debug(`Currently weather data fetched successfully: ${JSON.stringify(result.data)}`);
                if (result.data.weather) {
                    await this.library.writeFromJson(
                        'current',
                        'weather.current',
                        genericStateObjects,
                        result.data.weather,
                        true,
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

    private onUnload(callback: () => void): void {
        this.unload = true;

        try {
            for (const timeout of this.weatherTimeout) {
                if (timeout) {
                    this.clearTimeout(timeout);
                }
            }

            callback();
        } catch {
            callback();
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
