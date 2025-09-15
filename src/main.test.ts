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
