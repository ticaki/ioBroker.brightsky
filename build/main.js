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
import_axios.default.defaults.timeout = 15e3;
class Brightsky extends utils.Adapter {
  library;
  unload = false;
  posId = "";
  weatherTimeout = [];
  weatherArray = [];
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
    if (this.config.hours == void 0 || this.config.hours < 0 || this.config.hours > 48) {
      this.log.warn(`Invalid hours to display: ${this.config.hours}. Using default value of 24 hours.`);
      this.config.hours = 24;
    }
    if (this.config.pollInterval == void 0 || this.config.pollInterval < 1) {
      this.log.warn(`Invalid poll interval: ${this.config.pollInterval}. Using default value of 12 hour.`);
      this.config.pollInterval = 12;
    }
    if (this.config.pollIntervalCurrently == void 0 || this.config.pollIntervalCurrently < 10 || this.config.pollIntervalCurrently >= 2 ** 21 / 6e4) {
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
                    }
                    dailyData[`${k}_max`] = max !== -Infinity ? max : null;
                  } else {
                    if (k !== "solar") {
                      dailyData[`${k}_min`] = null;
                    }
                    dailyData[`${k}_max`] = null;
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
                  break;
                }
              }
            }
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
    this.weatherTimeout[0] = this.setTimeout(
      () => {
        void this.weatherCurrentlyLoop();
      },
      this.config.pollIntervalCurrently * 6e4 + Math.ceil(Math.random() * 8e3)
    );
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
    const startTime = new Date((/* @__PURE__ */ new Date()).setMinutes(0, 0, 0)).toISOString();
    const endTime = new Date((/* @__PURE__ */ new Date()).setHours((/* @__PURE__ */ new Date()).getHours() + this.config.hours, 0, 0, 0)).toISOString();
    try {
      const result = await import_axios.default.get(
        `https://api.brightsky.dev/weather?${this.posId}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`
      );
      if (result.data) {
        this.log.debug(`Hourly weather data fetched successfully: ${JSON.stringify(result.data)}`);
        if (result.data.weather && Array.isArray(result.data.weather)) {
          await this.library.writeFromJson(
            "hourly.r",
            "weather.hourly",
            import_definition.genericStateObjects,
            result.data.weather,
            true
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
    try {
      const result = await import_axios.default.get(
        `https://api.brightsky.dev/current_weather?${this.posId}&max_dist=${this.config.maxDistance}`
      );
      if (result.data) {
        this.log.debug(`Currently weather data fetched successfully: ${JSON.stringify(result.data)}`);
        if (result.data.weather) {
          await this.library.writeFromJson(
            "current",
            "weather.current",
            import_definition.genericStateObjects,
            result.data.weather,
            true
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
}
if (require.main !== module) {
  module.exports = (options) => new Brightsky(options);
} else {
  (() => new Brightsky())();
}
//# sourceMappingURL=main.js.map
