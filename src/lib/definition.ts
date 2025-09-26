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
            role: 'value.clouds',
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
            role: 'value.precipitation.hour',
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

const hourly: ChangeTypeOfKeysForState<BrightskyWeather, ioBroker.StateObject> = {
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
            role: 'value.precipitation.hour',
            read: true,
            write: false,
            unit: 'mm/h',
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
            unit: 'min',
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
    wind_bearing_text: {
        _id: '',
        type: 'state',
        common: {
            name: 'Wind Bearing Text',
            type: 'string',
            role: 'weather.direction.wind',
            read: true,
            write: false,
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
            role: 'value.clouds',
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
            role: 'value',
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
            role: 'value',
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
    solar_estimate: {
        _id: 'solar_estimate',
        type: 'state',
        common: {
            name: 'Solar Estimate (hourly total)',
            type: 'number',
            role: 'value.power',
            read: true,
            write: false,
            unit: 'kWh',
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
};
const daily: customChannelType & ChangeTypeOfKeysForState<BrightskyDailyData, ioBroker.StateObject> = {
    _channel: {
        _id: '',
        type: 'folder',
        common: {
            name: 'Daily',
        },
        native: {},
    },
    _array: {
        _id: '',
        type: 'folder',
        common: {
            name: 'Daily',
        },
        native: {},
    },
    ...hourly,
    sunshine: {
        _id: 'sunshine',
        type: 'state',
        common: {
            name: 'Sunshine (daily total)',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            unit: 'min',
        },
        native: {},
    },
    precipitation: {
        _id: 'precipitation',
        type: 'state',
        common: {
            name: 'Precipitation (daily total)',
            type: 'number',
            role: 'value.precipitation.forecast.0',
            read: true,
            write: false,
            unit: 'mm',
        },
        native: {},
    },
    sunrise: {
        _id: 'sunrise',
        type: 'state',
        common: {
            name: 'Sunrise',
            type: 'number',
            role: 'date.sunrise',
            read: true,
            write: false,
        },
        native: {},
    },
    sunset: {
        _id: 'sunset',
        type: 'state',
        common: {
            name: 'Sunset',
            type: 'number',
            role: 'date.sunset',
            read: true,
            write: false,
        },
        native: {},
    },
    solar: {
        _id: 'solar',
        type: 'state',
        common: {
            name: 'Solar Radiation (daily total)',
            type: 'number',
            role: 'value.power',
            read: true,
            write: false,
            unit: 'kWh/m²',
        },
        native: {},
    },
    solar_max: {
        _id: 'solar_max',
        type: 'state',
        common: {
            name: 'Solar Max (per hour)',
            type: 'number',
            role: 'value.power.max',
            read: true,
            write: false,
            unit: 'kWh/m²',
        },
        native: {},
    },
    solar_median: {
        _id: 'solar_median',
        type: 'state',
        common: {
            name: 'Solar Median',
            type: 'number',
            role: 'value.power.median',
            read: true,
            write: false,
            unit: 'kWh/m²',
        },
        native: {},
    },
    solar_forHomoran: {
        _id: 'solar_forHomoran',
        type: 'state',
        common: {
            name: 'Solar for Homoran (daily total)',
            type: 'number',
            role: 'value.power',
            read: true,
            write: false,
            unit: 'kWh/m²',
        },
        native: {},
    },
    solar_estimate: {
        _id: 'solar_estimate',
        type: 'state',
        common: {
            name: 'Solar Estimate (daily total)',
            type: 'number',
            role: 'value.power',
            read: true,
            write: false,
            unit: 'kWh',
        },
        native: {},
    },
    solar_estimateForHomoran: {
        _id: 'solar_estimateForHomoran',
        type: 'state',
        common: {
            name: 'Solar Estimate for Homoran (daily total)',
            type: 'number',
            role: 'value.power',
            read: true,
            write: false,
            unit: 'kWh',
        },
        native: {},
    },

    wind_direction_median: {
        _id: 'wind_direction_median',
        type: 'state',
        common: {
            name: 'Wind Direction Median',
            type: 'number',
            role: 'value.direction.median',
            read: true,
            write: false,
            unit: '°',
        },
        native: {},
    },
    wind_speed_median: {
        _id: 'wind_speed_median',
        type: 'state',
        common: {
            name: 'Wind Speed Median',
            type: 'number',
            role: 'value.speed.median',
            read: true,
            write: false,
            unit: 'km/h',
        },
        native: {},
    },
    cloud_cover_median: {
        _id: 'cloud_cover_median',
        type: 'state',
        common: {
            name: 'Cloud Cover Median',
            type: 'number',
            role: 'value.clouds.median',
            read: true,
            write: false,
            unit: '%',
        },
        native: {},
    },
    relative_humidity_median: {
        _id: 'relative_humidity_median',
        type: 'state',
        common: {
            name: 'Relative Humidity Median',
            type: 'number',
            role: 'value.humidity.median',
            read: true,
            write: false,
            unit: '%',
        },
        native: {},
    },
    visibility_median: {
        _id: 'visibility_median',
        type: 'state',
        common: {
            name: 'Visibility Median',
            type: 'number',
            role: 'value.distance.median',
            read: true,
            write: false,
            unit: 'm',
        },
        native: {},
    },
    dew_point_median: {
        _id: 'dew_point_median',
        type: 'state',
        common: {
            name: 'Dew Point Median',
            type: 'number',
            role: 'value.temperature.dewpoint.median',
            read: true,
            write: false,
            unit: '°C',
        },
        native: {},
    },
    temperature_median: {
        _id: 'temperature_median',
        type: 'state',
        common: {
            name: 'Temperature Median',
            type: 'number',
            role: 'value.temperature.median',
            read: true,
            write: false,
            unit: '°C',
        },
        native: {},
    },
    wind_gust_direction_median: {
        _id: 'wind_gust_direction_median',
        type: 'state',
        common: {
            name: 'Wind Gust Direction Median',
            type: 'number',
            role: 'value.direction.median',
            read: true,
            write: false,
            unit: '°',
        },
        native: {},
    },
    wind_gust_speed_median: {
        _id: 'wind_gust_speed_median',
        type: 'state',
        common: {
            name: 'Wind Gust Speed Median',
            type: 'number',
            role: 'value.speed.median',
            read: true,
            write: false,
            unit: 'km/h',
        },
        native: {},
    },
    precipitation_probability_median: {
        _id: 'precipitation_probability_median',
        type: 'state',
        common: {
            name: 'Precipitation Probability Median',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            unit: '%',
        },
        native: {},
    },
    precipitation_probability_6h_median: {
        _id: 'precipitation_probability_6h_median',
        type: 'state',
        common: {
            name: 'Precipitation Probability 6h Median',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            unit: '%',
        },
        native: {},
    },
    pressure_msl_median: {
        _id: 'pressure_msl_median',
        type: 'state',
        common: {
            name: 'Pressure MSL Median',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            unit: 'hPa',
        },
        native: {},
    },

    precipitation_min: {
        _id: 'precipitation_min',
        type: 'state',
        common: {
            name: 'Precipitation Min',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            unit: 'mm/h',
        },
        native: {},
    },
    precipitation_max: {
        _id: 'precipitation_max',
        type: 'state',
        common: {
            name: 'Precipitation Max',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            unit: 'mm/h',
        },
        native: {},
    },
    wind_speed_min: {
        _id: 'wind_speed_min',
        type: 'state',
        common: {
            name: 'Wind Speed Min',
            type: 'number',
            role: 'value.speed',
            read: true,
            write: false,
            unit: 'km/h',
        },
        native: {},
    },
    wind_speed_max: {
        _id: 'wind_speed_max',
        type: 'state',
        common: {
            name: 'Wind Speed Max',
            type: 'number',
            role: 'value.speed.max',
            read: true,
            write: false,
            unit: 'km/h',
        },
        native: {},
    },
    temperature_min: {
        _id: 'temperature_min',
        type: 'state',
        common: {
            name: 'Temperature Min',
            type: 'number',
            role: 'value.temperature.min',
            read: true,
            write: false,
            unit: '°C',
        },
        native: {},
    },
    temperature_max: {
        _id: 'temperature_max',
        type: 'state',
        common: {
            name: 'Temperature Max',
            type: 'number',
            role: 'value.temperature.max',
            read: true,
            write: false,
            unit: '°C',
        },
        native: {},
    },
    icon_special: {
        _id: 'icon_special',
        type: 'state',
        common: {
            name: 'Weather Icon(mdi)',
            type: 'string',
            role: 'weather.icon.name',
            read: true,
            write: false,
        },
        native: {},
    },
    iconUrl: {
        _id: '',
        type: 'state',
        common: {
            name: 'Icon URL',
            type: 'string',
            role: 'weather.icon',
            read: true,
            write: false,
        },
        native: {},
    },
    icon: {
        _id: 'icon',
        type: 'state',
        common: {
            name: 'Weather Icon',
            type: 'string',
            role: 'weather.icon.name',
            read: true,
            write: false,
        },
        native: {},
    },
    day: {
        _channel: {
            _id: 'day',
            type: 'folder',
            common: {
                name: 'Day',
            },
            native: {},
        },
        ...hourly,
        sunshine: {
            _id: 'sunshine',
            type: 'state',
            common: {
                name: 'Sunshine (day total)',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
                unit: 'min',
            },
            native: {},
        },
        precipitation: {
            _id: 'precipitation',
            type: 'state',
            common: {
                name: 'Precipitation (day total)',
                type: 'number',
                role: 'value.precipitation.forecast.0',
                read: true,
                write: false,
                unit: 'mm',
            },
            native: {},
        },
        solar: {
            _id: 'solar',
            type: 'state',
            common: {
                name: 'Solar Radiation (day total)',
                type: 'number',
                role: 'value.power',
                read: true,
                write: false,
                unit: 'kWh/m²',
            },
            native: {},
        },
    },
    night: {
        _channel: {
            _id: 'night',
            type: 'folder',
            common: {
                name: 'Night',
            },
            native: {},
        },
        ...hourly,
        sunshine: {
            _id: 'sunshine',
            type: 'state',
            common: {
                name: 'Sunshine (night total)',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
                unit: 'min',
            },
            native: {},
        },
        precipitation: {
            _id: 'precipitation',
            type: 'state',
            common: {
                name: 'Precipitation (night total)',
                type: 'number',
                role: 'value.precipitation.forecast.0',
                read: true,
                write: false,
                unit: 'mm',
            },
            native: {},
        },
        solar: {
            _id: 'solar',
            type: 'state',
            common: {
                name: 'Solar Radiation (night total)',
                type: 'number',
                role: 'value.power',
                read: true,
                write: false,
                unit: 'kWh/m²',
            },
            native: {},
        },
    },
};

export const genericStateObjects: {
    default: ioBroker.StateObject;
    customString: ioBroker.StateObject;
    weather: customChannelType & {
        hourly: customChannelType & ChangeTypeOfKeysForState<BrightskyWeather, ioBroker.StateObject>;
        daily: customChannelType & ChangeTypeOfKeysForState<BrightskyDailyData, ioBroker.StateObject>;

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
            ...hourly,
        },
        daily: {
            ...daily,
            day: {
                ...daily,
                _channel: {
                    _id: 'day',
                    type: 'folder',
                    common: {
                        name: 'Day',
                    },
                    native: {},
                },
            },
            night: {
                ...daily,
                _channel: {
                    _id: 'night',
                    type: 'folder',
                    common: {
                        name: 'Night',
                    },
                    native: {},
                },
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
            icon_special: {
                _id: 'icon_special',
                type: 'state',
                common: {
                    name: 'Weather Icon(mdi)',
                    type: 'string',
                    role: 'weather.icon.name',
                    read: true,
                    write: false,
                },
                native: {},
            },
            iconUrl: {
                _id: '',
                type: 'state',
                common: {
                    name: 'Icon URL',
                    type: 'string',
                    role: 'weather.icon',
                    read: true,
                    write: false,
                },
                native: {},
            },
            wind_bearing_text: {
                _id: '',
                type: 'state',
                common: {
                    name: 'Wind Bearing Text',
                    type: 'string',
                    role: 'weather.direction.wind',
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
                    role: 'weather.icon.name',
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
export type BrightskyDailyData = BrightskyWeather & {
    precipitation_min: number | null;
    precipitation_max: number | null;
    wind_speed_min: number | null;
    wind_speed_max: number | null;
    temperature_min: number | null;
    temperature_max: number | null;
    solar_max: number | null;
    pressure_msl_median: number | null;
    temperature_median: number | null;
    wind_direction_median: number | null;
    wind_speed_median: number | null;
    cloud_cover_median: number | null;
    dew_point_median: number | null;
    relative_humidity_median: number | null;
    visibility_median: number | null;
    wind_gust_direction_median: number | null;
    wind_gust_speed_median: number | null;
    condition: string | null;
    precipitation_probability_median: number | null;
    precipitation_probability_6h_median: number | null;
    solar_median: number | null;
    solar_forHomoran?: number | null;
    solar_estimate?: number | null;
    solar_estimateForHomoran?: number | null;
    sunset?: number | null;
    sunrise?: number | null;
    icon_special?: string | null;
    iconUrl?: string | null;
    day?: Partial<BrightskyDayNightData>;
    night?: Partial<BrightskyDayNightData>;
};

export type BrightskyDayNightData = BrightskyWeather & {
    precipitation_min?: number | null;
    precipitation_max?: number | null;
    wind_speed_min?: number | null;
    wind_speed_max?: number | null;
    temperature_min?: number | null;
    temperature_max?: number | null;
    solar_max?: number | null;
    pressure_msl_median?: number | null;
    temperature_median?: number | null;
    wind_direction_median?: number | null;
    wind_speed_median?: number | null;
    cloud_cover_median?: number | null;
    dew_point_median?: number | null;
    relative_humidity_median?: number | null;
    visibility_median?: number | null;
    wind_gust_direction_median?: number | null;
    wind_gust_speed_median?: number | null;
    precipitation_probability_median?: number | null;
    precipitation_probability_6h_median?: number | null;
    solar_median?: number | null;
    icon_special?: string | null;
    iconUrl?: string | null;
};

// Gemeinsame Typen für Wetterdaten
export type BrightskyWeather = {
    timestamp: string;
    source_id: number;
    precipitation: number | null;
    pressure_msl: number | null;
    sunshine: number | null;
    temperature: number | null;
    wind_direction: number | null;
    wind_bearing_text?: string;
    wind_speed: number | null;
    cloud_cover: number | null;
    dew_point: number | null;
    relative_humidity: number | null;
    visibility: number | null;
    wind_gust_direction: number | null;
    wind_gust_speed: number | null;
    condition: string | null;
    precipitation_probability: number | null;
    precipitation_probability_6h: number | null;
    solar: number | null;
    solar_estimate?: number | null;

    icon: string | null;
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
export type BrightskyHourly = {
    weather: BrightskyWeather[];
    sources: BrightskySource[];
};

// Typen für testdata2.weather und testdata2.sources

export type BrightskyCurrentlyFallback = {
    cloud_cover: number;
    condition: string;
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
    wind_bearing_text?: string;
    wind_direction_10: number;
    wind_direction_30: number;
    wind_direction_60: number;
    wind_speed_10: number;
    wind_speed_30: number;
    wind_speed_60: number;
    icon_special?: string;
    iconUrl?: string;
    temperature: number;
    fallback_source_ids: BrightskyCurrentlyFallback;
    icon: string;
} & BrightskyCurrentlyFallback;

export type BrightskyTestdata2 = {
    weather: BrightskyCurrently;
    sources: BrightskySource[];
};
