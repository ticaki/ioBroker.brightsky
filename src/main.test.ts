/**
 * This is a dummy TypeScript test file using chai and mocha
 *
 * It's automatically excluded from npm and its build output is excluded from both git and npm.
 * It is advised to test all your modules with accompanying *.test.ts-files
 */

import { expect } from 'chai';

describe('Day/Night Data Calculation', () => {
    // Test data to simulate hourly weather data
    const testHourlyData = {
        timestamp: [
            '2023-12-01T06:00:00Z', // Night
            '2023-12-01T09:00:00Z', // Day
            '2023-12-01T12:00:00Z', // Day
            '2023-12-01T15:00:00Z', // Day
            '2023-12-01T18:00:00Z', // Night
            '2023-12-01T21:00:00Z', // Night
        ],
        temperature: [2, 8, 15, 12, 7, 3],
        cloud_cover: [80, 40, 20, 30, 60, 85],
        precipitation: [0.1, 0, 0, 0, 0.5, 0.2],
    };

    // Mock sunrise/sunset for December 1st (approximate)
    const sunrise = new Date('2023-12-01T07:30:00Z');
    const sunset = new Date('2023-12-01T16:30:00Z');

    it('should separate hourly data into day and night periods correctly', () => {
        // Create a simple function to test our logic
        const separateDayNight = (
            hourlyData: any,
            sunriseTime: Date,
            sunsetTime: Date,
        ): { dayData: any; nightData: any } => {
            const dayData: any = {};
            const nightData: any = {};

            // Initialize arrays
            for (const key of Object.keys(hourlyData)) {
                dayData[key] = [];
                nightData[key] = [];
            }

            // Separate data
            const timestamps = hourlyData.timestamp;
            for (let i = 0; i < timestamps.length; i++) {
                const hourTime = new Date(timestamps[i]);
                const isDayTime = hourTime >= sunriseTime && hourTime <= sunsetTime;

                for (const key of Object.keys(hourlyData)) {
                    if (isDayTime) {
                        dayData[key].push(hourlyData[key][i]);
                    } else {
                        nightData[key].push(hourlyData[key][i]);
                    }
                }
            }

            return { dayData, nightData };
        };

        const { dayData, nightData } = separateDayNight(testHourlyData, sunrise, sunset);

        // Verify day data (should be entries at 09:00, 12:00, 15:00)
        expect(dayData.timestamp).to.have.length(3);
        expect(dayData.temperature).to.deep.equal([8, 15, 12]);
        expect(dayData.cloud_cover).to.deep.equal([40, 20, 30]);
        expect(dayData.precipitation).to.deep.equal([0, 0, 0]);

        // Verify night data (should be entries at 06:00, 18:00, 21:00)
        expect(nightData.timestamp).to.have.length(3);
        expect(nightData.temperature).to.deep.equal([2, 7, 3]);
        expect(nightData.cloud_cover).to.deep.equal([80, 60, 85]);
        expect(nightData.precipitation).to.deep.equal([0.1, 0.5, 0.2]);
    });

    it('should calculate correct aggregated values for day period', () => {
        const dayValues = [8, 15, 12]; // Temperature values during day

        // Test min/max calculation
        const min = Math.min(...dayValues);
        const max = Math.max(...dayValues);

        expect(min).to.equal(8);
        expect(max).to.equal(15);

        // Test average calculation
        const avg = dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length;
        expect(Math.round(avg * 10) / 10).to.equal(11.7);
    });

    it('should calculate correct aggregated values for night period', () => {
        const nightValues = [2, 7, 3]; // Temperature values during night

        // Test min/max calculation
        const min = Math.min(...nightValues);
        const max = Math.max(...nightValues);

        expect(min).to.equal(2);
        expect(max).to.equal(7);

        // Test average calculation
        const avg = nightValues.reduce((sum, val) => sum + val, 0) / nightValues.length;
        expect(Math.round(avg * 10) / 10).to.equal(4.0);
    });
});

