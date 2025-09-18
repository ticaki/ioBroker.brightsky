/**
 * Integration test for BrightSky weather data fetching with German coordinates
 * Tests current, daily, and hourly weather data retrieval from the Bright Sky API
 */

import { expect } from 'chai';
import axios from 'axios';

// Use Berlin coordinates (Germany) for testing
const GERMAN_TEST_COORDINATES = { lat: 52.520008, lon: 13.404954 };
const MAX_DISTANCE = 50000;

describe('BrightSky Weather Data Integration Tests', function () {
    // Increase timeout for API calls
    this.timeout(30000);

    it('should successfully fetch current weather data for German coordinates', async function () {
        // Test current weather API endpoint directly
        const currentUrl = `https://api.brightsky.dev/current_weather?lat=${GERMAN_TEST_COORDINATES.lat}&lon=${GERMAN_TEST_COORDINATES.lon}&max_dist=${MAX_DISTANCE}`;

        const response = await axios.get(currentUrl);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('weather');
        expect(response.data).to.have.property('sources');

        const weather = response.data.weather;
        expect(weather).to.have.property('temperature');
        expect(weather).to.have.property('cloud_cover');
        expect(weather).to.have.property('condition');
        expect(weather).to.have.property('timestamp');

        // Verify we got valid German weather data
        expect(weather.temperature).to.be.a('number');
        expect(weather.cloud_cover).to.be.a('number').and.to.be.within(0, 100);

        // Log some data to verify test is working
        console.log(`Current weather in Berlin: ${weather.temperature}°C, ${weather.condition}`);
    });

    it('should successfully fetch hourly weather data for German coordinates', async function () {
        const startTime = new Date(new Date().setMinutes(0, 0, 0)).toISOString();
        const endTime = new Date(new Date().setHours(new Date().getHours() + 24, 0, 0, 0)).toISOString();

        const hourlyUrl = `https://api.brightsky.dev/weather?lat=${GERMAN_TEST_COORDINATES.lat}&lon=${GERMAN_TEST_COORDINATES.lon}&max_dist=${MAX_DISTANCE}&date=${startTime}&last_date=${endTime}`;

        const response = await axios.get(hourlyUrl);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('weather');
        expect(response.data).to.have.property('sources');

        const weather = response.data.weather;
        expect(weather).to.be.an('array');
        expect(weather.length).to.be.greaterThan(0);

        // Check first hourly entry
        const firstHour = weather[0];
        expect(firstHour).to.have.property('temperature');
        expect(firstHour).to.have.property('timestamp');
        expect(firstHour).to.have.property('cloud_cover');

        console.log(`Fetched ${weather.length} hourly weather entries for Berlin`);
    });

    it('should successfully fetch daily weather data for German coordinates', async function () {
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const dailyUrl = `https://api.brightsky.dev/weather?lat=${GERMAN_TEST_COORDINATES.lat}&lon=${GERMAN_TEST_COORDINATES.lon}&max_dist=${MAX_DISTANCE}&date=${startDate}&last_date=${endDate}`;

        const response = await axios.get(dailyUrl);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('weather');

        const weather = response.data.weather;
        expect(weather).to.be.an('array');
        expect(weather.length).to.be.greaterThan(0);

        console.log(`Fetched ${weather.length} weather entries for 7-day forecast for Berlin`);
    });

    it('should validate weather data structure for current weather', async function () {
        const currentUrl = `https://api.brightsky.dev/current_weather?lat=${GERMAN_TEST_COORDINATES.lat}&lon=${GERMAN_TEST_COORDINATES.lon}&max_dist=${MAX_DISTANCE}`;

        const response = await axios.get(currentUrl);
        const weather = response.data.weather;

        // Validate required weather properties
        expect(weather).to.have.property('source_id');
        expect(weather).to.have.property('timestamp');
        expect(weather).to.have.property('cloud_cover');
        expect(weather).to.have.property('condition');
        expect(weather).to.have.property('temperature');
        expect(weather).to.have.property('relative_humidity');
        expect(weather).to.have.property('precipitation_10');
        expect(weather).to.have.property('precipitation_30');
        expect(weather).to.have.property('precipitation_60');
        expect(weather).to.have.property('wind_direction_10');
        expect(weather).to.have.property('wind_speed_10');

        // Validate data types and ranges
        if (weather.temperature !== null) {
            expect(weather.temperature).to.be.a('number').and.to.be.within(-50, 50);
        }
        if (weather.cloud_cover !== null) {
            expect(weather.cloud_cover).to.be.a('number').and.to.be.within(0, 100);
        }
        if (weather.relative_humidity !== null) {
            expect(weather.relative_humidity).to.be.a('number').and.to.be.within(0, 100);
        }
    });

    it('should validate weather data structure for hourly weather', async function () {
        const startTime = new Date(new Date().setMinutes(0, 0, 0)).toISOString();
        const endTime = new Date(new Date().setHours(new Date().getHours() + 6, 0, 0, 0)).toISOString();

        const hourlyUrl = `https://api.brightsky.dev/weather?lat=${GERMAN_TEST_COORDINATES.lat}&lon=${GERMAN_TEST_COORDINATES.lon}&max_dist=${MAX_DISTANCE}&date=${startTime}&last_date=${endTime}`;

        const response = await axios.get(hourlyUrl);
        const weather = response.data.weather;

        // Check structure of hourly data
        expect(weather).to.be.an('array');
        const firstEntry = weather[0];

        expect(firstEntry).to.have.property('timestamp');
        expect(firstEntry).to.have.property('source_id');
        expect(firstEntry).to.have.property('temperature');
        expect(firstEntry).to.have.property('precipitation');
        expect(firstEntry).to.have.property('wind_speed');
        expect(firstEntry).to.have.property('wind_direction');
        expect(firstEntry).to.have.property('cloud_cover');
        expect(firstEntry).to.have.property('visibility');

        // Validate timestamps are in correct order
        for (let i = 1; i < Math.min(weather.length, 5); i++) {
            const prev = new Date(weather[i - 1].timestamp);
            const curr = new Date(weather[i].timestamp);
            expect(curr.getTime()).to.be.greaterThan(prev.getTime());
        }
    });

    it('should handle German coordinates validation correctly', async function () {
        // Test with valid German coordinates (Berlin)
        const berlinCoords = '52.520008,13.404954';
        const isValid = berlinCoords.split(',').every(coord => !isNaN(parseFloat(coord)));
        expect(isValid).to.be.true;

        // Test with invalid coordinates
        const invalidCoords = 'invalid,coords';
        const isInvalid = invalidCoords.split(',').every(coord => !isNaN(parseFloat(coord)));
        expect(isInvalid).to.be.false;

        // Test coordinates are within Germany bounds (roughly)
        const [lat, lon] = berlinCoords.split(',').map(parseFloat);
        expect(lat).to.be.within(47, 56); // Germany latitude range
        expect(lon).to.be.within(5, 16); // Germany longitude range
    });

    it('should verify sources data is included in API responses', async function () {
        const currentUrl = `https://api.brightsky.dev/current_weather?lat=${GERMAN_TEST_COORDINATES.lat}&lon=${GERMAN_TEST_COORDINATES.lon}&max_dist=${MAX_DISTANCE}`;

        const response = await axios.get(currentUrl);

        expect(response.data).to.have.property('sources');
        expect(response.data.sources).to.be.an('array');
        expect(response.data.sources.length).to.be.greaterThan(0);

        const firstSource = response.data.sources[0];
        expect(firstSource).to.have.property('id');
        expect(firstSource).to.have.property('dwd_station_id');
        expect(firstSource).to.have.property('station_name');
        expect(firstSource).to.have.property('lat');
        expect(firstSource).to.have.property('lon');
        expect(firstSource).to.have.property('height');

        console.log(`Using weather station: ${firstSource.station_name} (ID: ${firstSource.dwd_station_id})`);
    });

    it('should complete comprehensive weather data retrieval for German coordinates', async function () {
        // This test simulates what the adapter would do: fetch all three data types

        const currentUrl = `https://api.brightsky.dev/current_weather?lat=${GERMAN_TEST_COORDINATES.lat}&lon=${GERMAN_TEST_COORDINATES.lon}&max_dist=${MAX_DISTANCE}`;

        const startTime = new Date(new Date().setMinutes(0, 0, 0)).toISOString();
        const endTime = new Date(new Date().setHours(new Date().getHours() + 24, 0, 0, 0)).toISOString();
        const hourlyUrl = `https://api.brightsky.dev/weather?lat=${GERMAN_TEST_COORDINATES.lat}&lon=${GERMAN_TEST_COORDINATES.lon}&max_dist=${MAX_DISTANCE}&date=${startTime}&last_date=${endTime}`;

        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const dailyUrl = `https://api.brightsky.dev/weather?lat=${GERMAN_TEST_COORDINATES.lat}&lon=${GERMAN_TEST_COORDINATES.lon}&max_dist=${MAX_DISTANCE}&date=${startDate}&last_date=${endDate}`;

        // Fetch all three types of data simultaneously
        const [currentResponse, hourlyResponse, dailyResponse] = await Promise.all([
            axios.get(currentUrl),
            axios.get(hourlyUrl),
            axios.get(dailyUrl),
        ]);

        // Verify all requests succeeded
        expect(currentResponse.status).to.equal(200);
        expect(hourlyResponse.status).to.equal(200);
        expect(dailyResponse.status).to.equal(200);

        // Verify data structure
        expect(currentResponse.data.weather).to.exist;
        expect(hourlyResponse.data.weather).to.be.an('array').with.length.greaterThan(0);
        expect(dailyResponse.data.weather).to.be.an('array').with.length.greaterThan(0);

        // Verify we can extract temperature data from all sources
        const currentTemp = currentResponse.data.weather.temperature;
        const firstHourlyTemp = hourlyResponse.data.weather[0].temperature;
        const firstDailyTemp = dailyResponse.data.weather[0].temperature;

        if (currentTemp !== null) {
            expect(currentTemp).to.be.a('number');
        }
        if (firstHourlyTemp !== null) {
            expect(firstHourlyTemp).to.be.a('number');
        }
        if (firstDailyTemp !== null) {
            expect(firstDailyTemp).to.be.a('number');
        }

        console.log(`Successfully fetched comprehensive weather data:`);
        console.log(`- Current: ${currentTemp}°C`);
        console.log(`- Hourly entries: ${hourlyResponse.data.weather.length}`);
        console.log(`- Daily/extended entries: ${dailyResponse.data.weather.length}`);

        // Verify the data is suitable for the adapter to process
        expect(currentResponse.data.sources).to.be.an('array').with.length.greaterThan(0);
        expect(hourlyResponse.data.sources).to.be.an('array').with.length.greaterThan(0);
        expect(dailyResponse.data.sources).to.be.an('array').with.length.greaterThan(0);
    });
});
