"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_axios = __toESM(require("axios"));
var import_library = require("./lib/library");
var import_definition = require("./lib/definition");
var suncalc = __toESM(require("suncalc"));
import_axios.default.defaults.timeout = 15e3;
class Brightsky extends utils.Adapter {
  library;
  unload = false;
  posId = "";
  weatherTimeout = [];
  groupArray = [];
  wrArray = [];
  constructor(options = {}) {
    super({
      ...options,
      name: "brightsky"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("unload", this.onUnload.bind(this));
    this.library = new import_library.Library(this, "Brightsky");
  }
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    var _a, _b, _c, _d, _e;
    await this.setObjectNotExistsAsync("info.connection", {
      type: "state",
      common: {
        name: "Connection status",
        type: "boolean",
        role: "indicator.connected",
        read: true,
        write: false
      },
      native: {}
    });
    await this.setState("info.connection", false, true);
    if (!this.config.createDaily) {
      await this.delObjectAsync("daily", { recursive: true });
    }
    if (!this.config.createCurrently) {
      await this.delObjectAsync("current", { recursive: true });
    }
    if (!this.config.createHourly) {
      await this.delObjectAsync("hourly", { recursive: true });
    }
    if (!this.config.createCurrently && !this.config.createHourly && !this.config.createDaily) {
      this.log.error(
        "No data creation is enabled in the adapter configuration. Please enable at least one of the options: Currently, Hourly, or Daily."
      );
      return;
    }
    if (this.config.wmo_station == void 0 || typeof this.config.wmo_station !== "string") {
      this.log.warn(`Invalid WMO station ID. Using default value of "".`);
      this.config.wmo_station = "";
    }
    if (this.config.dwd_station_id == void 0 || typeof this.config.dwd_station_id !== "string") {
      this.log.warn(`Invalid DWD station ID. Using default value of "".`);
      this.config.dwd_station_id = "";
    }
    this.wrArray.push((_a = this.config.wr1) != null ? _a : 0);
    this.wrArray.push((_b = this.config.wr2) != null ? _b : 0);
    this.wrArray.push((_c = this.config.wr3) != null ? _c : 0);
    this.wrArray.push((_d = this.config.wr4) != null ? _d : 0);
    this.wrArray.forEach(() => {
      this.groupArray.push([]);
    });
    if (this.config.panels) {
      for (const p of this.config.panels) {
        const wr = ((_e = p.wr) != null ? _e : 0) | 0;
        if (wr >= 0 && wr < this.wrArray.length) {
          this.groupArray[wr].push(p);
        }
      }
    }
    if (this.config.wmo_station !== "" && this.config.dwd_station_id !== "") {
      this.log.warn(
        "Both WMO station ID and DWD station ID are set. Using DWD station ID for location identification."
      );
      this.config.wmo_station = "";
    }
    this.posId = this.config.dwd_station_id ? `dwd_station_id=${this.config.dwd_station_id}` : this.config.wmo_station == "" ? `lat=${this.config.position.split(",")[0]}&lon=${this.config.position.split(",")[1]}&` : `wmo_station_id=${this.config.wmo_station}`;
    if (!this.config.position || typeof this.config.position !== "string" || !this.config.position.split(",").every((coord) => !isNaN(parseFloat(coord)))) {
      this.log.error("Position is not set in the adapter configuration. Please set it in the adapter settings.");
      return;
    }
    if (this.config.panels == void 0 || !Array.isArray(this.config.panels)) {
      this.config.panels = [];
    }
    if (this.config.hours == void 0 || this.config.hours < 0 || this.config.hours > 48) {
      this.log.warn(`Invalid hours to display: ${this.config.hours}. Using default value of 24 hours.`);
      this.config.hours = 24;
    }
    if (this.config.pollInterval == void 0 || this.config.pollInterval < 1 || this.config.pollInterval >= 2 ** 31 / (6e4 * 60)) {
      this.log.warn(`Invalid poll interval: ${this.config.pollInterval}. Using default value of 12 hour.`);
      this.config.pollInterval = 12;
    }
    if (this.config.pollIntervalCurrently == void 0 || this.config.pollIntervalCurrently < 10 || this.config.pollIntervalCurrently >= 2 ** 31 / 6e4) {
      this.log.warn(
        `Invalid poll interval currently: ${this.config.pollIntervalCurrently}. Using default value of 30 minute.`
      );
      this.config.pollIntervalCurrently = 30;
    }
    if (this.config.maxDistance == void 0 || this.config.maxDistance < 1e3) {
      this.log.warn(`Invalid max distance: ${this.config.maxDistance}. Using default value of 50000 meters.`);
      this.config.maxDistance = 5e4;
    }
    if (this.config.createCurrently) {
      await this.delay(3e3);
      await this.weatherCurrentlyLoop();
    }
    if (this.config.createHourly) {
      await this.delay(3e3);
      await this.weatherHourlyLoop();
    }
    if (this.config.createDaily) {
      await this.delay(3e3);
      await this.weatherDailyLoop();
    }
    this.log.info(
      `Adapter started with configuration: Position: ${this.config.position}, WMO Station ID: ${this.config.wmo_station}, DWD Station ID: ${this.config.dwd_station_id}, ${this.config.createCurrently ? `Currently data enabled. Poll interval: ${this.config.pollIntervalCurrently} minutes` : "Currently data disabled"} - ${this.config.createHourly ? `Hourly data enabled. Poll interval: ${this.config.pollInterval} hours` : "Hourly data disabled"} - ${this.config.createDaily ? "Daily data enabled" : "Daily data disabled"}. Max distance: ${this.config.maxDistance} meters.`
    );
    this.log.info(
      `Using ${this.config.dwd_station_id ? `WMO Station ID: ${this.config.dwd_station_id}` : `${this.config.wmo_station ? `WMO Station ID: ${this.config.wmo_station}` : `Position: ${this.config.position} with max distance: ${this.config.maxDistance} meters`}`}`
    );
  }
  async weatherDailyLoop() {
    if (this.weatherTimeout[2]) {
      this.clearTimeout(this.weatherTimeout[2]);
    }
    await this.weatherDailyUpdate();
    let loopTime = 1e5;
    if ((/* @__PURE__ */ new Date()).getHours() >= 5 && (/* @__PURE__ */ new Date()).getHours() < 18) {
      loopTime = (/* @__PURE__ */ new Date()).setHours(18, 0, 0, 0) + 3e4 + Math.ceil(Math.random() * 5e3);
    } else if ((/* @__PURE__ */ new Date()).getHours() >= 18) {
      loopTime = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0) + 3e4 + Math.ceil(Math.random() * 6e4);
    } else {
      loopTime = (/* @__PURE__ */ new Date()).setHours(5, 0, 0, 0) + 3e4 + Math.ceil(Math.random() * 5e3);
    }
    loopTime = loopTime - Date.now();
    if (loopTime <= 0) {
      loopTime = loopTime + 24 * 60 * 60 * 1e3;
    }
    this.weatherTimeout[2] = this.setTimeout(() => {
      void this.weatherDailyLoop();
    }, loopTime);
  }
  async weatherDailyUpdate() {
    var _a;
    const startTime = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)).toISOString();
    const endTime = new Date(
      new Date((/* @__PURE__ */ new Date()).setHours(23, 59, 59, 999)).setDate((/* @__PURE__ */ new Date()).getDate() + 7)
    ).toISOString();
    try {
      const result = await import_axios.default.get(
        `https://api.brightsky.dev/weather?${this.posId}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`
      );
      this.log.debug(
        `https://api.brightsky.dev/weather?lat=${this.config.position.split(",")[0]}&lon=${this.config.position.split(",")[1]}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`
      );
      if (result.data) {
        this.log.debug(`Daily weather data fetched successfully: ${JSON.stringify(result.data)}`);
        if (result.data.weather && Array.isArray(result.data.weather)) {
          const weatherArr = [];
          const resultArr = [];
          const currentDay = Math.floor((/* @__PURE__ */ new Date()).getTime() / (24 * 60 * 60 * 1e3));
          for (const item of result.data.weather) {
            if (!item) {
              continue;
            }
            const dataDay = Math.floor(new Date(item.timestamp).getTime() / (24 * 60 * 60 * 1e3));
            const day = dataDay - currentDay;
            if (weatherArr[day] === void 0) {
              weatherArr[day] = {};
            }
            for (const key of Object.keys(item)) {
              if (weatherArr[day][key] === void 0) {
                weatherArr[day][key] = [];
              }
              const k = key;
              weatherArr[day][key].push((_a = item[k]) != null ? _a : null);
            }
          }
          for (let i = 0; i < weatherArr.length; i++) {
            const dailyData = {};
            this.log.debug(`Processing daily data for day ${i}: ${JSON.stringify(weatherArr[i])}`);
            for (const key of Object.keys(weatherArr[i])) {
              const k = key;
              switch (k) {
                case "precipitation":
                case "wind_gust_speed":
                case "precipitation_probability":
                case "precipitation_probability_6h":
                case "wind_speed": {
                  const values = weatherArr[i][k];
                  if (values && values.length > 0) {
                    for (let j = 0; j < values.length; j++) {
                      if (values[j] === null) {
                        values[j] = 0;
                      }
                    }
                  }
                }
              }
              switch (k) {
                case "timestamp": {
                  dailyData.timestamp = weatherArr[i].timestamp[0];
                  break;
                }
                case "source_id": {
                  dailyData.source_id = weatherArr[i].source_id[0];
                  break;
                }
                case "precipitation":
                case "wind_speed":
                case "solar":
                case "temperature": {
                  const values = weatherArr[i][k];
                  if (values && values.length > 0) {
                    const min = Math.min(...values.filter((v) => v !== null));
                    const max = Math.max(...values.filter((v) => v !== null));
                    if (k !== "solar") {
                      dailyData[`${k}_min`] = min !== Infinity ? min : null;
                    } else {
                      dailyData.solar_estimate = 0;
                      if (this.config.position.split(",").length === 2 && this.config.panels.length > 0) {
                        dailyData.solar_estimate = values.reduce((sum, value, index) => {
                          if (typeof sum !== "number") {
                            sum = 0;
                          }
                          if (value) {
                            const newValue = this.estimatePVEnergyForHour(
                              value,
                              new Date(weatherArr[i].timestamp[index]),
                              {
                                lat: parseFloat(this.config.position.split(",")[0]),
                                lon: parseFloat(this.config.position.split(",")[1])
                              },
                              this.config.panels
                            );
                            return sum + newValue;
                          }
                          return sum;
                        });
                        dailyData.solar_estimate = dailyData.solar_estimate ? Math.round(dailyData.solar_estimate * 1e3) / 1e3 : dailyData.solar_estimate;
                      }
                      if ((/* @__PURE__ */ new Date()).getHours() === 5) {
                        dailyData.solar_forHomoran = values.reduce((sum, value) => {
                          if (typeof sum !== "number") {
                            sum = 0;
                          }
                          if (value != null && typeof value === "number") {
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
                    if (k !== "solar") {
                      dailyData[`${k}_min`] = null;
                    }
                  }
                }
                // eslint-disable-next-line no-fallthrough
                case "sunshine": {
                  if (k === "precipitation" || k === "sunshine" || k === "solar") {
                    const t = weatherArr[i][k].reduce((sum, value) => {
                      if (typeof sum !== "number") {
                        sum = 0;
                      }
                      if (value != null && typeof value === "number") {
                        return sum + value;
                      }
                      return sum;
                    }, 0);
                    dailyData[k] = null;
                    if (t !== null && typeof t === "number") {
                      dailyData[k] = k !== "solar" ? Math.round(t * 10) / 10 : Math.round(t * 1e3) / 1e3;
                    }
                    break;
                  }
                }
                // eslint-disable-next-line no-fallthrough
                case "wind_direction":
                case "cloud_cover":
                case "dew_point":
                case "relative_humidity":
                case "visibility":
                case "wind_gust_direction":
                case "wind_gust_speed":
                case "precipitation_probability":
                case "precipitation_probability_6h": {
                  const values = weatherArr[i][k];
                  if (values && values.length > 0) {
                    if (values && values.length > 0) {
                      let median = null;
                      if (values.filter((v) => v !== null).length > 0) {
                        const sortedValues = values.filter((v) => v !== null).sort((a, b) => a - b);
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
                        if (values.filter((v) => v !== null).length > 12) {
                          avg = Math.round(avg / values.filter((v) => v !== null).length * 10) / 10;
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
                case "icon":
                case "condition": {
                  const tempArr = [];
                  for (const value of weatherArr[i][k]) {
                    if (value) {
                      const index = tempArr.findIndex((el) => el.value === value);
                      if (index !== -1) {
                        tempArr[index].count++;
                      } else {
                        tempArr.push({ value, count: 1 });
                      }
                    }
                  }
                  tempArr.sort((a, b) => b.count - a.count);
                  if (tempArr.length > 0) {
                    if (k === "icon") {
                      tempArr[0].value = tempArr[0].value.replace("-night", "-day");
                    }
                    dailyData[k] = tempArr[0].value;
                  } else {
                    dailyData[k] = null;
                  }
                  dailyData.icon_special = this.pickDailyWeatherIcon({
                    condition: weatherArr[i].condition,
                    wind_speed: weatherArr[i].wind_speed,
                    cloud_cover: weatherArr[i].cloud_cover
                  });
                  break;
                }
              }
            }
            const times = suncalc.getTimes(
              new Date(dailyData.timestamp),
              parseFloat(this.config.position.split(",")[0]),
              parseFloat(this.config.position.split(",")[1])
            );
            dailyData.sunset = times.sunset.getTime();
            dailyData.sunrise = times.sunrise.getTime();
            const { dayData, nightData } = this.calculateDayNightData(
              weatherArr[i],
              times.sunrise,
              times.sunset
            );
            dailyData.day = dayData;
            dailyData.night = nightData;
            resultArr.push(dailyData);
          }
          await this.library.writeFromJson("daily.r", "weather.daily", import_definition.genericStateObjects, resultArr, true);
          await this.setState("info.connection", true, true);
        }
      }
    } catch (error) {
      await this.setState("info.connection", false, true);
      this.log.error(`Error fetching daily weather data: ${JSON.stringify(error)}`);
    }
  }
  async weatherCurrentlyLoop() {
    if (this.weatherTimeout[0]) {
      this.clearTimeout(this.weatherTimeout[0]);
    }
    await this.weatherCurrentlyUpdate();
    let nextInterval = this.config.pollIntervalCurrently * 6e4 + Math.ceil(Math.random() * 8e3);
    const coords = this.config.position.split(",").map(parseFloat);
    const { sunrise, sunset } = suncalc.getTimes(/* @__PURE__ */ new Date(), coords[0], coords[1]);
    const now = Date.now();
    const testTime = now > sunset.getTime() ? sunrise : now > sunrise.getTime() ? sunset : sunrise;
    if (now + nextInterval > testTime.getTime() && testTime.getTime() > now) {
      nextInterval = testTime.getTime() - now + 3e4 + Math.ceil(Math.random() * 5e3);
    }
    this.weatherTimeout[0] = this.setTimeout(() => {
      void this.weatherCurrentlyLoop();
    }, nextInterval);
  }
  async weatherHourlyLoop() {
    if (this.weatherTimeout[1]) {
      this.clearTimeout(this.weatherTimeout[1]);
    }
    await this.weatherHourlyUpdate();
    const loopTime = (/* @__PURE__ */ new Date()).setHours((/* @__PURE__ */ new Date()).getHours() + this.config.pollInterval, 0, 0) + 3e3 + Math.ceil(Math.random() * 5e3);
    this.weatherTimeout[1] = this.setTimeout(() => {
      void this.weatherHourlyLoop();
    }, loopTime - Date.now());
  }
  async weatherHourlyUpdate() {
    var _a, _b;
    const startTime = new Date((/* @__PURE__ */ new Date()).setMinutes(0, 0, 0)).toISOString();
    const endTime = new Date((/* @__PURE__ */ new Date()).setHours((/* @__PURE__ */ new Date()).getHours() + this.config.hours, 0, 0, 0)).toISOString();
    try {
      const result = await import_axios.default.get(
        `https://api.brightsky.dev/weather?${this.posId}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`
      );
      if (result.data) {
        this.log.debug(`Hourly weather data fetched successfully: ${JSON.stringify(result.data)}`);
        if (result.data.weather && Array.isArray(result.data.weather)) {
          for (const item of result.data.weather) {
            if (!item) {
              continue;
            }
            item.solar_estimate = 0;
            item.wind_bearing_text = this.getWindBearingText((_a = item.wind_direction) != null ? _a : void 0);
            if (this.config.position.split(",").length === 2 && this.config.panels.length > 0 && item.solar) {
              item.solar_estimate = this.estimatePVEnergyForHour(
                (_b = item.solar) != null ? _b : 0,
                item.timestamp,
                {
                  lat: parseFloat(this.config.position.split(",")[0]),
                  lon: parseFloat(this.config.position.split(",")[1])
                },
                this.config.panels
              );
              if (item.solar_estimate) {
                item.solar_estimate = Math.round(item.solar_estimate * 1e3) / 1e3;
              }
            }
          }
          await this.library.writeFromJson(
            "hourly.r",
            "weather.hourly",
            import_definition.genericStateObjects,
            result.data.weather,
            true
          );
          await this.library.writedp(
            "hourly.sources",
            void 0,
            import_definition.genericStateObjects.weather.sources._channel
          );
          await this.library.writeFromJson(
            "hourly.sources.r",
            "weather.sources",
            import_definition.genericStateObjects,
            result.data.sources,
            true
          );
          await this.setState("info.connection", true, true);
        }
      }
    } catch (error) {
      await this.setState("info.connection", false, true);
      this.log.error(`Error fetching weather data: ${JSON.stringify(error)}`);
    }
  }
  async weatherCurrentlyUpdate() {
    var _a;
    try {
      const result = await import_axios.default.get(
        `https://api.brightsky.dev/current_weather?${this.posId}&max_dist=${this.config.maxDistance}`
      );
      if (result.data) {
        this.log.debug(`Currently weather data fetched successfully: ${JSON.stringify(result.data)}`);
        if (result.data.weather) {
          const weather = result.data.weather;
          weather.wind_bearing_text = this.getWindBearingText((_a = weather.wind_direction_10) != null ? _a : void 0);
          const coords = this.config.position.split(",").map(parseFloat);
          const { sunrise, sunset } = suncalc.getTimes(/* @__PURE__ */ new Date(), coords[0], coords[1]);
          const now = /* @__PURE__ */ new Date();
          const isDayTime = now >= sunrise && now <= sunset;
          weather.icon_special = this.pickDailyWeatherIcon({
            condition: [weather.condition],
            wind_speed: [weather.wind_speed_10],
            cloud_cover: [weather.cloud_cover],
            day: isDayTime
          });
          await this.library.writeFromJson("current", "weather.current", import_definition.genericStateObjects, weather, true);
          await this.library.writedp(
            "current.sources",
            void 0,
            import_definition.genericStateObjects.weather.sources._channel
          );
          await this.library.writeFromJson(
            "current.sources.r",
            "weather.sources",
            import_definition.genericStateObjects,
            result.data.sources,
            true
          );
          await this.setState("info.connection", true, true);
        }
      }
    } catch (error) {
      await this.setState("info.connection", false, true);
      this.log.error(`Error fetching weather data: ${JSON.stringify(error)}`);
    }
  }
  getWindBearingText(windBearing) {
    if (windBearing === void 0) {
      return "";
    }
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW"
    ];
    const index = Math.round(windBearing % 360 / 22.5) % 16;
    return this.library.getTranslation(directions[index]);
  }
  onUnload(callback) {
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
  pickDailyWeatherIcon(bucket) {
    if (bucket.day !== false) {
      bucket.day = true;
    }
    const avg = (arr) => {
      const xs = arr.filter((v) => v != null);
      return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
    };
    const maxN = (arr) => {
      const xs = arr.filter((v) => v != null);
      return xs.length ? Math.max(...xs) : 0;
    };
    const count = (arr, labels) => arr.filter((v) => v != null && labels.includes(v)).length;
    const WIND_ORKAN = 118.8;
    const WIND_STORM = 61.2;
    const FRACTION_THUNDER_PARTLY = 0.1;
    const FRACTION_THUNDER_SOLID = 0.35;
    const FRACTION_RAIN_SOLID = 0.5;
    const FRACTION_RAIN_LIGHT = 0.2;
    const hours = bucket.condition.length || 24;
    const maxWind = maxN(bucket.wind_speed);
    if (maxWind >= WIND_ORKAN) {
      return "weather-tornado";
    }
    const thunderCount = count(bucket.condition, ["thunderstorm"]);
    if (thunderCount / hours >= FRACTION_THUNDER_SOLID) {
      return "weather-lightning";
    }
    if (thunderCount / hours >= FRACTION_THUNDER_PARTLY) {
      return "weather-partly-lightning";
    }
    if (maxWind >= WIND_STORM) {
      return "weather-windy";
    }
    const hailCount = count(bucket.condition, ["hail"]);
    if (hailCount > 0) {
      return "weather-hail";
    }
    const snowCount = count(bucket.condition, ["snow"]);
    if (snowCount / hours >= 0.3) {
      return "weather-snowy-heavy";
    }
    if (snowCount > 0) {
      return "weather-snowy";
    }
    const rainCount = count(bucket.condition, ["rain", "sleet", "drizzle"]);
    if (rainCount / hours >= FRACTION_RAIN_SOLID) {
      return "weather-pouring";
    }
    const fogCount = count(bucket.condition, ["fog"]);
    if (fogCount / hours > 0.2) {
      return "weather-fog";
    }
    if (rainCount / hours >= FRACTION_RAIN_LIGHT) {
      return "weather-rainy";
    }
    const avgClouds = bucket.cloud_cover ? avg(bucket.cloud_cover) : 0;
    if (avgClouds > 80) {
      return "weather-cloudy";
    }
    if (avgClouds > 40) {
      if (bucket.day) {
        return "weather-partly-cloudy";
      }
      return "weather-night-partly-cloudy";
    }
    if (bucket.day) {
      return "weather-sunny";
    }
    return "weather-night";
  }
  /**
   * Calculate day and night aggregated data from hourly data based on sunrise/sunset times
   *
   * @param dayWeatherArr Hourly weather data for one day
   * @param sunrise Sunrise time
   * @param sunset Sunset time
   * @returns Object containing aggregated day and night data
   */
  calculateDayNightData(dayWeatherArr, sunrise, sunset) {
    const dayValues = {};
    const nightValues = {};
    dayValues.day = true;
    nightValues.day = false;
    for (const key of Object.keys(dayWeatherArr)) {
      dayValues[key] = [];
      nightValues[key] = [];
    }
    const timestamps = dayWeatherArr.timestamp;
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
    const dayData = this.processAggregatedWeatherData(dayValues);
    const nightData = this.processAggregatedWeatherData(nightValues);
    return { dayData, nightData };
  }
  /**
   * Process aggregated weather data (common logic for both day and night)
   *
   * @param weatherValues Weather data arrays
   * @returns Processed weather data
   */
  processAggregatedWeatherData(weatherValues) {
    const result = {};
    for (const key of Object.keys(weatherValues)) {
      const k = key;
      switch (k) {
        case "precipitation":
        case "wind_gust_speed":
        case "precipitation_probability":
        case "precipitation_probability_6h":
        case "wind_speed": {
          const values = weatherValues[k];
          if (values && values.length > 0) {
            for (let j = 0; j < values.length; j++) {
              if (values[j] === null) {
                values[j] = 0;
              }
            }
          }
        }
      }
      switch (k) {
        case "timestamp": {
          result.timestamp = weatherValues.timestamp[0];
          break;
        }
        case "source_id": {
          result.source_id = weatherValues.source_id[0];
          break;
        }
        case "precipitation":
        case "wind_speed":
        case "solar":
        case "temperature": {
          const values = weatherValues[k];
          if (values && values.length > 0) {
            const min = Math.min(...values.filter((v) => v !== null));
            const max = Math.max(...values.filter((v) => v !== null));
            if (k !== "solar") {
              result[`${k}_min`] = min !== Infinity ? min : null;
            }
            result[`${k}_max`] = max !== -Infinity ? max : null;
          } else {
            if (k !== "solar") {
              result[`${k}_min`] = null;
            }
            result[`${k}_max`] = null;
          }
        }
        // eslint-disable-next-line no-fallthrough
        case "sunshine": {
          if (k === "precipitation" || k === "sunshine" || k === "solar") {
            const t = weatherValues[k].reduce((sum, value) => {
              if (typeof sum !== "number") {
                sum = 0;
              }
              if (value != null && typeof value === "number") {
                return sum + value;
              }
              return sum;
            }, 0);
            result[k] = null;
            if (t !== null && typeof t === "number") {
              result[k] = k !== "solar" ? Math.round(t * 10) / 10 : Math.round(t * 1e3) / 1e3;
            }
            break;
          }
        }
        // eslint-disable-next-line no-fallthrough
        case "wind_direction":
        case "cloud_cover":
        case "dew_point":
        case "relative_humidity":
        case "visibility":
        case "wind_gust_direction":
        case "wind_gust_speed":
        case "precipitation_probability":
        case "precipitation_probability_6h": {
          const values = weatherValues[k];
          if (values && values.length > 0) {
            let median = null;
            if (values.filter((v) => v !== null).length > 0) {
              const sortedValues = values.filter((v) => v !== null).sort((a, b) => a - b);
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
              if (values.filter((v) => v !== null).length > 2) {
                avg = Math.round(avg / values.filter((v) => v !== null).length * 10) / 10;
              } else {
                avg = null;
              }
            }
            result[`${k}_median`] = median;
            result[k] = avg;
          } else {
            result[k] = null;
            result[`${k}_median`] = null;
          }
          break;
        }
        case "icon":
        case "condition": {
          const tempArr = [];
          for (const value of weatherValues[k]) {
            if (value) {
              const index = tempArr.findIndex((el) => el.value === value);
              if (index !== -1) {
                tempArr[index].count++;
              } else {
                tempArr.push({ value, count: 1 });
              }
            }
          }
          tempArr.sort((a, b) => b.count - a.count);
          if (tempArr.length > 0) {
            if (k === "icon") {
              if (weatherValues.day !== false) {
                tempArr[0].value = tempArr[0].value.replace("-night", "-day");
              }
            }
            result[k] = tempArr[0].value;
          } else {
            result[k] = null;
          }
          result.icon_special = this.pickDailyWeatherIcon({
            condition: weatherValues.condition,
            wind_speed: weatherValues.wind_speed,
            cloud_cover: weatherValues.cloud_cover,
            day: weatherValues.day
          });
          break;
        }
        case "pressure_msl": {
          const values = weatherValues[k];
          if (values && values.length > 0) {
            let median = null;
            if (values.filter((v) => v !== null).length > 0) {
              const sortedValues = values.filter((v) => v !== null).sort((a, b) => a - b);
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
            if (avg != null && values.filter((v) => v !== null).length > 2) {
              avg = Math.round(avg / values.filter((v) => v !== null).length * 10) / 10;
            } else {
              avg = null;
            }
            result[`${k}_median`] = median;
            result[k] = avg;
          } else {
            result[k] = null;
            result[`${k}_median`] = null;
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
  estimatePVEnergyForHour(valueWhPerM2, time, coords, panels) {
    let quarterHoursValueSum = 0;
    for (let i = 0; i < 4; i++) {
      const quarterHourTime = time instanceof Date ? new Date(time.getTime() + i * 15 * 6e4) : typeof time === "number" ? new Date(time + i * 15 * 6e4) : new Date(new Date(time).getTime() + i * 15 * 6e4);
      quarterHoursValueSum += this.estimatePvEnergy(valueWhPerM2, quarterHourTime, coords, panels, this.wrArray);
    }
    return quarterHoursValueSum / 4;
  }
  estimatePvEnergy(valueWhPerM2, time, coords, panels, wrArray) {
    var _a;
    const toRad = (d) => d * Math.PI / 180;
    const clamp01 = (x) => Math.min(1, Math.max(0, x));
    const normEff = (pct) => clamp01(pct / 100);
    const ALBEDO = 0.2;
    const date = time instanceof Date ? time : new Date(time);
    const pos = suncalc.getPosition(date, coords.lat, coords.lon);
    const sunEl = pos.altitude;
    const sunAzDeg = (pos.azimuth * 180 / Math.PI + 180 + 360) % 360;
    const sunAz = toRad(sunAzDeg);
    if (sunEl <= 0 || valueWhPerM2 <= 0 || panels.length === 0) {
      return 0;
    }
    const beamFraction = clamp01(Math.sin(sunEl) * 1.1);
    const diffuseFraction = 1 - beamFraction;
    let totalWh = 0;
    for (let w = 0; w < wrArray.length; w++) {
      const maxPower = wrArray[w];
      let totalGroupPower = 0;
      for (const p of this.groupArray[w]) {
        p.wr = (_a = p.wr) != null ? _a : 0;
        if (p.wr !== w) {
          continue;
        }
        const eff = normEff(p.efficiency);
        if (eff <= 0 || p.area <= 0) {
          continue;
        }
        const tilt = toRad(p.tilt);
        const az = toRad((p.azimuth % 360 + 360) % 360);
        const nx = Math.sin(tilt) * Math.sin(az);
        const ny = Math.sin(tilt) * Math.cos(az);
        const nz = Math.cos(tilt);
        const sx = Math.cos(sunEl) * Math.sin(sunAz);
        const sy = Math.cos(sunEl) * Math.cos(sunAz);
        const sz = Math.sin(sunEl);
        const cosTheta = Math.max(0, nx * sx + ny * sy + nz * sz);
        const dirGain = cosTheta / Math.max(1e-6, Math.sin(sunEl));
        const skyDiffuseGain = (1 + Math.cos(tilt)) / 2;
        const groundRefGain = ALBEDO * (1 - Math.cos(tilt)) / 2;
        const poaWhPerM2 = valueWhPerM2 * (beamFraction * dirGain + diffuseFraction * skyDiffuseGain + groundRefGain);
        const elecWh = Math.max(0, poaWhPerM2) * p.area * eff;
        totalGroupPower += elecWh;
      }
      totalWh += maxPower > 0 ? Math.min(maxPower, totalGroupPower) : totalGroupPower;
    }
    return totalWh;
  }
}
if (require.main !== module) {
  module.exports = (options) => new Brightsky(options);
} else {
  (() => new Brightsky())();
}
//# sourceMappingURL=main.js.map