describe('Weekday Name Formatting', () => {
    it('should format weekday names in different locales', () => {
        const testDate = new Date('2023-12-01T12:00:00Z'); // Friday, December 1, 2023

        // Test English locale
        const shortEn = testDate.toLocaleString('en', { weekday: 'short' });
        const longEn = testDate.toLocaleString('en', { weekday: 'long' });
        expect(shortEn).to.equal('Fri');
        expect(longEn).to.equal('Friday');

        // Test German locale
        const shortDe = testDate.toLocaleString('de', { weekday: 'short' });
        const longDe = testDate.toLocaleString('de', { weekday: 'long' });
        expect(shortDe).to.equal('Fr');
        expect(longDe).to.equal('Freitag');
    });

    it('should handle different days of the week', () => {
        const monday = new Date('2023-12-04T12:00:00Z');
        const wednesday = new Date('2023-12-06T12:00:00Z');
        const sunday = new Date('2023-12-03T12:00:00Z');

        expect(monday.toLocaleString('en', { weekday: 'short' })).to.equal('Mon');
        expect(wednesday.toLocaleString('en', { weekday: 'short' })).to.equal('Wed');
        expect(sunday.toLocaleString('en', { weekday: 'short' })).to.equal('Sun');
    });
});

describe('Radar Precipitation Unit Conversion', () => {
    it('should correctly convert API values from 0.01mm to mm', () => {
        // Simulate API data: values like 16, 19, 21 represent 0.16mm, 0.19mm, 0.21mm
        const apiValues = [16, 19, 21, 100, 0];
        const expectedMm = [0.16, 0.19, 0.21, 1.0, 0];

        for (let i = 0; i < apiValues.length; i++) {
            const converted = apiValues[i] / 100;
            expect(converted).to.equal(expectedMm[i]);
        }
    });

    it('should calculate cumulative precipitation sum correctly', () => {
        // Simulate a 2D grid of precipitation values (in 0.01mm)
        // Each column represents a specific geographical area
        const precipitationGrid = [
            [20, 10], // Row 1: Column 0 gets 0.20mm, Column 1 gets 0.10mm
            [10, 40], // Row 2: Column 0 gets 0.10mm, Column 1 gets 0.40mm
            [5, 5], // Row 3: Column 0 gets 0.05mm, Column 1 gets 0.05mm
        ];

        // Convert to mm and calculate sum for each column
        const numCols = 2;
        const columnSums: number[] = [0, 0];

        for (const row of precipitationGrid) {
            for (let col = 0; col < numCols; col++) {
                columnSums[col] += row[col] / 100; // Convert from 0.01mm to mm
            }
        }

        // Round to 2 decimal places to avoid floating point issues
        const roundedSums = columnSums.map(sum => Math.round(sum * 100) / 100);

        // Column 0 sum: 0.20 + 0.10 + 0.05 = 0.35mm
        // Column 1 sum: 0.10 + 0.40 + 0.05 = 0.55mm
        // Maximum sum across all columns should be 0.55
        const maxSum = Math.max(...roundedSums);

        expect(roundedSums).to.deep.equal([0.35, 0.55]);
        expect(maxSum).to.equal(0.55);
    });

    it('should calculate cumulative sum across multiple time intervals', () => {
        // Simulate 2 time intervals (for a 10-minute forecast)
        const interval1 = [
            [10, 20], // Column 0: 0.10mm, Column 1: 0.20mm
            [5, 15], // Column 0: 0.05mm, Column 1: 0.15mm
        ];
        const interval2 = [
            [15, 10], // Column 0: 0.15mm, Column 1: 0.10mm
            [10, 20], // Column 0: 0.10mm, Column 1: 0.20mm
        ];

        const numCols = 2;
        const columnSums: number[] = [0, 0];

        // Process both intervals
        for (const interval of [interval1, interval2]) {
            for (const row of interval) {
                for (let col = 0; col < numCols; col++) {
                    columnSums[col] += row[col] / 100; // Convert from 0.01mm to mm
                }
            }
        }

        // Round to 2 decimal places
        const roundedSums = columnSums.map(sum => Math.round(sum * 100) / 100);

        // Column 0: (0.10 + 0.05) + (0.15 + 0.10) = 0.15 + 0.25 = 0.40mm
        // Column 1: (0.20 + 0.15) + (0.10 + 0.20) = 0.35 + 0.30 = 0.65mm
        // Maximum: 0.65mm
        const maxSum = Math.max(...roundedSums);

        expect(roundedSums).to.deep.equal([0.4, 0.65]);
        expect(maxSum).to.equal(0.65);
    });

    it('should round values to 2 decimal places', () => {
        const value = 0.123456;
        const rounded = Math.round(value * 100) / 100;

        expect(rounded).to.equal(0.12);
    });
});

