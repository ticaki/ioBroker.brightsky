# Testing System Documentation

This document describes the enhanced testing system implemented for the ioBroker.brightsky adapter.

## Overview

The adapter now includes both online and offline testing capabilities:

1. **Unit Tests** (`src/**/*.test.ts`) - Test individual functions and calculations
2. **Package Tests** (`test/package`) - Validate package.json and io-package.json
3. **Online Integration Tests** (`test/integration-brightsky.js`) - Test with real API calls
4. **Offline Integration Tests** (`test/integration-brightsky-offline.js`) - Test with pre-fetched data

## Test Commands

```bash
# Run all standard tests (unit + package)
npm test

# Run only TypeScript unit tests
npm run test:ts

# Run only package validation tests
npm run test:package

# Run integration tests with real API calls
npm run test:integration

# Run integration tests with offline data (no real API calls)
npm run test:integration:offline
```

## Offline Testing System

### Purpose

The offline testing system was implemented to:
- Avoid making real API calls during testing (as requested in issue #20)
- Speed up test execution
- Provide reliable, consistent test results
- Allow testing without internet connectivity
- Ensure connection state handling works properly

### How It Works

1. **Test Data**: Pre-fetched weather data is stored in `test/data/`:
   - `current_weather.json` - Current weather data
   - `hourly_weather.json` - Hourly forecast data (24 hours)
   - `daily_weather.json` - Daily forecast data (7 days)

2. **Mock System**: The `test/test-setup.js` module intercepts axios imports and provides mock responses using the pre-fetched data.

3. **Test Provider**: `test/test-data-provider.js` manages the offline data and creates mock axios responses.

### Key Improvements

1. **Connection State Fix**: The adapter now properly creates the `brightsky.0.info.connection` state object before using it, fixing the previous error in tests.

2. **Offline Data**: Tests use real weather data that was previously fetched, ensuring realistic testing scenarios.

3. **No API Rate Limits**: Offline tests don't count against API rate limits or require internet connectivity.

## Test Data Management

### Refreshing Test Data

If you need to update the test data with fresh weather information:

```bash
cd test
node -e "
const axios = require('axios');
const fs = require('fs');

const BERLIN_COORDS = '52.520008,13.404954';
const currentTime = new Date();
const startTime = new Date(currentTime).toISOString();
const endTime = new Date(currentTime.getTime() + 24*60*60*1000).toISOString();
const dailyEndTime = new Date(currentTime.getTime() + 7*24*60*60*1000).toISOString();

async function fetchSampleData() {
  try {
    console.log('Fetching sample weather data for offline testing...');
    
    const currentResult = await axios.get(\`https://api.brightsky.dev/current_weather?lat=\${BERLIN_COORDS.split(',')[0]}&lon=\${BERLIN_COORDS.split(',')[1]}&max_dist=50000\`);
    fs.writeFileSync('data/current_weather.json', JSON.stringify(currentResult.data, null, 2));
    
    const hourlyResult = await axios.get(\`https://api.brightsky.dev/weather?lat=\${BERLIN_COORDS.split(',')[0]}&lon=\${BERLIN_COORDS.split(',')[1]}&max_dist=50000&date=\${startTime}&last_date=\${endTime}\`);
    fs.writeFileSync('data/hourly_weather.json', JSON.stringify(hourlyResult.data, null, 2));
    
    const dailyStartTime = new Date(currentTime.setHours(0, 0, 0, 0)).toISOString();
    const dailyResult = await axios.get(\`https://api.brightsky.dev/weather?lat=\${BERLIN_COORDS.split(',')[0]}&lon=\${BERLIN_COORDS.split(',')[1]}&max_dist=50000&date=\${dailyStartTime}&last_date=\${dailyEndTime}\`);
    fs.writeFileSync('data/daily_weather.json', JSON.stringify(dailyResult.data, null, 2));
    
    console.log('All sample data retrieved successfully');
  } catch (error) {
    console.error('Error fetching sample data:', error.message);
  }
}

fetchSampleData();
"
```

## Integration Test Details

### Online Integration Tests

- Use real BrightSky API calls
- Test complete adapter lifecycle with live data  
- Validate connection to actual weather services
- May be slower and depend on network connectivity

### Offline Integration Tests

- Use pre-fetched data stored in `test/data/`
- Mock all axios HTTP requests
- Test adapter processing logic without network calls
- Fast, reliable, and consistent results
- Verify connection state handling

### State Object Creation

Both test types now properly:
1. Create the required `brightsky.0.info.connection` state object
2. Verify the connection state is set correctly (true for successful operations)
3. Test adapter startup and data processing workflows

## CI/CD Integration

For continuous integration, it's recommended to use the offline tests for speed and reliability:

```yaml
# Example GitHub Actions workflow
- name: Run offline integration tests
  run: npm run test:integration:offline
```

This ensures tests run consistently without depending on external API availability or rate limits.