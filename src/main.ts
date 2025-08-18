/*
 * Created with @iobroker/create-adapter v2.6.5
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import axios from 'axios';
import { Library } from './lib/library';
import { genericStateObjects } from './lib/definition';

// Load your modules here, e.g.:
// import * as fs from "fs";

class Brightsky extends utils.Adapter {
    library: Library;
    unload: boolean = false;
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
        await this.delay(2000); // Wait for 1 second to ensure the adapter is ready
        await this.weatherCurrentlyLoop();
        await this.delay(5000);
        await this.weatherHourlyLoop();
        this.log.info(
            `Adapter ${this.namespace} is now ready. Weather data will be updated every ${this.config.pollIntervalCurrently} minutes for current weather and every ${this.config.pollInterval} hours for hourly weather.`,
        );
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
                `https://api.brightsky.dev/weather?lat=${this.config.position.split(',')[0]}&lon=${this.config.position.split(',')[1]}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`,
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
                `https://api.brightsky.dev/current_weather?lat=${this.config.position.split(',')[0]}&lon=${this.config.position.split(',')[1]}&max_dist=${this.config.maxDistance}`,
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