describe('Beaufort Wind Scale Conversion', () => {
    // Helper function to simulate the Beaufort scale conversion
    const getBeaufortScale = (windSpeed: number | undefined | null): number => {
        if (windSpeed === undefined || windSpeed === null) {
            return 0;
        }
        // Beaufort scale thresholds in km/h
        if (windSpeed < 1) {
            return 0; // Calm
        }
        if (windSpeed < 6) {
            return 1; // Light air
        }
        if (windSpeed < 12) {
            return 2; // Light breeze
        }
        if (windSpeed < 20) {
            return 3; // Gentle breeze
        }
        if (windSpeed < 29) {
            return 4; // Moderate breeze
        }
        if (windSpeed < 39) {
            return 5; // Fresh breeze
        }
        if (windSpeed < 50) {
            return 6; // Strong breeze
        }
        if (windSpeed < 62) {
            return 7; // Near gale
        }
        if (windSpeed < 75) {
            return 8; // Gale
        }
        if (windSpeed < 89) {
            return 9; // Strong gale
        }
        if (windSpeed < 103) {
            return 10; // Storm
        }
        if (windSpeed < 118) {
            return 11; // Violent storm
        }
        return 12; // Hurricane
    };

    it('should return 0 for calm conditions (< 1 km/h)', () => {
        expect(getBeaufortScale(0)).to.equal(0);
        expect(getBeaufortScale(0.5)).to.equal(0);
    });

    it('should return correct Beaufort scale for light wind speeds', () => {
        expect(getBeaufortScale(1)).to.equal(1); // Light air
        expect(getBeaufortScale(5)).to.equal(1);
        expect(getBeaufortScale(6)).to.equal(2); // Light breeze
        expect(getBeaufortScale(11)).to.equal(2);
        expect(getBeaufortScale(12)).to.equal(3); // Gentle breeze
        expect(getBeaufortScale(19)).to.equal(3);
    });

    it('should return correct Beaufort scale for moderate wind speeds', () => {
        expect(getBeaufortScale(20)).to.equal(4); // Moderate breeze
        expect(getBeaufortScale(28)).to.equal(4);
        expect(getBeaufortScale(29)).to.equal(5); // Fresh breeze
        expect(getBeaufortScale(38)).to.equal(5);
        expect(getBeaufortScale(39)).to.equal(6); // Strong breeze
        expect(getBeaufortScale(49)).to.equal(6);
    });

    it('should return correct Beaufort scale for strong wind speeds', () => {
        expect(getBeaufortScale(50)).to.equal(7); // Near gale
        expect(getBeaufortScale(61)).to.equal(7);
        expect(getBeaufortScale(62)).to.equal(8); // Gale
        expect(getBeaufortScale(74)).to.equal(8);
        expect(getBeaufortScale(75)).to.equal(9); // Strong gale
        expect(getBeaufortScale(88)).to.equal(9);
    });

    it('should return correct Beaufort scale for storm conditions', () => {
        expect(getBeaufortScale(89)).to.equal(10); // Storm
        expect(getBeaufortScale(102)).to.equal(10);
        expect(getBeaufortScale(103)).to.equal(11); // Violent storm
        expect(getBeaufortScale(117)).to.equal(11);
        expect(getBeaufortScale(118)).to.equal(12); // Hurricane
        expect(getBeaufortScale(150)).to.equal(12);
    });

    it('should handle edge cases (null, undefined)', () => {
        expect(getBeaufortScale(null)).to.equal(0);
        expect(getBeaufortScale(undefined)).to.equal(0);
    });

    it('should validate thresholds match DWD wind warning scale', () => {
        // Based on https://www.wettergefahren.de/warnungen/windwarnskala.html
        // Beaufort 6 (Strong breeze): 39-49 km/h
        expect(getBeaufortScale(39)).to.equal(6);
        expect(getBeaufortScale(49)).to.equal(6);

        // Beaufort 7 (Near gale): 50-61 km/h
        expect(getBeaufortScale(50)).to.equal(7);
        expect(getBeaufortScale(61)).to.equal(7);

        // Beaufort 8 (Gale): 62-74 km/h
        expect(getBeaufortScale(62)).to.equal(8);
        expect(getBeaufortScale(74)).to.equal(8);

        // Beaufort 12 (Hurricane): >= 118 km/h
        expect(getBeaufortScale(118)).to.equal(12);
    });
});

