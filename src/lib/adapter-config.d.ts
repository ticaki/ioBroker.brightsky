// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            /**
             * Position for the BrightSky adapter.
             * This can be a city name, coordinates, or an empty string for default location.
             */
            position: string;

            /**
             * Polling interval in minutes.
             * Default is 1 minute.
             */
            pollInterval: number;

            hours: number;
            /**
             * Maximum distance in meters for location-based queries.
             * Default is 50000 meters (50 km).
             */
            maxDistance: number;

            pollIntervalCurrently: number;

            createCurrently: boolean;
            createHourly: boolean;
            createDaily: boolean;
            wmo_station: string;
            dwd_station_id: string;

            panels: Array<{
                azimuth: number;
                tilt: number;
                area: number;
                efficiency: number;
            }>;
        }
    }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
