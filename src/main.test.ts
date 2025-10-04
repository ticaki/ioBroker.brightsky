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
