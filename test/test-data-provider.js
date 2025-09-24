/**
 * Test data provider for offline testing
 * Provides pre-fetched weather data to avoid real API calls during tests
 */

const fs = require('fs');
const path = require('path');

class TestDataProvider {
    constructor() {
        this.currentWeatherData = null;
        this.hourlyWeatherData = null;
        this.dailyWeatherData = null;
        this.loadTestData();
    }

    loadTestData() {
        try {
            // Load pre-fetched test data
            this.currentWeatherData = JSON.parse(
                fs.readFileSync(path.join(__dirname, 'data', 'current_weather.json'), 'utf8')
            );
            this.hourlyWeatherData = JSON.parse(
                fs.readFileSync(path.join(__dirname, 'data', 'hourly_weather.json'), 'utf8')
            );
            this.dailyWeatherData = JSON.parse(
                fs.readFileSync(path.join(__dirname, 'data', 'daily_weather.json'), 'utf8')
            );
            console.log('✅ Test data loaded successfully');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('❌ Error loading test data:', err.message);
            throw err;
        }
    }

    /**
     * Get current weather data for testing
     */
    getCurrentWeather() {
        return this.currentWeatherData;
    }

    /**
     * Get hourly weather data for testing
     */
    getHourlyWeather() {
        return this.hourlyWeatherData;
    }

    /**
     * Get daily weather data for testing
     */
    getDailyWeather() {
        return this.dailyWeatherData;
    }

    /**
    * Mock response for different API endpoints
    * @param {string} url - The API URL to mock
    * @returns {Object} Mocked response
    */
    mockAxiosResponse(url) {
        if (url.includes('current_weather')) {
            return {
                data: this.getCurrentWeather(),
                status: 200,
                statusText: 'OK'
            };
        } else if (url.includes('weather')) {
            // For hourly/daily weather, return appropriate data based on date range
            if (url.includes('last_date')) {
                const dailyData = this.getDailyWeather();
                const hourlyData = this.getHourlyWeather();
                
                // If the date range spans multiple days, return daily data
                // Otherwise return hourly data
                const startDateMatch = url.match(/date=([^&]+)/);
                const endDateMatch = url.match(/last_date=([^&]+)/);
                
                if (startDateMatch && endDateMatch) {
                    const startDate = new Date(decodeURIComponent(startDateMatch[1]));
                    const endDate = new Date(decodeURIComponent(endDateMatch[1]));
                    const timeDiff = endDate.getTime() - startDate.getTime();
                    const daysDiff = timeDiff / (1000 * 3600 * 24);
                    
                    // If more than 2 days, return daily data, otherwise hourly
                    return {
                        data: daysDiff > 2 ? dailyData : hourlyData,
                        status: 200,
                        statusText: 'OK'
                    };
                }
            }
            
            return {
                data: this.getHourlyWeather(),
                status: 200,
                statusText: 'OK'
            };
        }
        
        throw new Error(`Unknown API endpoint: ${url}`);
    }

    // axios-Mock is no longer needed
}

module.exports = { TestDataProvider };