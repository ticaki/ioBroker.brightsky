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
var import_library = require("./lib/library");
var import_definition = require("./lib/definition");
var suncalc = __toESM(require("suncalc"));
class Brightsky extends utils.Adapter {
  library;
  unload = false;
  posId = "";
  weatherTimeout = [];
  controller = null;
  timeoutId = void 0;
  groupArray = [];
  wrArray = [];
  radarData = [];
  // Stores unprocessed radar data (before unit conversion) specifically for cumulative calculations.
  // This is distinct from the processed radarData array, which contains converted/processed values.
  rawRadarData = [];
  radarRotationTimeout = void 0;
  /**
   * Creates a new instance of the Brightsky adapter
   *
   * @param options Adapter configuration options
   */
  constructor(options = {}) {
    super({
      ...options,
      name: "brightsky",
      useFormatDate: true
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
    await this.library.init();
    if (!this.config.createDaily) {
      await this.delObjectAsync("daily", { recursive: true });
    } else {
      await this.library.writedp("daily", null, import_definition.genericStateObjects.weather.daily._channel);
    }
    if (!this.config.createCurrently) {
      await this.delObjectAsync("current", { recursive: true });
    } else {
      await this.library.writedp("current", null, import_definition.genericStateObjects.weather.current._channel);
    }
    if (!this.config.createHourly) {
      await this.delObjectAsync("hourly", { recursive: true });
    } else {
      await this.library.writedp("hourly", null, import_definition.genericStateObjects.weather.hourly._channel);
      await this.library.writedp("hourly.sources", void 0, import_definition.genericStateObjects.weather.sources._channel);
    }
    if (!this.config.createRadar) {
      await this.delObjectAsync("radar", { recursive: true });
    } else {
      await this.library.writedp("radar", null, import_definition.genericStateObjects.weather.radar._channel);
      await this.library.writedp(
        `radar.max_precipitation_forecast`,
        null,
        import_definition.genericStateObjects.max_precipitation_forecast._channel
      );
      if (!this.config.createRadarData) {
        await this.delObjectAsync("radar.data", { recursive: true });
      } else {
        await this.library.writedp(`radar.data`, null, {
          _id: "",
          type: "channel",
          common: { name: "Radar Data" },
          native: {}
        });
      }
    }
    const states = await this.getStatesAsync("*");
    await this.library.initStates(states);
    if (!this.config.createCurrently && !this.config.createHourly && !this.config.createDaily && !this.config.createRadar) {
      this.log.error(
        "No data creation is enabled in the adapter configuration. Please enable at least one of the options: Currently, Hourly, Daily, or Radar."
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
      this.config.pollIntervalCurrently = 60;
    }
    if (this.config.maxDistance == void 0 || this.config.maxDistance < 1e3) {
      this.log.warn(`Invalid max distance: ${this.config.maxDistance}. Using default value of 50000 meters.`);
      this.config.maxDistance = 5e4;
    }
    if (this.config.pollIntervalRadar == void 0 || this.config.pollIntervalRadar < 5 || this.config.pollIntervalRadar >= 2 ** 31 / 6e4) {
      this.log.warn(
        `Invalid poll interval radar: ${this.config.pollIntervalRadar}. Using default value of 10 minutes.`
      );
      this.config.pollIntervalRadar = 10;
    }
    if (this.config.pollIntervalRadar % 5 !== 0) {
      const adjusted = Math.round(this.config.pollIntervalRadar / 5) * 5;
      this.log.warn(
        `Radar poll interval must be divisible by 5. Adjusting from ${this.config.pollIntervalRadar} to ${adjusted} minutes.`
      );
      this.config.pollIntervalRadar = adjusted;
    }
    if (this.config.radarDistance == void 0 || this.config.radarDistance < 400 || this.config.radarDistance > 5e4) {
      this.log.warn(
        `Invalid radar distance: ${this.config.radarDistance}. Using default value of 2000 meters (2 km).`
      );
      this.config.radarDistance = 2e3;
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
    if (this.config.createRadar) {
      await this.delay(3e3);
      await this.weatherRadarLoop();
    }
    this.log.info(
      `Adapter started with configuration: Position: ${this.config.position}, WMO Station ID: ${this.config.wmo_station}, DWD Station ID: ${this.config.dwd_station_id}, ${this.config.createCurrently ? `Currently data enabled. Poll interval: ${this.config.pollIntervalCurrently} minutes` : "Currently data disabled"} - ${this.config.createHourly ? `Hourly data enabled. Poll interval: ${this.config.pollInterval} hours` : "Hourly data disabled"} - ${this.config.createDaily ? "Daily data enabled" : "Daily data disabled"} - ${this.config.createRadar ? `Radar data enabled. Poll interval: ${this.config.pollIntervalRadar} minutes` : "Radar data disabled"}. Max distance: ${this.config.maxDistance} meters.`
    );
    this.log.info(
      `Using ${this.config.dwd_station_id ? `WMO Station ID: ${this.config.dwd_station_id}` : `${this.config.wmo_station ? `WMO Station ID: ${this.config.wmo_station}` : `Position: ${this.config.position} with max distance: ${this.config.maxDistance} meters`}`}`
    );
  }
  /**
   * Manages the daily weather data update loop
   * Schedules updates at specific times: 5:00, 18:00, and midnight with random delay
   */
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
    loopTime = Math.max(loopTime, 15 * 6e4);
    this.weatherTimeout[2] = this.setTimeout(() => {
      void this.weatherDailyLoop();
    }, loopTime);
  }
  /**
   * Fetches and processes daily weather forecast data from BrightSky API
   * Retrieves weather data for the next 8 days and creates aggregated daily values
   */
  async weatherDailyUpdate() {
    var _a, _b;
    const startTime = new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)).toISOString();
    const endTime = new Date(
      new Date((/* @__PURE__ */ new Date()).setHours(23, 59, 59, 999)).setDate((/* @__PURE__ */ new Date()).getDate() + 7)
    ).toISOString();
    try {
      const response = await this.fetch(
        `https://api.brightsky.dev/weather?${this.posId}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`
      );
      this.log.debug(
        `https://api.brightsky.dev/weather?lat=${this.config.position.split(",")[0]}&lon=${this.config.position.split(",")[1]}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`
      );
      if (response.status !== 200) {
        throw new Error(`Error fetching daily weather data: ${response.status} ${response.statusText}`);
      }
      const result = { data: await response.json() };
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
            item.apparent_temperature = this.calculateApparentTemperature(
              item.temperature,
              item.wind_speed,
              item.relative_humidity
            );
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
                case "pressure_msl":
                case "visibility":
                case "wind_gust_direction":
                case "wind_gust_speed":
                case "precipitation_probability":
                case "precipitation_probability_6h":
                case "apparent_temperature": {
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
                        if (values.filter((v) => v !== null).length > 6) {
                          if (k === "relative_humidity" || k === "cloud_cover" || k === "visibility" || k === "wind_direction" || k === "wind_gust_direction" || k === "pressure_msl") {
                            avg = Math.round(avg / values.filter((v) => v !== null).length);
                          } else {
                            avg = Math.round(
                              avg / values.filter((v) => v !== null).length * 10
                            ) / 10;
                          }
                        } else {
                          avg = null;
                        }
                      }
                      if (k === "apparent_temperature") {
                        const min = Math.min(...values.filter((v) => v !== null));
                        const max = Math.max(...values.filter((v) => v !== null));
                        dailyData.apparent_temperature_min = min !== Infinity ? Math.round(min * 10) / 10 : null;
                        dailyData.apparent_temperature_max = max !== -Infinity ? Math.round(max * 10) / 10 : null;
                        dailyData.apparent_temperature_median = median !== null ? Math.round(median * 10) / 10 : null;
                        dailyData.apparent_temperature = avg;
                      } else {
                        dailyData[`${k}_median`] = median;
                        dailyData[k] = avg;
                      }
                    } else {
                      if (k === "apparent_temperature") {
                        dailyData.apparent_temperature_min = null;
                        dailyData.apparent_temperature_max = null;
                        dailyData.apparent_temperature_median = null;
                        dailyData.apparent_temperature = null;
                      } else {
                        dailyData[k] = null;
                        dailyData[`${k}_median`] = null;
                      }
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
                  const iconsDay = this.pickDailyWeatherIcon({
                    condition: weatherArr[i].condition,
                    wind_speed: weatherArr[i].wind_speed,
                    cloud_cover: weatherArr[i].cloud_cover
                  });
                  dailyData.icon_special = iconsDay.mdi;
                  dailyData.iconUrl = iconsDay.url;
                  const condition = (_b = dailyData.condition) != null ? _b : "unknown";
                  dailyData.conditionUI = this.library.getTranslation(
                    condition.charAt(0).toUpperCase() + condition.slice(1)
                  );
                  break;
                }
                default: {
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
            const date = new Date(dailyData.timestamp);
            const systemLanguage = this.library.getLocalLanguage();
            dailyData.dayName_short = date.toLocaleString(systemLanguage, { weekday: "short" });
            dailyData.dayName_long = date.toLocaleString(systemLanguage, { weekday: "long" });
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
      this.handleFetchError(error);
      await this.setState("info.connection", false, true);
    }
  }
  handleFetchError(error) {
    var _a;
    if (error.name !== "AbortError") {
      const errorDetails = [];
      errorDetails.push(`Error in getPirateWeatherLoop:`);
      if (error instanceof Error) {
        let isHttpError = false;
        errorDetails.push(`  Name: ${error.name}`);
        if (error.cause && typeof error.cause === "object" && "code" in error.cause && typeof error.cause.code === "string") {
          isHttpError = true;
          errorDetails.push(`  code: ${error.cause.code}`);
        }
        errorDetails.push(`  Message: ${error.message}`);
        isHttpError = isHttpError || error.message.includes("HTTP") || error.status || error.url;
        if (error.stack && !isHttpError) {
          errorDetails.push(`  Stack: ${error.stack}`);
        }
      } else if (typeof error === "object" && error !== null) {
        errorDetails.push(`  Type: ${((_a = error.constructor) == null ? void 0 : _a.name) || "Object"}`);
        if (error.status) {
          errorDetails.push(`  HTTP Status: ${error.status}`);
        }
        if (error.statusText) {
          errorDetails.push(`  Status Text: ${error.statusText}`);
        }
        if (error.code) {
          errorDetails.push(`  Error Code: ${error.code}`);
        }
        errorDetails.push(`  Full Error: ${JSON.stringify(error, null, 2)}`);
      } else {
        errorDetails.push(`  Raw Error: ${String(error)}`);
      }
      this.log.error(errorDetails.join("\n"));
    }
  }
  /**
   * Manages the current weather data update loop
   * Automatically adjusts polling interval around sunrise/sunset times
   */
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
    nextInterval = Math.max(nextInterval, 6e4);
    this.weatherTimeout[0] = this.setTimeout(() => {
      void this.weatherCurrentlyLoop();
    }, nextInterval);
  }
  /**
   * Manages the hourly weather data update loop
   * Schedules updates based on configured poll interval with random delay
   */
  async weatherHourlyLoop() {
    if (this.weatherTimeout[1]) {
      this.clearTimeout(this.weatherTimeout[1]);
    }
    await this.weatherHourlyUpdate();
    const loopTime = (/* @__PURE__ */ new Date()).setHours((/* @__PURE__ */ new Date()).getHours() + this.config.pollInterval, 0, 0) + 3e3 + Math.ceil(Math.random() * 5e3);
    this.weatherTimeout[1] = this.setTimeout(
      () => {
        void this.weatherHourlyLoop();
      },
      Math.max(loopTime - Date.now(), 5 * 6e4)
    );
  }
  /**
   * Fetches and processes hourly weather forecast data from BrightSky API
   * Retrieves weather data for the configured number of hours ahead
   */
  async weatherHourlyUpdate() {
    var _a, _b;
    const startTime = new Date((/* @__PURE__ */ new Date()).setMinutes(0, 0, 0)).toISOString();
    const endTime = new Date((/* @__PURE__ */ new Date()).setHours((/* @__PURE__ */ new Date()).getHours() + this.config.hours, 0, 0, 0)).toISOString();
    try {
      const response = await this.fetch(
        `https://api.brightsky.dev/weather?${this.posId}&max_dist=${this.config.maxDistance}&date=${startTime}&last_date=${endTime}`
      );
      if (response.status !== 200) {
        throw new Error(`Error fetching hourly weather data: ${response.status} ${response.statusText}`);
      }
      const result = { data: await response.json() };
      if (result.data) {
        this.log.debug(`Hourly weather data fetched successfully: ${JSON.stringify(result.data)}`);
        if (result.data.weather && Array.isArray(result.data.weather)) {
          const coords = this.config.position.split(",").map(parseFloat);
          for (const item of result.data.weather) {
            if (!item) {
              continue;
            }
            item.solar_estimate = 0;
            item.wind_bearing_text = this.getWindBearingText((_a = item.wind_direction) != null ? _a : void 0);
            const t = new Date(item.timestamp);
            const { sunrise, sunset } = suncalc.getTimes(t, coords[0], coords[1]);
            const isDayTime = t >= sunrise && t <= sunset;
            const iconsHour = this.pickHourlyWeatherIcon({
              condition: item.condition,
              wind_speed: item.wind_speed,
              cloud_cover: item.cloud_cover,
              day: isDayTime,
              precipitation_probability: item.precipitation_probability
            });
            item.icon_special = iconsHour.mdi;
            item.iconUrl = iconsHour.url;
            item.apparent_temperature = this.calculateApparentTemperature(
              item.temperature,
              item.wind_speed,
              item.relative_humidity
            );
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
      this.handleFetchError(error);
      await this.setState("info.connection", false, true);
    }
  }
  /**
   * Fetches and processes current weather data from BrightSky API
   * Updates current weather states with latest observations
   */
  async weatherCurrentlyUpdate() {
    var _a;
    try {
      const response = await this.fetch(
        `https://api.brightsky.dev/current_weather?${this.posId}&max_dist=${this.config.maxDistance}`
      );
      if (response.status !== 200) {
        throw new Error(`Error fetching current weather data: ${response.status} ${response.statusText}`);
      }
      const result = { data: await response.json() };
      if (result.data) {
        this.log.debug(`Currently weather data fetched successfully: ${JSON.stringify(result.data)}`);
        if (result.data.weather) {
          const weather = result.data.weather;
          weather.wind_bearing_text = this.getWindBearingText((_a = weather.wind_direction_10) != null ? _a : void 0);
          weather.wind_force = this.getBeaufortScale(weather.wind_speed_10);
          weather.wind_force_desc = this.getBeaufortDescription(weather.wind_force);
          const coords = this.config.position.split(",").map(parseFloat);
          const { sunrise, sunset } = suncalc.getTimes(/* @__PURE__ */ new Date(), coords[0], coords[1]);
          const now = /* @__PURE__ */ new Date();
          const isDayTime = now >= sunrise && now <= sunset;
          const iconsNow = this.pickHourlyWeatherIcon({
            condition: weather.condition,
            wind_speed: weather.wind_speed_10,
            cloud_cover: weather.cloud_cover,
            day: isDayTime
          });
          weather.icon_special = iconsNow.mdi;
          weather.iconUrl = iconsNow.url;
          weather.apparent_temperature = this.calculateApparentTemperature(
            weather.temperature,
            weather.wind_speed_10,
            weather.relative_humidity
          );
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
      this.handleFetchError(error);
      await this.setState("info.connection", false, true);
    }
  }
  /**
   * Manages the radar data update loop
   * Schedules updates based on configured radar poll interval
   */
  async weatherRadarLoop() {
    if (this.weatherTimeout[3]) {
      this.clearTimeout(this.weatherTimeout[3]);
    }
    await this.weatherRadarUpdate();
    let nextInterval = this.config.pollIntervalRadar * 6e4 + 1e4 + Math.ceil(Math.random() * 5e3);
    nextInterval = Math.max(nextInterval, 3 * 6e4);
    this.weatherTimeout[3] = this.setTimeout(() => {
      void this.weatherRadarLoop();
    }, nextInterval);
  }
  /**
   * Fetches and processes radar precipitation data from BrightSky API
   * Updates radar states with precipitation measurements and forecasts
   *
   * API Documentation: https://brightsky.dev/docs/#/operations/getRadar
   * OpenAPI Spec: https://api.brightsky.dev/openapi.json
   *
   * The 'distance' parameter defines how far the data extends to each side of the center point.
   * For example, distance=10000 (10km) creates a square area of ~20km × 20km total.
   */
  async weatherRadarUpdate() {
    try {
      const coords = this.config.position.split(",").map(parseFloat);
      const now = /* @__PURE__ */ new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1e3);
      const dateParam = now.toISOString();
      const response = await this.fetch(
        `https://api.brightsky.dev/radar?lat=${coords[0]}&lon=${coords[1]}&distance=${this.config.radarDistance}&date=${dateParam}&format=plain`
      );
      if (response.status !== 200) {
        throw new Error(`Error fetching radar data: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      if (result && result.radar && Array.isArray(result.radar)) {
        this.log.debug(`Radar data fetched successfully: ${result.radar.length} items`);
        const filteredRadar = result.radar.filter((item) => {
          const itemTime = new Date(item.timestamp);
          return itemTime >= now && itemTime <= twoHoursLater;
        });
        this.rawRadarData = filteredRadar;
        const fetchTime = now.toISOString();
        this.radarData = filteredRadar.map((item) => {
          const values = [];
          if (Array.isArray(item.precipitation_5)) {
            for (const row of item.precipitation_5) {
              if (Array.isArray(row)) {
                for (const value of row) {
                  if (typeof value === "number") {
                    const convertedValue = value / 100;
                    values.push(convertedValue);
                  }
                }
              }
            }
          }
          let avg = 0;
          let min = 0;
          let max = 0;
          let median = 0;
          if (values.length > 0) {
            const sum = values.reduce((acc, val) => acc + val, 0);
            avg = sum / values.length;
            min = Math.min(...values);
            max = Math.max(...values);
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
          }
          return {
            timestamp: item.timestamp,
            source: item.source,
            precipitation_5: Math.round(avg * 100) / 100,
            // Round to 2 decimal places
            precipitation_5_min: Math.round(min * 100) / 100,
            precipitation_5_max: Math.round(max * 100) / 100,
            precipitation_5_median: Math.round(median * 100) / 100,
            forecast_time: fetchTime
          };
        });
        this.radarData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        await this.writeRadarData();
        if (this.config.pollIntervalRadar > 5) {
          this.setupRadarRotation();
        }
        await this.setState("info.connection", true, true);
      }
    } catch (error) {
      this.handleFetchError(error);
      await this.setState("info.connection", false, true);
    }
  }
  /**
   * Sets up automatic rotation of radar data every 5 minutes
   * Used when poll interval is greater than 5 minutes to maintain continuous data
   */
  setupRadarRotation() {
    if (this.radarRotationTimeout) {
      this.clearTimeout(this.radarRotationTimeout);
    }
    const rotateRadarData = async () => {
      if (this.radarData.length === 0) {
        return;
      }
      this.radarData.shift();
      if (this.radarData.length > 0) {
        const lastItem = this.radarData[this.radarData.length - 1];
        const lastTime = new Date(lastItem.timestamp);
        const nextTime = new Date(lastTime.getTime() + 5 * 60 * 1e3);
        this.radarData.push({
          timestamp: nextTime.toISOString(),
          source: lastItem.source,
          precipitation_5: -1,
          // Placeholder value
          precipitation_5_min: -1,
          precipitation_5_max: -1,
          precipitation_5_median: -1,
          forecast_time: lastItem.forecast_time
        });
      }
      await this.writeRadarData();
      if (this.radarData.length > 0) {
        this.radarRotationTimeout = this.setTimeout(
          () => {
            void rotateRadarData();
          },
          5 * 60 * 1e3
        );
      }
    };
    this.radarRotationTimeout = this.setTimeout(
      () => {
        void rotateRadarData();
      },
      5 * 60 * 1e3
    );
  }
  /**
   * Writes radar data to ioBroker states
   * Creates detailed time-based states if createRadarData is enabled
   */
  async writeRadarData() {
    if (this.config.createRadarData) {
      const dataToWrite = [];
      for (let i = 0; i < this.radarData.length; i++) {
        const item = this.radarData[i];
        const minutesOffset = i * 5;
        const indexLabel = minutesOffset.toString().padStart(2, "0");
        dataToWrite.push({
          _index: indexLabel,
          ...item
        });
      }
      if (dataToWrite.length > 0) {
        await this.library.writeFromJson(
          "radar.data.r",
          "weather.radar",
          import_definition.genericStateObjects,
          dataToWrite,
          true
        );
      }
    }
    await this.writeMaxPrecipitationForecasts();
  }
  /**
   * Calculates and writes maximum precipitation forecasts for various time intervals
   * Analyzes radar data to determine max precipitation in 5, 10, 15, 30, 45, 60, and 90 minute windows
   */
  async writeMaxPrecipitationForecasts() {
    const intervals = [5, 10, 15, 30, 45, 60, 90];
    const forecasts = {};
    const cumulativeForecasts = {};
    for (const interval of intervals) {
      const numIntervals = Math.ceil(interval / 5);
      let maxPrecipitation = -1;
      let maxCumulative = -1;
      if (this.radarData.length > 0) {
        for (let i = 0; i < numIntervals && i < this.radarData.length; i++) {
          const item = this.radarData[i];
          if (item.precipitation_5_max !== void 0 && item.precipitation_5_max > maxPrecipitation) {
            maxPrecipitation = item.precipitation_5_max;
          }
        }
      }
      if (this.rawRadarData.length > 0) {
        let numCols = 0;
        if (this.rawRadarData[0] && Array.isArray(this.rawRadarData[0].precipitation_5)) {
          for (const row of this.rawRadarData[0].precipitation_5) {
            if (Array.isArray(row) && row.length > numCols) {
              numCols = row.length;
            }
          }
        }
        if (numCols > 0) {
          const columnSums = new Array(numCols).fill(0);
          for (let i = 0; i < numIntervals && i < this.rawRadarData.length; i++) {
            const item = this.rawRadarData[i];
            if (Array.isArray(item.precipitation_5)) {
              for (const row of item.precipitation_5) {
                if (Array.isArray(row)) {
                  for (let col = 0; col < row.length && col < numCols; col++) {
                    const value = row[col];
                    if (typeof value === "number") {
                      columnSums[col] += value / 100;
                    }
                  }
                }
              }
            }
          }
          if (columnSums.length > 0) {
            maxCumulative = Math.max(...columnSums);
            maxCumulative = Math.round(maxCumulative * 100) / 100;
          }
        }
      }
      const key = interval.toString().padStart(2, "0");
      forecasts[`next_${key}min`] = maxPrecipitation;
      cumulativeForecasts[`next_${key}min_sum`] = maxCumulative;
    }
    for (const [key, value] of Object.entries(forecasts)) {
      await this.library.writedp(
        `radar.max_precipitation_forecast.${key}`,
        value,
        import_definition.genericStateObjects.max_precipitation_forecast[key]
      );
    }
    for (const [key, value] of Object.entries(cumulativeForecasts)) {
      await this.library.writedp(
        `radar.max_precipitation_forecast.${key}`,
        value,
        import_definition.genericStateObjects.max_precipitation_forecast[key]
      );
    }
  }
  /**
   * Converts wind direction in degrees to compass direction text
   *
   * @param windBearing Wind direction in degrees (0-360)
   * @returns Compass direction abbreviation (e.g., "N", "NNE", "NE")
   */
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
  /**
   * Converts wind speed in km/h to Beaufort scale (0-12)
   * Based on DWD wind warning scale: https://www.wettergefahren.de/warnungen/windwarnskala.html
   *
   * @param windSpeed Wind speed in km/h
   * @returns Beaufort scale number (0-12)
   */
  getBeaufortScale(windSpeed) {
    if (windSpeed === void 0 || windSpeed === null) {
      return 0;
    }
    if (windSpeed < 1) {
      return 0;
    }
    if (windSpeed < 6) {
      return 1;
    }
    if (windSpeed < 12) {
      return 2;
    }
    if (windSpeed < 20) {
      return 3;
    }
    if (windSpeed < 29) {
      return 4;
    }
    if (windSpeed < 39) {
      return 5;
    }
    if (windSpeed < 50) {
      return 6;
    }
    if (windSpeed < 62) {
      return 7;
    }
    if (windSpeed < 75) {
      return 8;
    }
    if (windSpeed < 89) {
      return 9;
    }
    if (windSpeed < 103) {
      return 10;
    }
    if (windSpeed < 118) {
      return 11;
    }
    return 12;
  }
  /**
   * Gets the translated description for a Beaufort scale value
   *
   * @param beaufortScale Beaufort scale number (0-12)
   * @returns Translated description of wind force
   */
  getBeaufortDescription(beaufortScale) {
    const descriptions = [
      "BF0",
      // Calm
      "BF1",
      // Light air
      "BF2",
      // Light breeze
      "BF3",
      // Gentle breeze
      "BF4",
      // Moderate breeze
      "BF5",
      // Fresh breeze
      "BF6",
      // Strong breeze
      "BF7",
      // Near gale
      "BF8",
      // Gale
      "BF9",
      // Strong gale
      "BF10",
      // Storm
      "BF11",
      // Violent storm
      "BF12"
      // Hurricane
    ];
    return this.library.getTranslation(descriptions[beaufortScale] || "BF0");
  }
  /**
   * Calculates the apparent temperature (feels like) based on actual temperature, wind speed, and humidity
   * Uses windchill formula for cold conditions and heat index formula for hot conditions
   *
   * Windchill formula (US/Canada, UK):
   * - Applied when temperature < 10°C and wind speed 4.8-177 km/h
   * - Formula: 13.12 + 0.6215*T - 11.37*V^0.16 + 0.3965*T*V^0.16
   *
   * Heat index formula:
   * - Applied when temperature > 26.7°C and humidity > 40%
   * - Formula: -8.784695 + 1.61139411*T + 2.338549*RH - 0.14611605*T*RH - 0.012308094*T²
   *            - 0.016424828*RH² + 0.002211732*T²*RH + 0.00072546*T*RH² - 0.000003582*T²*RH²
   *
   * @param temperature Temperature in °C
   * @param windSpeed Wind speed in km/h
   * @param humidity Relative humidity in percent (0-100)
   * @returns Apparent temperature in °C, rounded to 1 decimal place, or null if parameters invalid
   */
  calculateApparentTemperature(temperature, windSpeed, humidity) {
    if (temperature === null || temperature === void 0) {
      return null;
    }
    if (temperature < 10 && windSpeed !== null && windSpeed !== void 0 && windSpeed > 4.8 && windSpeed < 177) {
      const windchill = 13.12 + 0.6215 * temperature - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temperature * Math.pow(windSpeed, 0.16);
      return Math.round(windchill * 10) / 10;
    }
    if (temperature > 26.7 && humidity !== null && humidity !== void 0 && humidity > 40) {
      const h = Math.max(0, Math.min(100, humidity));
      const t = temperature;
      const heatIndex = -8.784695 + 1.61139411 * t + 2.338549 * h - 0.14611605 * t * h - 0.012308094 * (t * t) - 0.016424828 * (h * h) + 2211732e-9 * (t * t) * h + 72546e-8 * t * (h * h) - 3582e-9 * (t * t) * (h * h);
      return Math.round(heatIndex * 10) / 10;
    }
    return Math.round(temperature * 10) / 10;
  }
  /**
   * Called when adapter shuts down - cleanup timers and connections
   *
   * @param callback Callback to invoke after cleanup
   */
  onUnload(callback) {
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
    } finally {
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
    const T = {
      wind: {
        dangerous: 118.8,
        // km/h Orkan
        strong: 61.2,
        // km/h Sturm
        breezy: 35
        // km/h böig
      },
      rain: {
        heavy: 0.5,
        // Anteil für heavy rain
        light: 0.2,
        // Anteil für light rain
        possibleMin: 0.1,
        // Anteil für possible rain
        possibleMax: 0.35,
        minCount: 2
        // min. Stunden für rain relevant
      },
      drizzle: {
        minCount: 2,
        possibleMin: 0.1,
        possibleMax: 0.35
      },
      snow: {
        heavy: 0.3,
        possibleMin: 0.1,
        possibleMax: 0.35,
        minCount: 2
      },
      sleet: {
        heavy: 0.3,
        possibleMin: 0.1,
        possibleMax: 0.35,
        minCount: 2
      },
      hail: {
        possibleMin: 0.01,
        possibleMax: 0.35,
        minCount: 1
      },
      fog: {
        present: 0.2,
        possibleMin: 0.1,
        possibleMax: 0.35,
        minCount: 4
      },
      smoke: {
        present: 0.2,
        possibleMin: 0.1,
        possibleMax: 0.35,
        minCount: 3
      },
      thunder: {
        partly: 0.1,
        solid: 0.35
      },
      clouds: {
        cloudy: 70,
        partly: 30
      },
      bucket: {
        minHours: 1,
        defaultHours: 24
      },
      defaults: {
        iceDay: "clear-day",
        iceNight: "clear-night"
      }
    };
    const median = (arr) => {
      const xs = arr.filter((v) => v != null).sort((a, b) => a - b);
      if (!xs.length) {
        return 0;
      }
      const mid = Math.floor(xs.length / 2);
      return xs.length % 2 === 0 ? (xs[mid - 1] + xs[mid]) / 2 : xs[mid];
    };
    const maxN = (arr) => {
      const xs = arr.filter((v) => v != null);
      return xs.length ? Math.max(...xs) : 0;
    };
    const count = (arr, labels) => arr.filter((v) => v != null && labels.includes(v)).length;
    const inPossibleRange = (frac, min, max) => frac >= min && frac < max;
    const isDay = bucket.day !== false;
    const hours = Math.max(T.bucket.minHours, bucket.condition.length || T.bucket.defaultHours);
    const medianClouds = bucket.cloud_cover ? median(bucket.cloud_cover) : 0;
    const maxWind = maxN(bucket.wind_speed);
    const thunderCount = count(bucket.condition, ["thunderstorm"]);
    const hailCount = count(bucket.condition, ["hail"]);
    const snowCount = count(bucket.condition, ["snow"]);
    const sleetCount = count(bucket.condition, ["sleet"]);
    const drizzleCount = count(bucket.condition, ["drizzle"]);
    const rainCount = count(bucket.condition, ["rain"]);
    const fogCount = count(bucket.condition, ["fog", "mist", "haze"]);
    const smokeCount = count(bucket.condition, ["smoke"]);
    const rainFrac = (rainCount + drizzleCount) / hours;
    const snowFrac = snowCount / hours;
    const sleetFrac = sleetCount / hours;
    const thunderFrac = thunderCount / hours;
    const hailFrac = hailCount / hours;
    const fogFrac = fogCount / hours;
    const smokeFrac = smokeCount / hours;
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
    const selectMdi = () => {
      if (hasDangerousWind) {
        return "weather-tornado";
      }
      if (hasThunderSolid) {
        return "weather-lightning";
      }
      if (hasThunderPartly) {
        return "weather-partly-lightning";
      }
      if (hasHail) {
        return "weather-hail";
      }
      if (hasHeavySnow) {
        return "weather-snowy-heavy";
      }
      if (hasSleet) {
        return "weather-snowy-rainy";
      }
      if (hasHeavyRain) {
        return "weather-pouring";
      }
      if (hasStrongWind) {
        return "weather-windy";
      }
      if (hasFogPresent || hasSmokePresent) {
        return "weather-fog";
      }
      if (hasLightRain) {
        return "weather-rainy";
      }
      if (medianClouds > T.clouds.cloudy) {
        return "weather-cloudy";
      }
      if (medianClouds > T.clouds.partly) {
        return isDay ? "weather-partly-cloudy" : "weather-night-partly-cloudy";
      }
      if (!isDay) {
        return "weather-night";
      }
      return "weather-sunny";
    };
    const selectIcebear = () => {
      const daySuffix = isDay ? "day" : "night";
      if (hasDangerousWind) {
        return "dangerous-wind";
      }
      if (hasThunderSolid || hasThunderPartly) {
        return "thunderstorm";
      }
      if (hailCount >= T.hail.minCount) {
        if (inPossibleRange(hailFrac, T.hail.possibleMin, T.hail.possibleMax)) {
          return `possible-hail-${daySuffix}`;
        }
        return "hail";
      }
      if (snowCount >= T.snow.minCount) {
        if (snowFrac >= T.snow.heavy) {
          return "snow";
        }
      }
      if (sleetCount >= T.sleet.minCount) {
        if (sleetFrac >= T.sleet.heavy) {
          return "sleet";
        }
      }
      if (rainCount >= T.rain.minCount) {
        if (rainFrac >= T.rain.heavy) {
          return "rain";
        }
      }
      if (hasStrongWind) {
        return "wind";
      }
      if (snowCount >= T.snow.minCount) {
        if (inPossibleRange(snowFrac, T.snow.possibleMin, T.snow.possibleMax)) {
          return `possible-snow-${daySuffix}`;
        }
      }
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
      if (drizzleCount >= T.drizzle.minCount) {
        return "drizzle";
      }
      if (fogCount >= T.fog.minCount) {
        if (fogFrac >= T.fog.present) {
          return "fog";
        }
        if (inPossibleRange(fogFrac, T.fog.possibleMin, T.fog.possibleMax)) {
          return `possible-fog-${daySuffix}`;
        }
      }
      if (smokeCount >= T.smoke.minCount) {
        if (smokeFrac >= T.smoke.present) {
          return "smoke";
        }
        if (inPossibleRange(smokeFrac, T.smoke.possibleMin, T.smoke.possibleMax)) {
          return `possible-smoke-${daySuffix}`;
        }
      }
      if (medianClouds > T.clouds.cloudy) {
        return "cloudy";
      }
      if (medianClouds > T.clouds.partly) {
        return `partly-cloudy-${daySuffix}`;
      }
      if (hasBreezyWind) {
        return "breezy";
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
  pickHourlyWeatherIcon(hour) {
    var _a, _b, _c, _d;
    const T = {
      wind: { dangerous: 118.8, strong: 61.2, breezy: 35 },
      // km/h
      clouds: { cloudy: 80, partly: 40 },
      // %
      precip: {
        // possible rain via probability window (if no solid precip condition)
        possibleMinPct: 20,
        possibleMaxPct: 60
      }
    };
    const isDay = hour.day !== false;
    const cond = (_a = hour.condition) != null ? _a : "";
    const wind = (_b = hour.wind_speed) != null ? _b : 0;
    const clouds = (_c = hour.cloud_cover) != null ? _c : 0;
    const prob = (_d = hour.precipitation_probability) != null ? _d : null;
    const hasDangerousWind = wind >= T.wind.dangerous;
    const hasStrongWind = wind >= T.wind.strong;
    const hasBreezyWind = wind >= T.wind.breezy;
    const isThunder = cond === "thunderstorm";
    const isHail = cond === "hail";
    const isSnow = cond === "snow";
    const isSleet = cond === "sleet";
    const isDrizzle = cond === "drizzle";
    const isRain = cond === "rain";
    const isFogLike = cond === "fog" || cond === "mist" || cond === "haze";
    const isSmoke = cond === "smoke";
    const selectMdi = () => {
      if (hasDangerousWind) {
        return "weather-tornado";
      }
      if (isThunder) {
        return "weather-lightning";
      }
      if (isHail) {
        return "weather-hail";
      }
      if (isSnow) {
        return "weather-snowy-heavy";
      }
      if (isSleet) {
        return "weather-snowy-rainy";
      }
      if (isRain) {
        return "weather-pouring";
      }
      if (isDrizzle) {
        return "weather-rainy";
      }
      if (isFogLike || isSmoke) {
        return "weather-fog";
      }
      if (hasStrongWind) {
        return "weather-windy";
      }
      if (clouds > T.clouds.cloudy) {
        return "weather-cloudy";
      }
      if (clouds > T.clouds.partly) {
        return isDay ? "weather-partly-cloudy" : "weather-night-partly-cloudy";
      }
      if (!isDay) {
        return "weather-night";
      }
      return "weather-sunny";
    };
    const selectIcebear = () => {
      const daySuffix = isDay ? "day" : "night";
      if (hasDangerousWind) {
        return "dangerous-wind";
      }
      if (isThunder) {
        return "thunderstorm";
      }
      if (isHail) {
        return "hail";
      }
      if (isSnow) {
        return "snow";
      }
      if (isSleet) {
        return "sleet";
      }
      if (!cond && prob != null && prob >= T.precip.possibleMinPct && prob < T.precip.possibleMaxPct) {
        return `possible-rain-${daySuffix}`;
      }
      if (isFogLike) {
        return "fog";
      }
      if (isSmoke) {
        return "smoke";
      }
      if (isRain) {
        return "rain";
      }
      if (isDrizzle) {
        return "drizzle";
      }
      if (hasStrongWind) {
        return "wind";
      }
      if (clouds > T.clouds.cloudy) {
        return "cloudy";
      }
      if (hasBreezyWind) {
        return "breezy";
      }
      if (clouds > T.clouds.partly) {
        return `partly-cloudy-${daySuffix}`;
      }
      return isDay ? "clear-day" : "clear-night";
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
        case "precipitation_probability_6h":
        case "apparent_temperature": {
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
            if (k === "apparent_temperature") {
              const min = Math.min(...values.filter((v) => v !== null));
              const max = Math.max(...values.filter((v) => v !== null));
              result.apparent_temperature_min = min !== Infinity ? Math.round(min * 10) / 10 : null;
              result.apparent_temperature_max = max !== -Infinity ? Math.round(max * 10) / 10 : null;
              result.apparent_temperature_median = median !== null ? Math.round(median * 10) / 10 : null;
              result.apparent_temperature = avg;
            } else {
              result[`${k}_median`] = median;
              result[k] = avg;
            }
          } else {
            if (k === "apparent_temperature") {
              result.apparent_temperature_min = null;
              result.apparent_temperature_max = null;
              result.apparent_temperature_median = null;
              result.apparent_temperature = null;
            } else {
              result[k] = null;
              result[`${k}_median`] = null;
            }
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
          const iconsAgg = this.pickDailyWeatherIcon({
            condition: weatherValues.condition,
            wind_speed: weatherValues.wind_speed,
            cloud_cover: weatherValues.cloud_cover,
            day: weatherValues.day
          });
          result.icon_special = iconsAgg.mdi;
          result.iconUrl = iconsAgg.url;
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
   * Estimates generated electrical energy (Wh) for the upcoming hour
   * Samples four 15-minute intervals to calculate average hourly production
   *
   * @param valueWhPerM2 GHI for the hour (Wh/m²) on horizontal plane
   * @param time Timestamp for this hour (Date | number | string)
   * @param coords Coordinates { lat, lon }
   * @param panels Array of panels (azimuth, tilt, area, efficiency in %)
   * @returns Wh (electrical) for all panels combined
   */
  estimatePVEnergyForHour(valueWhPerM2, time, coords, panels) {
    let quarterHoursValueSum = 0;
    for (let i = 0; i < 4; i++) {
      const quarterHourTime = time instanceof Date ? new Date(time.getTime() + i * 15 * 6e4) : typeof time === "number" ? new Date(time + i * 15 * 6e4) : new Date(new Date(time).getTime() + i * 15 * 6e4);
      quarterHoursValueSum += this.estimatePvEnergy(valueWhPerM2, quarterHourTime, coords, panels, this.wrArray);
    }
    return quarterHoursValueSum / 4;
  }
  /**
   * Calculates photovoltaic energy production for a specific time
   * Uses sun position, panel orientation, and inverter limits to estimate output
   *
   * @param valueWhPerM2 Global Horizontal Irradiance (Wh/m²)
   * @param time Timestamp for calculation
   * @param coords Geographic coordinates { lat, lon }
   * @param panels Array of solar panel configurations
   * @param wrArray Array of inverter power limits (Wh)
   * @returns Estimated electrical energy production (Wh)
   */
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
  /**
   * Wrapper for fetch with automatic 30-second timeout and abort controller
   * Ensures API requests don't hang indefinitely
   *
   * @param url URL to fetch
   * @param init Optional fetch initialization options
   * @returns Promise resolving to Response object
   * @throws Error if request fails or times out
   */
  async fetch(url, init) {
    var _a;
    this.controller = new AbortController();
    const currentController = this.controller;
    this.timeoutId = this.setTimeout(() => {
      if (this.controller === currentController && this.controller) {
        this.controller.abort();
        this.controller = null;
      }
    }, 3e4);
    try {
      const response = await fetch(url, {
        ...init,
        method: (_a = init == null ? void 0 : init.method) != null ? _a : "GET",
        signal: this.controller.signal
      });
      this.clearTimeout(this.timeoutId);
      this.timeoutId = void 0;
      this.controller = null;
      return response;
    } catch (error) {
      this.clearTimeout(this.timeoutId);
      this.timeoutId = void 0;
      this.controller = null;
      throw error;
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new Brightsky(options);
} else {
  (() => new Brightsky())();
}
//# sourceMappingURL=main.js.map