describe('Apparent Temperature Calculation', () => {
    // Mock implementation of calculateApparentTemperature for testing
    const calculateApparentTemperature = (
        temperature: number | null | undefined,
        windSpeed: number | null | undefined,
        humidity: number | null | undefined,
    ): number | null => {
        if (temperature === null || temperature === undefined) {
            return null;
        }

        // Windchill calculation for cold conditions
        if (temperature < 10 && windSpeed !== null && windSpeed !== undefined && windSpeed > 4.8 && windSpeed < 177) {
            const windchill =
                13.12 +
                0.6215 * temperature -
                11.37 * Math.pow(windSpeed, 0.16) +
                0.3965 * temperature * Math.pow(windSpeed, 0.16);
            return Math.round(windchill * 10) / 10;
        }

        // Heat index calculation for hot conditions
        if (temperature > 26.7 && humidity !== null && humidity !== undefined && humidity > 40) {
            // Limit humidity to valid range
            const h = Math.max(0, Math.min(100, humidity));
            const t = temperature;

            const heatIndex =
                -8.784695 +
                1.61139411 * t +
                2.338549 * h -
                0.14611605 * t * h -
                0.012308094 * (t * t) -
                0.016424828 * (h * h) +
                0.002211732 * (t * t) * h +
                0.00072546 * t * (h * h) -
                0.000003582 * (t * t) * (h * h);
            return Math.round(heatIndex * 10) / 10;
        }

        // For moderate conditions, apparent temperature equals actual temperature
        return Math.round(temperature * 10) / 10;
    };

    it('should return null for null or undefined temperature', () => {
        expect(calculateApparentTemperature(null, 10, 50)).to.equal(null);
        expect(calculateApparentTemperature(undefined, 10, 50)).to.equal(null);
    });

    it('should calculate windchill for cold temperatures with wind', () => {
        // Temperature 5°C, wind speed 20 km/h
        const result = calculateApparentTemperature(5, 20, 50);
        expect(result).to.be.a('number');
        expect(result!).to.be.lessThan(5); // Windchill should feel colder
    });

    it('should not calculate windchill for temperature >= 10°C', () => {
        // Temperature 10°C, wind speed 20 km/h -> should return actual temp
        const result = calculateApparentTemperature(10, 20, 50);
        expect(result).to.equal(10.0);

        // Temperature 15°C, wind speed 20 km/h -> should return actual temp
        const result2 = calculateApparentTemperature(15, 20, 50);
        expect(result2).to.equal(15.0);
    });

    it('should not calculate windchill for wind speed < 4.8 km/h', () => {
        // Temperature 5°C, wind speed 4 km/h (too low)
        const result = calculateApparentTemperature(5, 4, 50);
        expect(result).to.equal(5.0);
    });

    it('should not calculate windchill for wind speed >= 177 km/h', () => {
        // Temperature 5°C, wind speed 180 km/h (too high)
        const result = calculateApparentTemperature(5, 180, 50);
        expect(result).to.equal(5.0);
    });

    it('should calculate heat index for hot temperatures with high humidity', () => {
        // Temperature 30°C, humidity 60%
        const result = calculateApparentTemperature(30, 10, 60);
        expect(result).to.be.a('number');
        expect(result!).to.be.greaterThan(30); // Heat index should feel hotter
    });

    it('should not calculate heat index for temperature <= 26.7°C', () => {
        // Temperature 26°C, humidity 60% -> should return actual temp
        const result = calculateApparentTemperature(26, 10, 60);
        expect(result).to.equal(26.0);

        // Temperature 20°C, humidity 60% -> should return actual temp
        const result2 = calculateApparentTemperature(20, 10, 60);
        expect(result2).to.equal(20.0);
    });

    it('should not calculate heat index for humidity <= 40%', () => {
        // Temperature 30°C, humidity 40% (too low)
        const result = calculateApparentTemperature(30, 10, 40);
        expect(result).to.equal(30.0);

        // Temperature 30°C, humidity 35%
        const result2 = calculateApparentTemperature(30, 10, 35);
        expect(result2).to.equal(30.0);
    });

    it('should return actual temperature for moderate conditions', () => {
        // Temperature 15°C, wind speed 5 km/h, humidity 50%
        const result = calculateApparentTemperature(15, 5, 50);
        expect(result).to.equal(15.0);

        // Temperature 20°C, no wind, moderate humidity
        const result2 = calculateApparentTemperature(20, 0, 55);
        expect(result2).to.equal(20.0);
    });

    it('should round to 1 decimal place', () => {
        // Test with various temperatures that should return the actual temp
        const result1 = calculateApparentTemperature(12.345, 3, 50);
        expect(result1).to.equal(12.3);

        const result2 = calculateApparentTemperature(23.789, 2, 30);
        expect(result2).to.equal(23.8);
    });

    it('should handle edge cases with null wind or humidity', () => {
        // Temperature with null wind speed -> should return actual temp
        const result1 = calculateApparentTemperature(15, null, 50);
        expect(result1).to.equal(15.0);

        // Temperature with null humidity -> should return actual temp
        const result2 = calculateApparentTemperature(15, 10, null);
        expect(result2).to.equal(15.0);
    });
});
