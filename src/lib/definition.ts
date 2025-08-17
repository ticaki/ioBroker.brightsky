/*type ChangeTypeToChannelAndState<Obj> = Obj extends object
    ? {
          [K in keyof Obj]-?: ChangeTypeToChannelAndState<Obj[K]>;
      } & customChannelType
    : ioBroker.StateObject;
export type ChangeToChannel<Obj, T> = Obj extends object
    ? { [K in keyof Obj]-?: customChannelType & T }
    : ioBroker.StateObject;
*/
export type ChangeTypeOfKeysForState<Obj, N> = Obj extends object
    ? customChannelType & { [K in keyof Obj]: ChangeTypeOfKeysForState<Obj[K], N> }
    : N;
export type customChannelType = {
    _channel?: ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.FolderObject;
    _array?: ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.FolderObject;
};

export const defaultChannel: ioBroker.ChannelObject = {
    _id: '',
    type: 'channel',
    common: {
        name: 'Hey no description... ',
    },
    native: {},
};

const BrightskyCurrentlyFallback: ChangeTypeOfKeysForState<BrightskyCurrentlyFallback, ioBroker.StateObject> = {
    cloud_cover: {
        _id: 'cloud_cover',
        type: 'state',
        common: {
            name: 'Cloud Cover',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            unit: '%',
        },
        native: {},
    },
    condition: {
        _id: 'condition',
        type: 'state',
        common: {
            name: 'Condition',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    solar_10: {
        _id: 'solar_10',
        type: 'state',
        common: {
            name: 'Solar Radiation 10 min',
            type: 'number',
            role: 'value.power',
            read: true,
            write: false,
            unit: 'kWh/m²',
        },
        native: {},
    },
    solar_30: {
        _id: 'solar_30',
        type: 'state',
        common: {
            name: 'Solar Radiation 30 min',
            type: 'number',
            role: 'value.power',
            read: true,
            write: false,
            unit: 'kWh/m²',
        },
        native: {},
    },
    solar_60: {
        _id: 'solar_60',
        type: 'state',
        common: {
            name: 'Solar Radiation 60 min',
            type: 'number',
            role: 'value.power',
            read: true,
            write: false,
            unit: 'kWh/m²',
        },
        native: {},
    },
    precipitation_10: {
        _id: 'precipitation_10',
        type: 'state',
        common: {
            name: 'Precipitation 10 min',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            unit: 'mm',
        },
        native: {},
    },
    precipitation_30: {
        _id: 'precipitation_30',
        type: 'state',
        common: {
            name: 'Precipitation 30 min',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            unit: 'mm',
        },
        native: {},
    },
    precipitation_60: {
        _id: '',
        type: 'state',
        common: {
            name: 'Precipitation 60 min',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            unit: 'mm',
        },
        native: {},
    },
    relative_humidity: {
        _id: 'relative_humidity',
        type: 'state',
        common: {
            name: 'Relative Humidity',
            type: 'number',
            role: 'value.humidity',
            read: true,
            write: false,
            unit: '%',
        },
        native: {},
    },
    visibility: {
        _id: 'visibility',
        type: 'state',
        common: {
            name: 'Visibility',
            type: 'number',
            role: 'value.distance',
            read: true,
            write: false,
            unit: 'm',
        },
        native: {},
    },
    wind_gust_direction_10: {
        _id: 'wind_gust_direction_10',
        type: 'state',
        common: {
            name: 'Wind Gust Direction 10 min',
            type: 'number',
            role: 'value.direction',
            read: true,
            write: false,
            unit: '°',
        },
        native: {},
    },
    wind_gust_direction_30: {
        _id: 'wind_gust_direction_30',
        type: 'state',
        common: {
            name: 'Wind Gust Direction 30 min',
            type: 'number',
            role: 'value.direction',
            read: true,
            write: false,
            unit: '°',
        },
        native: {},
    },
    wind_gust_direction_60: {
        _id: 'wind_gust_direction_60',
        type: 'state',
        common: {
            name: 'Wind Gust Direction 60 min',
            type: 'number',
            role: 'value.direction',
            read: true,
            write: false,
            unit: '°',
        },
        native: {},
    },
    wind_gust_speed_10: {
        _id: 'wind_gust_speed_10',
        type: 'state',
        common: {
            name: 'Wind Gust Speed 10 min',
            type: 'number',
            role: 'value.speed',
            read: true,
            write: false,
            unit: 'km/h',
        },
        native: {},
    },
    wind_gust_speed_30: {
        _id: 'wind_gust_speed_30',
        type: 'state',
        common: {
            name: 'Wind Gust Speed 30 min',
            type: 'number',
            role: 'value.speed',
            read: true,
            write: false,
            unit: 'km/h',
        },
        native: {},
    },
    wind_gust_speed_60: {
        _id: 'wind_gust_speed_60',
        type: 'state',
        common: {
            name: 'Wind Gust Speed 60 min',
            type: 'number',
            role: 'value.speed',
            read: true,
            write: false,
            unit: 'km/h',
        },
        native: {},
    },
    sunshine_30: {
        _id: 'sunshine_30',
        type: 'state',
        common: {
            name: 'Sunshine 30 min',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    },
    sunshine_60: {
        _id: 'sunshine_60',
        type: 'state',
        common: {
            name: 'Sunshine 60 min',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
        },
        native: {},
    },
};

export const genericStateObjects: {
    default: ioBroker.StateObject;
    customString: ioBroker.StateObject;
    weather: customChannelType & {
        hourly: customChannelType & ChangeTypeOfKeysForState<BrightskyWeather, ioBroker.StateObject>;
        /*daily: customChannelType &
            ChangeTypeOfKeysForState<MetaData, ioBroker.StateObject> &
            ChangeTypeOfKeysForState<DailyData, ioBroker.StateObject>;*/

        sources: customChannelType & ChangeTypeOfKeysForState<BrightskySource, ioBroker.StateObject>;
        current: customChannelType & ChangeTypeOfKeysForState<BrightskyCurrently, ioBroker.StateObject>;
    };
} = {
    default: {
        _id: 'No_definition',
        type: 'state',
        common: {
            name: 'StateObjects.state',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },

    customString: {
        _id: 'User_State',
        type: 'state',
        common: {
            name: 'StateObjects.customString',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    weather: {
        _channel: {
            _id: '',
            type: 'folder',
            common: {
                name: 'Weather',
            },
            native: {},
        },
        hourly: {
            _channel: {
                _id: '',
                type: 'folder',
                common: {
                    name: 'Hourly',
                },
                native: {},
            },
            _array: {
                _id: '',
                type: 'folder',
                common: {
                    name: 'Hourly',
                },
                native: {},
            },
            timestamp: {
                _id: 'timestamp',
                type: 'state',
                common: {
                    name: 'Timestamp',
                    type: 'string',
                    role: 'date',
                    read: true,
                    write: false,
                },
                native: {},
            },
            source_id: {
                _id: 'source_id',
                type: 'state',
                common: {
                    name: 'Source ID',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            precipitation: {
                _id: 'precipitation',
                type: 'state',
                common: {
                    name: 'Precipitation',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                    unit: 'mm',
                },
                native: {},
            },
            pressure_msl: {
                _id: 'pressure_msl',
                type: 'state',
                common: {
                    name: 'Pressure MSL',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                    unit: 'hPa',
                },
                native: {},
            },
            sunshine: {
                _id: 'sunshine',
                type: 'state',
                common: {
                    name: 'Sunshine',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            temperature: {
                _id: 'temperature',
                type: 'state',
                common: {
                    name: 'Temperature',
                    type: 'number',
                    role: 'value.temperature',
                    read: true,
                    write: false,
                    unit: '°C',
                },
                native: {},
            },
            wind_direction: {
                _id: 'wind_direction',
                type: 'state',
                common: {
                    name: 'Wind Direction',
                    type: 'number',
                    role: 'value.direction',
                    read: true,
                    write: false,
                    unit: '°',
                },
                native: {},
            },
            wind_speed: {
                _id: 'wind_speed',
                type: 'state',
                common: {
                    name: 'Wind Speed',
                    type: 'number',
                    role: 'value.speed',
                    read: true,
                    write: false,
                    unit: 'km/h',
                },
                native: {},
            },
            cloud_cover: {
                _id: 'cloud_cover',
                type: 'state',
                common: {
                    name: 'Cloud Cover',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                    unit: '%',
                },
                native: {},
            },
            dew_point: {
                _id: 'dew_point',
                type: 'state',
                common: {
                    name: 'Dew Point',
                    type: 'number',
                    role: 'value.temperature.dewpoint',
                    read: true,
                    write: false,
                    unit: '°C',
                },
                native: {},
            },
            relative_humidity: {
                _id: 'relative_humidity',
                type: 'state',
                common: {
                    name: 'Relative Humidity',
                    type: 'number',
                    role: 'value.humidity',
                    read: true,
                    write: false,
                    unit: '%',
                },
                native: {},
            },
            visibility: {
                _id: 'visibility',
                type: 'state',
                common: {
                    name: 'Visibility',
                    type: 'number',
                    role: 'value.distance',
                    read: true,
                    write: false,
                    unit: 'm',
                },
                native: {},
            },
            wind_gust_direction: {
                _id: 'wind_gust_direction',
                type: 'state',
                common: {
                    name: 'Wind Gust Direction',
                    type: 'number',
                    role: 'value.direction',
                    read: true,
                    write: false,
                    unit: '°',
                },
                native: {},
            },
            wind_gust_speed: {
                _id: 'wind_gust_speed',
                type: 'state',
                common: {
                    name: 'Wind Gust Speed',
                    type: 'number',
                    role: 'value.speed',
                    read: true,
                    write: false,
                    unit: 'km/h',
                },
                native: {},
            },
            condition: {
                _id: 'condition',
                type: 'state',
                common: {
                    name: 'Condition',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
            precipitation_probability: {
                _id: 'precipitation_probability',
                type: 'state',
                common: {
                    name: 'Precipitation Probability',
                    type: 'number',
                    role: 'value.probability',
                    read: true,
                    write: false,
                    unit: '%',
                },
                native: {},
            },
            precipitation_probability_6h: {
                _id: 'precipitation_probability_6h',
                type: 'state',
                common: {
                    name: 'Precipitation Probability 6h',
                    type: 'number',
                    role: 'value.probability',
                    read: true,
                    write: false,
                    unit: '%',
                },
                native: {},
            },
            solar: {
                _id: 'solar',
                type: 'state',
                common: {
                    name: 'Solar Radiation',
                    type: 'number',
                    role: 'value.power',
                    read: true,
                    write: false,
                    unit: 'kWh/m²',
                },
                native: {},
            },
            icon: {
                _id: 'icon',
                type: 'state',
                common: {
                    name: 'Weather Icon',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
        },
        sources: {
            _channel: {
                _id: '',
                type: 'folder',
                common: {
                    name: 'Station',
                },
                native: {},
            },
            id: {
                _id: 'id',
                type: 'state',
                common: {
                    name: 'Station ID',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            dwd_station_id: {
                _id: 'dwd_station_id',
                type: 'state',
                common: {
                    name: 'DWD Station ID',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
            observation_type: {
                _id: 'observation_type',
                type: 'state',
                common: {
                    name: 'Observation Type',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
            lat: {
                _id: 'lat',
                type: 'state',
                common: {
                    name: 'Latitude',
                    type: 'number',
                    role: 'value.gps.latitude',
                    read: true,
                    write: false,
                },
                native: {},
            },
            lon: {
                _id: 'lon',
                type: 'state',
                common: {
                    name: 'Longitude',
                    type: 'number',
                    role: 'value.gps.longitude',
                    read: true,
                    write: false,
                },
                native: {},
            },
            height: {
                _id: 'height',
                type: 'state',
                common: {
                    name: 'Height',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            station_name: {
                _id: 'station_name',
                type: 'state',
                common: {
                    name: 'Station Name',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
            wmo_station_id: {
                _id: 'wmo_station_id',
                type: 'state',
                common: {
                    name: 'WMO Station ID',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
            first_record: {
                _id: 'first_record',
                type: 'state',
                common: {
                    name: 'First Record',
                    type: 'string',
                    role: 'date',
                    read: true,
                    write: false,
                },
                native: {},
            },
            last_record: {
                _id: 'last_record',
                type: 'state',
                common: {
                    name: 'Last Record',
                    type: 'string',
                    role: 'date',
                    read: true,
                    write: false,
                },
                native: {},
            },
            distance: {
                _id: 'distance',
                type: 'state',
                common: {
                    name: 'Distance',
                    type: 'number',
                    role: 'value.distance',
                    read: true,
                    write: false,
                },
                native: {},
            },
        },
        current: {
            ...BrightskyCurrentlyFallback,
            _channel: {
                _id: '',
                type: 'folder',
                common: {
                    name: 'Current Weather',
                },
                native: {},
            },
            timestamp: {
                _id: 'timestamp',
                type: 'state',
                common: {
                    name: 'Timestamp',
                    type: 'string',
                    role: 'date',
                    read: true,
                    write: false,
                },
                native: {},
            },
            source_id: {
                _id: 'source_id',
                type: 'state',
                common: {
                    name: 'Source ID',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                },
                native: {},
            },
            dew_point: {
                _id: 'dew_point',
                type: 'state',
                common: {
                    name: 'Dew Point',
                    type: 'number',
                    role: 'value.temperature.dewpoint',
                    read: true,
                    write: false,
                    unit: '°C',
                },
                native: {},
            },
            pressure_msl: {
                _id: 'pressure_msl',
                type: 'state',
                common: {
                    name: 'Pressure MSL',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false,
                    unit: 'hPa',
                },
                native: {},
            },
            wind_direction_10: {
                _id: 'wind_direction_10',
                type: 'state',
                common: {
                    name: 'Wind Direction 10 min',
                    type: 'number',
                    role: 'value.direction',
                    read: true,
                    write: false,
                    unit: '°',
                },
                native: {},
            },
            wind_direction_30: {
                _id: 'wind_direction_30',
                type: 'state',
                common: {
                    name: 'Wind Direction 30 min',
                    type: 'number',
                    role: 'value.direction',
                    read: true,
                    write: false,
                    unit: '°',
                },
                native: {},
            },
            wind_direction_60: {
                _id: 'wind_direction_60',
                type: 'state',
                common: {
                    name: 'Wind Direction 60 min',
                    type: 'number',
                    role: 'value.direction',
                    read: true,
                    write: false,
                    unit: '°',
                },
                native: {},
            },
            wind_speed_10: {
                _id: 'wind_speed_10',
                type: 'state',
                common: {
                    name: 'Wind Speed 10 min',
                    type: 'number',
                    role: 'value.speed',
                    read: true,
                    write: false,
                    unit: 'km/h',
                },
                native: {},
            },
            wind_speed_30: {
                _id: 'wind_speed_30',
                type: 'state',
                common: {
                    name: 'Wind Speed 30 min',
                    type: 'number',
                    role: 'value.speed',
                    read: true,
                    write: false,
                    unit: 'km/h',
                },
                native: {},
            },
            wind_speed_60: {
                _id: 'wind_speed_60',
                type: 'state',
                common: {
                    name: 'Wind Speed 60 min',
                    type: 'number',
                    role: 'value.speed',
                    read: true,
                    write: false,
                    unit: 'km/h',
                },
                native: {},
            },
            temperature: {
                _id: 'temperature',
                type: 'state',
                common: {
                    name: 'Temperature',
                    type: 'number',
                    role: 'value.temperature',
                    read: true,
                    write: false,
                    unit: '°C',
                },
                native: {},
            },
            fallback_source_ids: {
                _channel: {
                    _id: 'fallback_source_ids',
                    type: 'folder',
                    common: {
                        name: 'Fallback Source IDs',
                    },
                    native: {},
                },
                ...BrightskyCurrentlyFallback,
            },
            icon: {
                _id: 'icon',
                type: 'state',
                common: {
                    name: 'Weather Icon',
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            },
        },
    },
};

export const Defaults = {
    state: {
        _id: 'No_definition',
        type: 'state',
        common: {
            name: 'No definition',

            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
};

// ...existing code...

// ...existing code...

// Gemeinsame Typen für Wetterdaten
export type BrightskyWeather = {
    timestamp: string;
    source_id: number;
    precipitation: number;
    pressure_msl: number;
    sunshine: number;
    temperature: number;
    wind_direction: number;
    wind_speed: number;
    cloud_cover: number;
    dew_point: number;
    relative_humidity: number | null;
    visibility: number;
    wind_gust_direction: number | null;
    wind_gust_speed: number;
    condition: string;
    precipitation_probability: number;
    precipitation_probability_6h: number | null;
    solar: number;
    icon: string;
};

// Typ für ein einzelnes Source-Objekt in testdata.sources
export type BrightskySource = {
    id: number;
    dwd_station_id: string | null;
    observation_type: string;
    lat: number;
    lon: number;
    height: number;
    station_name: string;
    wmo_station_id: string;
    first_record: string;
    last_record: string;
    distance: number;
};

// Typ für das gesamte testdata-Objekt
export type BrightskyTestdata = {
    weather: BrightskyWeather[];
    sources: BrightskySource[];
};

// Typen für testdata2.weather und testdata2.sources

export type BrightskyCurrentlyFallback = {
    cloud_cover: number;
    condition: number;
    solar_10: number;
    solar_30: number;
    solar_60: number;
    precipitation_10: number;
    precipitation_30: number;
    precipitation_60: number;
    relative_humidity: number;
    visibility: number;
    wind_gust_direction_10: number;
    wind_gust_direction_30: number;
    wind_gust_direction_60: number;
    wind_gust_speed_10: number;
    wind_gust_speed_30: number;
    wind_gust_speed_60: number;
    sunshine_30: number;
    sunshine_60: number;
};

export type BrightskyCurrently = {
    source_id: number;
    timestamp: string;

    dew_point: number;

    pressure_msl: number;

    wind_direction_10: number;
    wind_direction_30: number;
    wind_direction_60: number;
    wind_speed_10: number;
    wind_speed_30: number;
    wind_speed_60: number;

    temperature: number;
    fallback_source_ids: BrightskyCurrentlyFallback;
    icon: string;
} & BrightskyCurrentlyFallback;

export type BrightskyTestdata2 = {
    weather: BrightskyCurrently;
    sources: BrightskySource[];
};

export const testdata = {
    weather: [
        {
            timestamp: '2025-08-17T19:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1019,
            sunshine: 15,
            temperature: 18.9,
            wind_direction: 347,
            wind_speed: 7.4,
            cloud_cover: 47,
            dew_point: 9.8,
            relative_humidity: null,
            visibility: 60000,
            wind_gust_direction: null,
            wind_gust_speed: 14.8,
            condition: 'dry',
            precipitation_probability: 1,
            precipitation_probability_6h: null,
            solar: 0.014,
            icon: 'partly-cloudy-night',
        },
        {
            timestamp: '2025-08-17T20:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1019.5,
            sunshine: 0,
            temperature: 17.7,
            wind_direction: 347,
            wind_speed: 9.3,
            cloud_cover: 51,
            dew_point: 9.8,
            relative_humidity: null,
            visibility: 57100,
            wind_gust_direction: null,
            wind_gust_speed: 14.8,
            condition: 'dry',
            precipitation_probability: 1,
            precipitation_probability_6h: null,
            solar: 0,
            icon: 'partly-cloudy-night',
        },
        {
            timestamp: '2025-08-17T21:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1019.9,
            sunshine: 0,
            temperature: 16.7,
            wind_direction: 6,
            wind_speed: 7.4,
            cloud_cover: 46,
            dew_point: 10.1,
            relative_humidity: null,
            visibility: 60300,
            wind_gust_direction: null,
            wind_gust_speed: 13,
            condition: 'dry',
            precipitation_probability: 1,
            precipitation_probability_6h: null,
            solar: 0,
            icon: 'partly-cloudy-night',
        },
        {
            timestamp: '2025-08-17T22:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1020.3,
            sunshine: 0,
            temperature: 15.8,
            wind_direction: 16,
            wind_speed: 9.3,
            cloud_cover: 42,
            dew_point: 10.2,
            relative_humidity: null,
            visibility: 57000,
            wind_gust_direction: null,
            wind_gust_speed: 14.8,
            condition: 'dry',
            precipitation_probability: 1,
            precipitation_probability_6h: null,
            solar: 0,
            icon: 'partly-cloudy-night',
        },
        {
            timestamp: '2025-08-17T23:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1020.5,
            sunshine: 0,
            temperature: 15.2,
            wind_direction: 19,
            wind_speed: 7.4,
            cloud_cover: 38,
            dew_point: 10.3,
            relative_humidity: null,
            visibility: 53400,
            wind_gust_direction: null,
            wind_gust_speed: 13,
            condition: 'dry',
            precipitation_probability: 1,
            precipitation_probability_6h: null,
            solar: 0,
            icon: 'partly-cloudy-night',
        },
        {
            timestamp: '2025-08-18T00:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1020.6,
            sunshine: 0,
            temperature: 14.5,
            wind_direction: 23,
            wind_speed: 7.4,
            cloud_cover: 30,
            dew_point: 10.2,
            relative_humidity: null,
            visibility: 50800,
            wind_gust_direction: null,
            wind_gust_speed: 11.1,
            condition: 'dry',
            precipitation_probability: 0,
            precipitation_probability_6h: 0,
            solar: 0,
            icon: 'partly-cloudy-night',
        },
        {
            timestamp: '2025-08-18T01:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1020.7,
            sunshine: 0,
            temperature: 13.9,
            wind_direction: 25,
            wind_speed: 7.4,
            cloud_cover: 28,
            dew_point: 10.2,
            relative_humidity: null,
            visibility: 45500,
            wind_gust_direction: null,
            wind_gust_speed: 11.1,
            condition: 'dry',
            precipitation_probability: 0,
            precipitation_probability_6h: null,
            solar: 0,
            icon: 'partly-cloudy-night',
        },
        {
            timestamp: '2025-08-18T02:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1020.8,
            sunshine: 0,
            temperature: 13.4,
            wind_direction: 42,
            wind_speed: 7.4,
            cloud_cover: 23,
            dew_point: 10.4,
            relative_humidity: null,
            visibility: 39800,
            wind_gust_direction: null,
            wind_gust_speed: 9.3,
            condition: 'dry',
            precipitation_probability: 0,
            precipitation_probability_6h: null,
            solar: 0,
            icon: 'clear-night',
        },
        {
            timestamp: '2025-08-18T03:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1020.9,
            sunshine: 0,
            temperature: 13,
            wind_direction: 47,
            wind_speed: 7.4,
            cloud_cover: 21,
            dew_point: 10.2,
            relative_humidity: null,
            visibility: 41400,
            wind_gust_direction: null,
            wind_gust_speed: 9.3,
            condition: 'dry',
            precipitation_probability: 1,
            precipitation_probability_6h: null,
            solar: 0,
            icon: 'clear-night',
        },
        {
            timestamp: '2025-08-18T04:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1021,
            sunshine: 9,
            temperature: 13.1,
            wind_direction: 63,
            wind_speed: 7.4,
            cloud_cover: 20,
            dew_point: 10.2,
            relative_humidity: null,
            visibility: 39700,
            wind_gust_direction: null,
            wind_gust_speed: 9.3,
            condition: 'dry',
            precipitation_probability: 1,
            precipitation_probability_6h: null,
            solar: 0,
            icon: 'clear-day',
        },
        {
            timestamp: '2025-08-18T05:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1021.2,
            sunshine: 26,
            temperature: 13.6,
            wind_direction: 68,
            wind_speed: 5.5,
            cloud_cover: 21,
            dew_point: 10.3,
            relative_humidity: null,
            visibility: 42800,
            wind_gust_direction: null,
            wind_gust_speed: 9.3,
            condition: 'dry',
            precipitation_probability: 0,
            precipitation_probability_6h: null,
            solar: 0.028,
            icon: 'clear-day',
        },
        {
            timestamp: '2025-08-18T06:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1021.3,
            sunshine: 45,
            temperature: 15,
            wind_direction: 66,
            wind_speed: 5.5,
            cloud_cover: 18,
            dew_point: 10.3,
            relative_humidity: null,
            visibility: 41800,
            wind_gust_direction: null,
            wind_gust_speed: 9.3,
            condition: 'dry',
            precipitation_probability: 1,
            precipitation_probability_6h: 1,
            solar: 0.142,
            icon: 'clear-day',
        },
        {
            timestamp: '2025-08-18T07:00:00+00:00',
            source_id: 4724,
            precipitation: 0,
            pressure_msl: 1021.5,
            sunshine: 55,
            temperature: 17.1,
            wind_direction: 64,
            wind_speed: 5.5,
            cloud_cover: 18,
            dew_point: 10.2,
            relative_humidity: null,
            visibility: 46800,
            wind_gust_direction: null,
            wind_gust_speed: 9.3,
            condition: 'dry',
            precipitation_probability: 1,
            precipitation_probability_6h: null,
            solar: 0.294,
            icon: 'clear-day',
        },
    ],
    sources: [
        {
            id: 4724,
            dwd_station_id: null,
            observation_type: 'forecast',
            lat: 52.5,
            lon: 13.33,
            height: 100,
            station_name: 'SWIS-PUNKT',
            wmo_station_id: 'X045',
            first_record: '2025-08-17T16:00:00+00:00',
            last_record: '2025-08-27T22:00:00+00:00',
            distance: 3388,
        },
    ],
};
export const testdata2 = {
    weather: {
        source_id: 11182,
        timestamp: '2025-08-17T20:00:00+00:00',
        cloud_cover: 88,
        condition: 'dry',
        dew_point: 11.9,
        solar_10: 0,
        solar_30: 0,
        solar_60: 0,
        precipitation_10: 0,
        precipitation_30: 0,
        precipitation_60: 0,
        pressure_msl: 1019.5,
        relative_humidity: 69,
        visibility: 54768,
        wind_direction_10: 330,
        wind_direction_30: 330,
        wind_direction_60: 330,
        wind_speed_10: 10.8,
        wind_speed_30: 10.8,
        wind_speed_60: 10.8,
        wind_gust_direction_10: 300,
        wind_gust_direction_30: 300,
        wind_gust_direction_60: 300,
        wind_gust_speed_10: 11.9,
        wind_gust_speed_30: 11.9,
        wind_gust_speed_60: 12.2,
        sunshine_30: 0,
        sunshine_60: 0,
        temperature: 15.4,
        fallback_source_ids: {
            cloud_cover: 254907,
            condition: 254907,
            solar_10: 254907,
            solar_30: 254907,
            solar_60: 254907,
            precipitation_10: 254907,
            precipitation_30: 254907,
            precipitation_60: 254907,
            relative_humidity: 254907,
            visibility: 254907,
            wind_gust_direction_10: 254907,
            wind_gust_direction_30: 254907,
            wind_gust_direction_60: 254907,
            wind_gust_speed_10: 254907,
            wind_gust_speed_30: 254907,
            wind_gust_speed_60: 254907,
            sunshine_30: 254907,
            sunshine_60: 254907,
        },
        icon: 'cloudy',
    },
    sources: [
        {
            id: 11182,
            dwd_station_id: '00403',
            observation_type: 'synop',
            lat: 52.4537,
            lon: 13.3017,
            height: 51,
            station_name: 'Berlin-Dahlem(FU)',
            wmo_station_id: '10381',
            first_record: '2025-08-16T14:00:00+00:00',
            last_record: '2025-08-17T20:00:00+00:00',
            distance: 5360,
        },
        {
            id: 254907,
            dwd_station_id: '03987',
            observation_type: 'synop',
            lat: 52.3813,
            lon: 13.0622,
            height: 80.9,
            station_name: 'Potsdam',
            wmo_station_id: '10379',
            first_record: '2025-08-16T13:30:00+00:00',
            last_record: '2025-08-17T20:00:00+00:00',
            distance: 19825,
        },
    ],
};
