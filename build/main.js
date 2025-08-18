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
class Brightsky extends utils.Adapter {
  library;
  unload = false;
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
    await this.delay(2e3);
    await this.weatherCurrentlyLoop();
    await this.delay(2e3);
    await this.weatherHourlyLoop();
    await this.delay(3e3);
    await this.weatherDailyLoop();
    this.log.info(
      `Adapter ${this.namespace} is now ready. Weather data will be updated every ${this.config.pollIntervalCurrently} minutes for current weather and every ${this.config.pollInterval} hours for hourly weather.`
    );
  }
  async weatherDailyLoop() {
    if (this.weatherTimeout[2]) {
      this.clearTimeout(this.weatherTimeout[2]);
    }
    await this.weatherDailyUpdate();
    let loopTime = 1;
    if ((/* @__PURE__ */ new Date()).getHours() >= 5 && (/* @__PURE__ */ new Date()).getHours() < 18) {
      loopTime = (/* @__PURE__ */ new Date()).setHours(18, 0, 0, 0) + 3e4 + Math.ceil(Math.random() * 5e3);
    } else {
      loopTime = (/* @__PURE__ */ new Date()).setHours(5, 0, 0, 0) + 3e4 + Math.ceil(Math.random() * 5e3);
    }
    this.weatherTimeout[2] = this.setTimeout(() => {
      void this.weatherDailyLoop();
    }, loopTime - Date.now());
  }
  async weatherDailyUpdate() {
    const startTime = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)).toISOString();
    const endTime = new Date(
      new Date((/* @__PURE__ */ new Date()).setHours(23, 59, 59, 999)).setDate((/* @__PURE__ */ new Date()).getDate() + 7)
    ).toISOString();
    const result = await import_axios.default.get(
      `https://api.brightsky.dev/weather?lat=${this.config.position.split(",")[0]}&lon=${this.config.position.split(",")[1]}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`
    );
    this.log.debug(
      `https://api.brightsky.dev/weather?lat=${this.config.position.split(",")[0]}&lon=${this.config.position.split(",")[1]}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`
    );
    if (result.data) {
      this.log.debug(`Daily weather data fetched successfully: ${JSON.stringify(result.data)}`);
      if (result.data.weather && Array.isArray(result.data.weather)) {
        const weatherArr = {
          d: [],
          min: [],
          max: [],
          result: []
        };
        const currentDay = Math.floor((/* @__PURE__ */ new Date()).getTime() / (24 * 60 * 60 * 1e3));
        for (const item of result.data.weather) {
          if (!item) {
            continue;
          }
          const dataDay = Math.floor(new Date(item.timestamp).getTime() / (24 * 60 * 60 * 1e3));
          const day = dataDay - currentDay;
          if (weatherArr.d[day] === void 0) {
            weatherArr.d[day] = JSON.parse(JSON.stringify(item));
            weatherArr.min[day] = JSON.parse(JSON.stringify(item));
            weatherArr.max[day] = JSON.parse(JSON.stringify(item));
          } else {
            for (const key of Object.keys(item)) {
              const k = key;
              const value = item[k];
              if (value !== null && value !== void 0 && typeof value === "number") {
                if (typeof weatherArr.min[day][k] === "number" && value < weatherArr.min[day][k]) {
                  weatherArr.min[day][k] = value;
                }
                if (typeof weatherArr.max[day][k] === "number" && value > weatherArr.max[day][k]) {
                  weatherArr.max[day][k] = value;
                }
                const t = weatherArr.d[day][k];
                if (typeof t === "number") {
                  weatherArr.d[day][k] = t + value;
                }
              }
            }
          }
        }
        for (let i = 0; i < weatherArr.d.length; i++) {
          for (const key of Object.keys(weatherArr.d[i])) {
            const k = key;
            if (typeof weatherArr.d[i][k] === "number") {
              weatherArr.d[i][k] = Math.round(weatherArr.d[i][k] / 24 * 10) / 10;
            }
          }
          const dailyData = {
            ...weatherArr.d[i],
            precipitation_min: weatherArr.min[i].precipitation,
            precipitation_max: weatherArr.max[i].precipitation,
            wind_speed_min: weatherArr.min[i].wind_speed,
            wind_speed_max: weatherArr.max[i].wind_speed,
            temperature_min: weatherArr.min[i].temperature,
            temperature_max: weatherArr.max[i].temperature
          };
          weatherArr.result.push(dailyData);
        }
        await this.library.writeFromJson(
          "daily.r",
          "weather.daily",
          import_definition.genericStateObjects,
          weatherArr.result,
          true
        );
        await this.setState("info.connection", true, true);
      }
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
        `https://api.brightsky.dev/weather?lat=${this.config.position.split(",")[0]}&lon=${this.config.position.split(",")[1]}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`
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
        `https://api.brightsky.dev/current_weather?lat=${this.config.position.split(",")[0]}&lon=${this.config.position.split(",")[1]}&max_dist=${this.config.maxDistance}`
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
