"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var definition_exports = {};
__export(definition_exports, {
  Defaults: () => Defaults,
  defaultChannel: () => defaultChannel,
  genericStateObjects: () => genericStateObjects
});
module.exports = __toCommonJS(definition_exports);
const defaultChannel = {
  _id: "",
  type: "channel",
  common: {
    name: "Hey no description... "
  },
  native: {}
};
const BrightskyCurrentlyFallback = {
  cloud_cover: {
    _id: "cloud_cover",
    type: "state",
    common: {
      name: "Cloud Cover",
      type: "number",
      role: "value.clouds",
      read: true,
      write: false,
      unit: "%"
    },
    native: {}
  },
  condition: {
    _id: "condition",
    type: "state",
    common: {
      name: "Condition",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  },
  solar_10: {
    _id: "solar_10",
    type: "state",
    common: {
      name: "Solar Radiation 10 min",
      type: "number",
      role: "value.power",
      read: true,
      write: false,
      unit: "kWh/m\xB2"
    },
    native: {}
  },
  solar_30: {
    _id: "solar_30",
    type: "state",
    common: {
      name: "Solar Radiation 30 min",
      type: "number",
      role: "value.power",
      read: true,
      write: false,
      unit: "kWh/m\xB2"
    },
    native: {}
  },
  solar_60: {
    _id: "solar_60",
    type: "state",
    common: {
      name: "Solar Radiation 60 min",
      type: "number",
      role: "value.power",
      read: true,
      write: false,
      unit: "kWh/m\xB2"
    },
    native: {}
  },
  precipitation_10: {
    _id: "precipitation_10",
    type: "state",
    common: {
      name: "Precipitation 10 min",
      type: "number",
      role: "value",
      read: true,
      write: false,
      unit: "mm"
    },
    native: {}
  },
  precipitation_30: {
    _id: "precipitation_30",
    type: "state",
    common: {
      name: "Precipitation 30 min",
      type: "number",
      role: "value",
      read: true,
      write: false,
      unit: "mm"
    },
    native: {}
  },
  precipitation_60: {
    _id: "",
    type: "state",
    common: {
      name: "Precipitation 60 min",
      type: "number",
      role: "value.precipitation.hour",
      read: true,
      write: false,
      unit: "mm"
    },
    native: {}
  },
  relative_humidity: {
    _id: "relative_humidity",
    type: "state",
    common: {
      name: "Relative Humidity",
      type: "number",
      role: "value.humidity",
      read: true,
      write: false,
      unit: "%"
    },
    native: {}
  },
  visibility: {
    _id: "visibility",
    type: "state",
    common: {
      name: "Visibility",
      type: "number",
      role: "value.distance",
      read: true,
      write: false,
      unit: "m"
    },
    native: {}
  },
  wind_gust_direction_10: {
    _id: "wind_gust_direction_10",
    type: "state",
    common: {
      name: "Wind Gust Direction 10 min",
      type: "number",
      role: "value.direction",
      read: true,
      write: false,
      unit: "\xB0"
    },
    native: {}
  },
  wind_gust_direction_30: {
    _id: "wind_gust_direction_30",
    type: "state",
    common: {
      name: "Wind Gust Direction 30 min",
      type: "number",
      role: "value.direction",
      read: true,
      write: false,
      unit: "\xB0"
    },
    native: {}
  },
  wind_gust_direction_60: {
    _id: "wind_gust_direction_60",
    type: "state",
    common: {
      name: "Wind Gust Direction 60 min",
      type: "number",
      role: "value.direction",
      read: true,
      write: false,
      unit: "\xB0"
    },
    native: {}
  },
  wind_gust_speed_10: {
    _id: "wind_gust_speed_10",
    type: "state",
    common: {
      name: "Wind Gust Speed 10 min",
      type: "number",
      role: "value.speed",
      read: true,
      write: false,
      unit: "km/h"
    },
    native: {}
  },
  wind_gust_speed_30: {
    _id: "wind_gust_speed_30",
    type: "state",
    common: {
      name: "Wind Gust Speed 30 min",
      type: "number",
      role: "value.speed",
      read: true,
      write: false,
      unit: "km/h"
    },
    native: {}
  },
  wind_gust_speed_60: {
    _id: "wind_gust_speed_60",
    type: "state",
    common: {
      name: "Wind Gust Speed 60 min",
      type: "number",
      role: "value.speed",
      read: true,
      write: false,
      unit: "km/h"
    },
    native: {}
  },
  sunshine_30: {
    _id: "sunshine_30",
    type: "state",
    common: {
      name: "Sunshine 30 min",
      type: "number",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  },
  sunshine_60: {
    _id: "sunshine_60",
    type: "state",
    common: {
      name: "Sunshine 60 min",
      type: "number",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  }
};
const hourly = {
  timestamp: {
    _id: "timestamp",
    type: "state",
    common: {
      name: "Timestamp",
      type: "string",
      role: "date",
      read: true,
      write: false
    },
    native: {}
  },
  source_id: {
    _id: "source_id",
    type: "state",
    common: {
      name: "Source ID",
      type: "number",
      role: "value",
      read: true,
      write: false
    },
    native: {}
  },
  precipitation: {
    _id: "precipitation",
    type: "state",
    common: {
      name: "Precipitation",
      type: "number",
      role: "value.precipitation.hour",
      read: true,
      write: false,
      unit: "mm/h"
    },
    native: {}
  },
  pressure_msl: {
    _id: "pressure_msl",
    type: "state",
    common: {
      name: "Pressure MSL",
      type: "number",
      role: "value",
      read: true,
      write: false,
      unit: "hPa"
    },
    native: {}
  },
  sunshine: {
    _id: "sunshine",
    type: "state",
    common: {
      name: "Sunshine",
      type: "number",
      role: "value",
      read: true,
      write: false,
      unit: "min"
    },
    native: {}
  },
  temperature: {
    _id: "temperature",
    type: "state",
    common: {
      name: "Temperature",
      type: "number",
      role: "value.temperature",
      read: true,
      write: false,
      unit: "\xB0C"
    },
    native: {}
  },
  wind_direction: {
    _id: "wind_direction",
    type: "state",
    common: {
      name: "Wind Direction",
      type: "number",
      role: "value.direction",
      read: true,
      write: false,
      unit: "\xB0"
    },
    native: {}
  },
  wind_speed: {
    _id: "wind_speed",
    type: "state",
    common: {
      name: "Wind Speed",
      type: "number",
      role: "value.speed",
      read: true,
      write: false,
      unit: "km/h"
    },
    native: {}
  },
  cloud_cover: {
    _id: "cloud_cover",
    type: "state",
    common: {
      name: "Cloud Cover",
      type: "number",
      role: "value.clouds",
      read: true,
      write: false,
      unit: "%"
    },
    native: {}
  },
  dew_point: {
    _id: "dew_point",
    type: "state",
    common: {
      name: "Dew Point",
      type: "number",
      role: "value.temperature.dewpoint",
      read: true,
      write: false,
      unit: "\xB0C"
    },
    native: {}
  },
  relative_humidity: {
    _id: "relative_humidity",
    type: "state",
    common: {
      name: "Relative Humidity",
      type: "number",
      role: "value.humidity",
      read: true,
      write: false,
      unit: "%"
    },
    native: {}
  },
  visibility: {
    _id: "visibility",
    type: "state",
    common: {
      name: "Visibility",
      type: "number",
      role: "value.distance",
      read: true,
      write: false,
      unit: "m"
    },
    native: {}
  },
  wind_gust_direction: {
    _id: "wind_gust_direction",
    type: "state",
    common: {
      name: "Wind Gust Direction",
      type: "number",
      role: "value.direction",
      read: true,
      write: false,
      unit: "\xB0"
    },
    native: {}
  },
  wind_gust_speed: {
    _id: "wind_gust_speed",
    type: "state",
    common: {
      name: "Wind Gust Speed",
      type: "number",
      role: "value.speed",
      read: true,
      write: false,
      unit: "km/h"
    },
    native: {}
  },
  condition: {
    _id: "condition",
    type: "state",
    common: {
      name: "Condition",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  },
  precipitation_probability: {
    _id: "precipitation_probability",
    type: "state",
    common: {
      name: "Precipitation Probability",
      type: "number",
      role: "",
      read: true,
      write: false,
      unit: "%"
    },
    native: {}
  },
  precipitation_probability_6h: {
    _id: "precipitation_probability_6h",
    type: "state",
    common: {
      name: "Precipitation Probability 6h",
      type: "number",
      role: "",
      read: true,
      write: false,
      unit: "%"
    },
    native: {}
  },
  solar: {
    _id: "solar",
    type: "state",
    common: {
      name: "Solar Radiation",
      type: "number",
      role: "value.power",
      read: true,
      write: false,
      unit: "kWh/m\xB2"
    },
    native: {}
  },
  icon: {
    _id: "icon",
    type: "state",
    common: {
      name: "Weather Icon",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  }
};
const genericStateObjects = {
  default: {
    _id: "No_definition",
    type: "state",
    common: {
      name: "StateObjects.state",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  },
  customString: {
    _id: "User_State",
    type: "state",
    common: {
      name: "StateObjects.customString",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  },
  weather: {
    _channel: {
      _id: "",
      type: "folder",
      common: {
        name: "Weather"
      },
      native: {}
    },
    hourly: {
      _channel: {
        _id: "",
        type: "folder",
        common: {
          name: "Hourly"
        },
        native: {}
      },
      _array: {
        _id: "",
        type: "folder",
        common: {
          name: "Hourly"
        },
        native: {}
      },
      ...hourly
    },
    daily: {
      _channel: {
        _id: "",
        type: "folder",
        common: {
          name: "Daily"
        },
        native: {}
      },
      _array: {
        _id: "",
        type: "folder",
        common: {
          name: "Daily"
        },
        native: {}
      },
      ...hourly,
      sunshine: {
        _id: "sunshine",
        type: "state",
        common: {
          name: "Sunshine (daily total)",
          type: "number",
          role: "value",
          read: true,
          write: false,
          unit: "min"
        },
        native: {}
      },
      precipitation: {
        _id: "precipitation",
        type: "state",
        common: {
          name: "Precipitation (daily total)",
          type: "number",
          role: "value.precipitation.forecast.0",
          read: true,
          write: false,
          unit: "mm"
        },
        native: {}
      },
      sunrise: {
        _id: "sunrise",
        type: "state",
        common: {
          name: "Sunrise",
          type: "number",
          role: "date.sunrise",
          read: true,
          write: false
        },
        native: {}
      },
      sunset: {
        _id: "sunset",
        type: "state",
        common: {
          name: "Sunset",
          type: "number",
          role: "date.sunset",
          read: true,
          write: false
        },
        native: {}
      },
      solar: {
        _id: "solar",
        type: "state",
        common: {
          name: "Solar Radiation (daily total)",
          type: "number",
          role: "value.power",
          read: true,
          write: false,
          unit: "kWh/m\xB2"
        },
        native: {}
      },
      solar_max: {
        _id: "solar_max",
        type: "state",
        common: {
          name: "Solar Max (per hour)",
          type: "number",
          role: "value.power",
          read: true,
          write: false,
          unit: "kWh/m\xB2"
        },
        native: {}
      },
      solar_median: {
        _id: "solar_median",
        type: "state",
        common: {
          name: "Solar Median",
          type: "number",
          role: "value.power",
          read: true,
          write: false,
          unit: "kWh/m\xB2"
        },
        native: {}
      },
      wind_direction_median: {
        _id: "wind_direction_median",
        type: "state",
        common: {
          name: "Wind Direction Median",
          type: "number",
          role: "value.direction",
          read: true,
          write: false,
          unit: "\xB0"
        },
        native: {}
      },
      wind_speed_median: {
        _id: "wind_speed_median",
        type: "state",
        common: {
          name: "Wind Speed Median",
          type: "number",
          role: "value.speed",
          read: true,
          write: false,
          unit: "km/h"
        },
        native: {}
      },
      cloud_cover_median: {
        _id: "cloud_cover_median",
        type: "state",
        common: {
          name: "Cloud Cover Median",
          type: "number",
          role: "value.clouds",
          read: true,
          write: false,
          unit: "%"
        },
        native: {}
      },
      relative_humidity_median: {
        _id: "relative_humidity_median",
        type: "state",
        common: {
          name: "Relative Humidity Median",
          type: "number",
          role: "value.humidity",
          read: true,
          write: false,
          unit: "%"
        },
        native: {}
      },
      visibility_median: {
        _id: "visibility_median",
        type: "state",
        common: {
          name: "Visibility Median",
          type: "number",
          role: "value.distance",
          read: true,
          write: false,
          unit: "m"
        },
        native: {}
      },
      dew_point_median: {
        _id: "dew_point_median",
        type: "state",
        common: {
          name: "Dew Point Median",
          type: "number",
          role: "value.temperature.dewpoint",
          read: true,
          write: false,
          unit: "\xB0C"
        },
        native: {}
      },
      temperature_median: {
        _id: "temperature_median",
        type: "state",
        common: {
          name: "Temperature Median",
          type: "number",
          role: "value.temperature",
          read: true,
          write: false,
          unit: "\xB0C"
        },
        native: {}
      },
      wind_gust_direction_median: {
        _id: "wind_gust_direction_median",
        type: "state",
        common: {
          name: "Wind Gust Direction Median",
          type: "number",
          role: "value.direction",
          read: true,
          write: false,
          unit: "\xB0"
        },
        native: {}
      },
      wind_gust_speed_median: {
        _id: "wind_gust_speed_median",
        type: "state",
        common: {
          name: "Wind Gust Speed Median",
          type: "number",
          role: "value.speed",
          read: true,
          write: false,
          unit: "km/h"
        },
        native: {}
      },
      precipitation_probability_median: {
        _id: "precipitation_probability_median",
        type: "state",
        common: {
          name: "Precipitation Probability Median",
          type: "number",
          role: "",
          read: true,
          write: false,
          unit: "%"
        },
        native: {}
      },
      precipitation_probability_6h_median: {
        _id: "precipitation_probability_6h_median",
        type: "state",
        common: {
          name: "Precipitation Probability 6h Median",
          type: "number",
          role: "",
          read: true,
          write: false,
          unit: "%"
        },
        native: {}
      },
      pressure_msl_median: {
        _id: "pressure_msl_median",
        type: "state",
        common: {
          name: "Pressure MSL Median",
          type: "number",
          role: "value",
          read: true,
          write: false,
          unit: "hPa"
        },
        native: {}
      },
      precipitation_min: {
        _id: "precipitation_min",
        type: "state",
        common: {
          name: "Precipitation Min",
          type: "number",
          role: "value",
          read: true,
          write: false,
          unit: "mm/h"
        },
        native: {}
      },
      precipitation_max: {
        _id: "precipitation_max",
        type: "state",
        common: {
          name: "Precipitation Max",
          type: "number",
          role: "value",
          read: true,
          write: false,
          unit: "mm/h"
        },
        native: {}
      },
      wind_speed_min: {
        _id: "wind_speed_min",
        type: "state",
        common: {
          name: "Wind Speed Min",
          type: "number",
          role: "value.speed",
          read: true,
          write: false,
          unit: "km/h"
        },
        native: {}
      },
      wind_speed_max: {
        _id: "wind_speed_max",
        type: "state",
        common: {
          name: "Wind Speed Max",
          type: "number",
          role: "value.speed",
          read: true,
          write: false,
          unit: "km/h"
        },
        native: {}
      },
      temperature_min: {
        _id: "temperature_min",
        type: "state",
        common: {
          name: "Temperature Min",
          type: "number",
          role: "value.temperature.minmax.min",
          read: true,
          write: false,
          unit: "\xB0C"
        },
        native: {}
      },
      temperature_max: {
        _id: "temperature_max",
        type: "state",
        common: {
          name: "Temperature Max",
          type: "number",
          role: "value.temperature.minmax.max",
          read: true,
          write: false,
          unit: "\xB0C"
        },
        native: {}
      }
    },
    sources: {
      _channel: {
        _id: "",
        type: "folder",
        common: {
          name: "Station"
        },
        native: {}
      },
      id: {
        _id: "id",
        type: "state",
        common: {
          name: "Station ID",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      dwd_station_id: {
        _id: "dwd_station_id",
        type: "state",
        common: {
          name: "DWD Station ID",
          type: "string",
          role: "text",
          read: true,
          write: false
        },
        native: {}
      },
      observation_type: {
        _id: "observation_type",
        type: "state",
        common: {
          name: "Observation Type",
          type: "string",
          role: "text",
          read: true,
          write: false
        },
        native: {}
      },
      lat: {
        _id: "lat",
        type: "state",
        common: {
          name: "Latitude",
          type: "number",
          role: "value.gps.latitude",
          read: true,
          write: false
        },
        native: {}
      },
      lon: {
        _id: "lon",
        type: "state",
        common: {
          name: "Longitude",
          type: "number",
          role: "value.gps.longitude",
          read: true,
          write: false
        },
        native: {}
      },
      height: {
        _id: "height",
        type: "state",
        common: {
          name: "Height",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      station_name: {
        _id: "station_name",
        type: "state",
        common: {
          name: "Station Name",
          type: "string",
          role: "text",
          read: true,
          write: false
        },
        native: {}
      },
      wmo_station_id: {
        _id: "wmo_station_id",
        type: "state",
        common: {
          name: "WMO Station ID",
          type: "string",
          role: "text",
          read: true,
          write: false
        },
        native: {}
      },
      first_record: {
        _id: "first_record",
        type: "state",
        common: {
          name: "First Record",
          type: "string",
          role: "date",
          read: true,
          write: false
        },
        native: {}
      },
      last_record: {
        _id: "last_record",
        type: "state",
        common: {
          name: "Last Record",
          type: "string",
          role: "date",
          read: true,
          write: false
        },
        native: {}
      },
      distance: {
        _id: "distance",
        type: "state",
        common: {
          name: "Distance",
          type: "number",
          role: "value.distance",
          read: true,
          write: false
        },
        native: {}
      }
    },
    current: {
      ...BrightskyCurrentlyFallback,
      _channel: {
        _id: "",
        type: "folder",
        common: {
          name: "Current Weather"
        },
        native: {}
      },
      timestamp: {
        _id: "timestamp",
        type: "state",
        common: {
          name: "Timestamp",
          type: "string",
          role: "date",
          read: true,
          write: false
        },
        native: {}
      },
      source_id: {
        _id: "source_id",
        type: "state",
        common: {
          name: "Source ID",
          type: "number",
          role: "value",
          read: true,
          write: false
        },
        native: {}
      },
      dew_point: {
        _id: "dew_point",
        type: "state",
        common: {
          name: "Dew Point",
          type: "number",
          role: "value.temperature.dewpoint",
          read: true,
          write: false,
          unit: "\xB0C"
        },
        native: {}
      },
      pressure_msl: {
        _id: "pressure_msl",
        type: "state",
        common: {
          name: "Pressure MSL",
          type: "number",
          role: "value",
          read: true,
          write: false,
          unit: "hPa"
        },
        native: {}
      },
      wind_direction_10: {
        _id: "wind_direction_10",
        type: "state",
        common: {
          name: "Wind Direction 10 min",
          type: "number",
          role: "value.direction",
          read: true,
          write: false,
          unit: "\xB0"
        },
        native: {}
      },
      wind_direction_30: {
        _id: "wind_direction_30",
        type: "state",
        common: {
          name: "Wind Direction 30 min",
          type: "number",
          role: "value.direction",
          read: true,
          write: false,
          unit: "\xB0"
        },
        native: {}
      },
      wind_direction_60: {
        _id: "wind_direction_60",
        type: "state",
        common: {
          name: "Wind Direction 60 min",
          type: "number",
          role: "value.direction",
          read: true,
          write: false,
          unit: "\xB0"
        },
        native: {}
      },
      wind_speed_10: {
        _id: "wind_speed_10",
        type: "state",
        common: {
          name: "Wind Speed 10 min",
          type: "number",
          role: "value.speed",
          read: true,
          write: false,
          unit: "km/h"
        },
        native: {}
      },
      wind_speed_30: {
        _id: "wind_speed_30",
        type: "state",
        common: {
          name: "Wind Speed 30 min",
          type: "number",
          role: "value.speed",
          read: true,
          write: false,
          unit: "km/h"
        },
        native: {}
      },
      wind_speed_60: {
        _id: "wind_speed_60",
        type: "state",
        common: {
          name: "Wind Speed 60 min",
          type: "number",
          role: "value.speed",
          read: true,
          write: false,
          unit: "km/h"
        },
        native: {}
      },
      temperature: {
        _id: "temperature",
        type: "state",
        common: {
          name: "Temperature",
          type: "number",
          role: "value.temperature",
          read: true,
          write: false,
          unit: "\xB0C"
        },
        native: {}
      },
      fallback_source_ids: {
        _channel: {
          _id: "fallback_source_ids",
          type: "folder",
          common: {
            name: "Fallback Source IDs"
          },
          native: {}
        },
        ...BrightskyCurrentlyFallback
      },
      icon: {
        _id: "icon",
        type: "state",
        common: {
          name: "Weather Icon",
          type: "string",
          role: "weather.icon.name",
          read: true,
          write: false
        },
        native: {}
      }
    }
  }
};
const Defaults = {
  state: {
    _id: "No_definition",
    type: "state",
    common: {
      name: "No definition",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Defaults,
  defaultChannel,
  genericStateObjects
});
//# sourceMappingURL=definition.js.map
