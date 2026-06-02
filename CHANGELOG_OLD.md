# Older changes
## 0.6.6 (2025-10-11)
- (ticaki) Added apparent temperature datapoints for current, hourly, and daily weather data

## 0.6.5 (2025-10-04)
- (ticaki) Added leading zero to 5-minute radar datapoint folders for correct sorting in UI

## 0.6.3 (2025-10-04)
- (ticaki) Added Beaufort wind force scale datapoints (wind_force and wind_force_desc) based on wind_speed_10
- (ticaki) Fixed radar precipitation unit conversion - API values are in 0.01mm per 5 minutes, now correctly converted to mm
- (ticaki) Added cumulative precipitation states (next_Xmin_sum) showing maximum precipitation sum across all grid areas
- (ticaki) Added descriptions to max_precipitation_forecast states indicating "mm per 5 minutes"

## 0.6.2 (2025-10-02)
- (ticaki) Flag set to activate language

## 0.6.1 (2025-10-02)
- (ticaki) Added optional createRadarData configuration to make detailed radar.data folder optional fixes [#45](https://github.com/ticaki/ioBroker.brightsky/issues/45)
- (ticaki) Added weekday name datapoints (short and long) to daily weather data fixes [#41](https://github.com/ticaki/ioBroker.brightsky/issues/41)

## 0.6.0 (2025-09-30)
- (ticaki) Added weather radar feature with 2-hour precipitation forecast
- (ticaki) Radar data shows precipitation in mm with average, min, max, and median values
- (ticaki) Configurable radar polling interval (5+ minutes, auto-rotates data every 5 min)
- (ticaki) Added max precipitation forecast states for next 5, 10, 15, 30, 45, 60, 90 minutes

## 0.5.2 (2025-09-28)
- (ticaki) New data point wind_gust_speed_max for role value.speed.max.wind
- (ticaki) role checked

## 0.5.1 (2025-09-27)
- (ticaki) more robust fetch usage

## 0.5.0 (2025-09-26)
- (ticaki) Icons provided by icebear added fixes #31

## 0.4.0 (2025-09-24)
- (ticaki) Code migration from axios to node:fetch

## 0.3.5 (2025-09-20)
- (ticaki) Corrected roles for visualisation (lovelance) fixes #28

## 0.3.4 (2025-09-19)
- (ticaki) fixed too low limit for currently updates

## 0.3.3 (2025-09-19)
- (ticaki) update current at sunrise and sunset (unless custom interval is too large)
- (ticaki) added inverter limiting

## 0.3.2 (2025-09-17)
- (ticaki) Solar estimation calculation revised

## 0.3.1 (2025-09-15)
- (ticaki) Fixed data evaluation crash when no panels are defined  
- (ticaki) state name fixed

## 0.3.0 (2025-09-15)
- (ticaki) Added experimental datapoint for solar energy estimation (daily and hourly)  
- (ticaki) Wind bearing text is now translated into ioBroker system language  
- (ticaki) Added new datapoint for MDI icons support  
- (ticaki) Add day and night objects in addition to daily objects fixes [#11](https://github.com/ticaki/ioBroker.brightsky/issues/11)
- (ticaki) Enhanced day and night support with dedicated day/night icons

## 0.2.4 (2025-08-28)
* (ticaki) Create all folders

## 0.2.3 (2025-08-27)
* (ticaki) wind bearing text added
* (ticaki) update deps

## 0.2.2 (2025-08-22)
* (ticaki) Sunrise and sunset times added to the daily overview.

## 0.2.1 (2025-08-20)
* (ticaki) Startup log entry fixed.

## 0.2.0 (2025-08-20)
* (ticaki) DWD station ID added
* (ticaki) WMO station ID added
* (ticaki) Deactivation of data options added

## 0.1.1 (2025-08-19)
* (ticaki) Reduce required Nodej's version to 20

## 0.1.0 (2025-08-19)
* (ticaki) initial release
