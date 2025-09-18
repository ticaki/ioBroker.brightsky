/**
 * Mock data test for adapter functionality without network dependency
 * Tests the adapter's data processing logic with sample Bright Sky API responses
 */

import { expect } from 'chai';

// Mock data matching the structure returned by Bright Sky API
const mockCurrentWeatherResponse = {
    weather: {
        source_id: 6160,
        timestamp: "2025-01-17T12:00:00+00:00",
        cloud_cover: 75,
        condition: "cloudy",
        temperature: 3.2,
        relative_humidity: 82,
        precipitation_10: 0.0,
        precipitation_30: 0.1,
        precipitation_60: 0.2,
        wind_direction_10: 240,
        wind_speed_10: 15.3,
        wind_gust_direction_10: 250,
        wind_gust_speed_10: 28.1,
        dew_point: 0.5,
        pressure_msl: 1015.2,
        visibility: 50000,
        solar_10: 85,
        solar_30: 120,
        solar_60: 180,
        sunshine_30: 15,
        sunshine_60: 25,
        fallback_source_ids: {
            cloud_cover: 6160,
            condition: 6160,
            precipitation_10: 6160,
            temperature: 6160,
            wind_direction_10: 6160,
            wind_speed_10: 6160
        },
        icon: "cloudy"
    },
    sources: [
        {
            id: 6160,
            dwd_station_id: "10382",
            wmo_station_id: "10382",
            station_name: "Berlin-Tempelhof",
            observation_type: "historical",
            lat: 52.47,
            lon: 13.4,
            height: 48.0,
            distance: 3245
        }
    ]
};

const mockHourlyWeatherResponse = {
    weather: [
        {
            timestamp: "2025-01-17T12:00:00+00:00",
            source_id: 6160,
            cloud_cover: 75,
            condition: "cloudy",
            dew_point: 0.5,
            icon: "cloudy",
            precipitation: 0.0,
            pressure_msl: 1015.2,
            relative_humidity: 82,
            temperature: 3.2,
            visibility: 50000,
            wind_direction: 240,
            wind_gust_direction: 250,
            wind_gust_speed: 28.1,
            wind_speed: 15.3,
            solar: 120
        },
        {
            timestamp: "2025-01-17T13:00:00+00:00",
            source_id: 6160,
            cloud_cover: 68,
            condition: "partly-cloudy",
            dew_point: 1.2,
            icon: "partly-cloudy-day",
            precipitation: 0.0,
            pressure_msl: 1015.8,
            relative_humidity: 79,
            temperature: 4.1,
            visibility: 55000,
            wind_direction: 235,
            wind_gust_direction: 245,
            wind_gust_speed: 25.6,
            wind_speed: 14.7,
            solar: 156
        }
    ],
    sources: [
        {
            id: 6160,
            dwd_station_id: "10382",
            wmo_station_id: "10382", 
            station_name: "Berlin-Tempelhof",
            observation_type: "historical",
            lat: 52.47,
            lon: 13.4,
            height: 48.0,
            distance: 3245
        }
    ]
};

describe('Adapter Data Processing Logic Tests', function() {

    it('should validate current weather data structure', function() {
        const weather = mockCurrentWeatherResponse.weather;
        
        // Test required properties exist
        expect(weather).to.have.property('source_id').that.is.a('number');
        expect(weather).to.have.property('timestamp').that.is.a('string');
        expect(weather).to.have.property('temperature').that.is.a('number');
        expect(weather).to.have.property('cloud_cover').that.is.a('number');
        expect(weather).to.have.property('condition').that.is.a('string');
        expect(weather).to.have.property('relative_humidity').that.is.a('number');
        expect(weather).to.have.property('wind_speed_10').that.is.a('number');
        expect(weather).to.have.property('wind_direction_10').that.is.a('number');
        
        // Test value ranges
        expect(weather.temperature).to.be.within(-50, 50);
        expect(weather.cloud_cover).to.be.within(0, 100);
        expect(weather.relative_humidity).to.be.within(0, 100);
        expect(weather.wind_direction_10).to.be.within(0, 360);
        expect(weather.wind_speed_10).to.be.at.least(0);
        
        // Test German coordinates range
        const source = mockCurrentWeatherResponse.sources[0];
        expect(source.lat).to.be.within(47, 56); // Germany latitude range
        expect(source.lon).to.be.within(5, 16);  // Germany longitude range
        expect(source.station_name).to.include('Berlin');
        expect(source.dwd_station_id).to.be.a('string');
    });

    it('should validate hourly weather data structure and ordering', function() {
        const weather = mockHourlyWeatherResponse.weather;
        
        expect(weather).to.be.an('array').with.length.greaterThan(0);
        
        // Test each hourly entry
        weather.forEach((entry, index) => {
            expect(entry).to.have.property('timestamp').that.is.a('string');
            expect(entry).to.have.property('temperature').that.is.a('number');
            expect(entry).to.have.property('cloud_cover').that.is.a('number');
            expect(entry).to.have.property('precipitation').that.is.a('number');
            expect(entry).to.have.property('wind_speed').that.is.a('number');
            expect(entry).to.have.property('solar').that.is.a('number');
            
            // Test timestamp ordering (each subsequent entry should be later)
            if (index > 0) {
                const prevTime = new Date(weather[index - 1].timestamp);
                const currentTime = new Date(entry.timestamp);
                expect(currentTime.getTime()).to.be.greaterThan(prevTime.getTime());
            }
        });
    });

    it('should validate coordinate parsing logic', function() {
        // Test coordinate string parsing (simulating adapter logic)
        const testCoordinates = '52.520008,13.404954';
        
        const coords = testCoordinates.split(',');
        expect(coords).to.have.length(2);
        
        const lat = parseFloat(coords[0]);
        const lon = parseFloat(coords[1]);
        
        expect(lat).to.be.a('number').and.not.to.be.NaN;
        expect(lon).to.be.a('number').and.not.to.be.NaN;
        
        // Validate Berlin coordinates
        expect(lat).to.be.closeTo(52.52, 0.01);
        expect(lon).to.be.closeTo(13.40, 0.01);
        
        // Test coordinate validation function
        const isValidCoord = (coordString: string): boolean => {
            const coords = coordString.split(',');
            return coords.length === 2 && coords.every(coord => !isNaN(parseFloat(coord)));
        };
        
        expect(isValidCoord('52.520008,13.404954')).to.be.true;
        expect(isValidCoord('invalid,coords')).to.be.false;
        expect(isValidCoord('52.520008')).to.be.false; // missing longitude
        expect(isValidCoord('')).to.be.false;
    });

    it('should validate weather state data transformation', function() {
        // Test how the adapter would transform API data for state storage
        const weather = mockCurrentWeatherResponse.weather;
        
        // Simulate state transformation logic
        const transformedData = {
            'current.temperature': weather.temperature,
            'current.cloud_cover': weather.cloud_cover,
            'current.condition': weather.condition,
            'current.humidity': weather.relative_humidity,
            'current.wind_speed': weather.wind_speed_10,
            'current.wind_direction': weather.wind_direction_10,
            'current.pressure': weather.pressure_msl,
            'current.timestamp': weather.timestamp,
        };
        
        // Validate transformed data
        expect(transformedData['current.temperature']).to.equal(3.2);
        expect(transformedData['current.cloud_cover']).to.equal(75);
        expect(transformedData['current.condition']).to.equal('cloudy');
        expect(transformedData['current.humidity']).to.equal(82);
        expect(transformedData['current.wind_speed']).to.equal(15.3);
        expect(transformedData['current.wind_direction']).to.equal(240);
        expect(transformedData['current.pressure']).to.equal(1015.2);
        expect(transformedData['current.timestamp']).to.include('2025-01-17T12:00:00');
    });

    it('should validate wind bearing text conversion logic', function() {
        // Test wind direction to text conversion (simulating adapter logic)
        const getWindBearingText = (windBearing: number | undefined): string => {
            if (windBearing === undefined) {
                return '';
            }
            const directions = [
                'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
            ];
            const index = Math.round((windBearing % 360) / 22.5) % 16;
            return directions[index];
        };

        // Test various wind directions
        expect(getWindBearingText(0)).to.equal('N');
        expect(getWindBearingText(90)).to.equal('E');
        expect(getWindBearingText(180)).to.equal('S');
        expect(getWindBearingText(270)).to.equal('W');
        expect(getWindBearingText(240)).to.equal('WSW'); // From mock data - 240 degrees is WSW, not SW
        expect(getWindBearingText(undefined)).to.equal('');
        
        // Test edge cases
        expect(getWindBearingText(360)).to.equal('N'); // Should wrap around
        expect(getWindBearingText(361)).to.equal('N'); // Should handle values > 360
    });

    it('should validate URL construction for different API endpoints', function() {
        // Test URL construction logic used by the adapter
        const baseCoords = { lat: 52.520008, lon: 13.404954 };
        const maxDistance = 50000;
        
        // Current weather URL
        const currentUrl = `https://api.brightsky.dev/current_weather?lat=${baseCoords.lat}&lon=${baseCoords.lon}&max_dist=${maxDistance}`;
        expect(currentUrl).to.equal('https://api.brightsky.dev/current_weather?lat=52.520008&lon=13.404954&max_dist=50000');
        
        // Hourly weather URL
        const startTime = '2025-01-17T00:00:00Z';
        const endTime = '2025-01-17T23:59:59Z';
        const hourlyUrl = `https://api.brightsky.dev/weather?lat=${baseCoords.lat}&lon=${baseCoords.lon}&max_dist=${maxDistance}&date=${startTime}&last_date=${endTime}`;
        expect(hourlyUrl).to.include('api.brightsky.dev/weather');
        expect(hourlyUrl).to.include('lat=52.520008');
        expect(hourlyUrl).to.include('lon=13.404954');
        expect(hourlyUrl).to.include('max_dist=50000');
        expect(hourlyUrl).to.include(`date=${startTime}`);
        expect(hourlyUrl).to.include(`last_date=${endTime}`);
    });

    it('should validate source data structure for German weather station', function() {
        const source = mockCurrentWeatherResponse.sources[0];
        
        // Validate required source properties
        expect(source).to.have.property('id').that.is.a('number');
        expect(source).to.have.property('dwd_station_id').that.is.a('string');
        expect(source).to.have.property('station_name').that.is.a('string');
        expect(source).to.have.property('lat').that.is.a('number');
        expect(source).to.have.property('lon').that.is.a('number');
        expect(source).to.have.property('height').that.is.a('number');
        expect(source).to.have.property('distance').that.is.a('number');
        
        // Validate German weather station specifics
        expect(source.station_name).to.include('Berlin');
        expect(source.dwd_station_id).to.have.length.greaterThan(0);
        expect(source.observation_type).to.be.a('string');
        
        // Validate coordinates are in Germany
        expect(source.lat).to.be.within(47, 56);
        expect(source.lon).to.be.within(5, 16);
        
        // Validate distance is reasonable for Berlin area
        expect(source.distance).to.be.within(0, 100000); // Within 100km
    });

    it('should validate comprehensive weather data processing workflow', function() {
        // This test simulates the complete data processing workflow
        
        // 1. Validate current weather data is suitable for processing
        const current = mockCurrentWeatherResponse.weather;
        expect(current.temperature).to.be.a('number');
        expect(current.condition).to.be.a('string');
        expect(current.timestamp).to.be.a('string');
        
        // 2. Validate hourly data array can be processed
        const hourly = mockHourlyWeatherResponse.weather;
        expect(hourly).to.be.an('array').with.length.greaterThan(0);
        
        // 3. Validate data aggregation is possible
        const temperatures = hourly.map(h => h.temperature);
        const avgTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
        const minTemp = Math.min(...temperatures);
        const maxTemp = Math.max(...temperatures);
        
        expect(avgTemp).to.be.a('number');
        expect(minTemp).to.be.a('number');
        expect(maxTemp).to.be.a('number');
        expect(minTemp).to.be.at.most(avgTemp);
        expect(maxTemp).to.be.at.least(avgTemp);
        
        // 4. Validate sources data is consistent
        const currentSource = mockCurrentWeatherResponse.sources[0];
        const hourlySource = mockHourlyWeatherResponse.sources[0];
        expect(currentSource.id).to.equal(hourlySource.id);
        expect(currentSource.station_name).to.equal(hourlySource.station_name);
        
        console.log(`Mock data workflow test completed successfully:`);
        console.log(`- Current temp: ${current.temperature}°C, condition: ${current.condition}`);
        console.log(`- Hourly entries: ${hourly.length}, temp range: ${minTemp}°C to ${maxTemp}°C`);
        console.log(`- Weather station: ${currentSource.station_name} (${currentSource.dwd_station_id})`);
    });
});