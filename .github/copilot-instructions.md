# GitHub Copilot Instructions for ioBroker.brightsky

## Project Overview

This is an ioBroker adapter for the [BrightSky API](https://brightsky.dev/docs/#/), which provides free weather data from the German Weather Service (DWD). The adapter converts DWD weather data into an easy-to-use format for ioBroker installations.

**Key Features:**
- Weather data from DWD (German Weather Service) via BrightSky API
- Current weather, hourly forecasts, and daily overviews
- Solar radiation data for solar panel estimations
- Automatic fallback to nearest weather stations
- Multilingual support for all user-facing content

## IMPORTANT: Communication & Commit Rules
### Always do the following:
✅ Add fixes #xy to the changelogs in the README if this PR resolves an issue.

### Never do the following:
❌ Never use fixes #xy except in the readme file.
❌ Never use fixes #xy in commits or pull requests.

## Development Guidelines

### Follow ioBroker Standards
This adapter must conform to the [ioBroker adapter development documentation](https://www.iobroker.net/#en/documentation/dev/adapterdev.md). Always reference this documentation for:
- Adapter structure and lifecycle
- State and object definitions
- Configuration patterns
- Testing requirements

### Coding Style and Comments

#### Code Comments
- **ALWAYS write code comments in English only**
- Use clear, descriptive comments for complex logic
- Comment public methods and their parameters
- Explain business logic related to weather data processing
- Example:
```typescript
/**
 * Processes weather data from BrightSky API and creates ioBroker states
 * @param weatherData Raw weather data from the API
 * @param stationInfo Station information for fallback handling
 */
private async processWeatherData(weatherData: BrightskyWeather, stationInfo: StationInfo): Promise<void> {
    // Convert solar radiation from kWh/m² (energy over 1 hour) to average W/m² (power)
    // W/m² = (kWh/m²) * 1000 / hours; here, hours = 1 for solar_60
    const solarRadiation = weatherData.solar_60 * 1000 / 1;
}
```

#### TypeScript Usage
- Use TypeScript for all source files
- Define proper interfaces for API responses (see `src/lib/definition.ts`)
- Use strict typing - avoid `any` type
- Example type definitions:
```typescript
interface BrightskyWeather {
    timestamp: string;
    cloud_cover: number | null;
    condition: string | null;
    temperature: number | null;
    // ... other properties
}
```

### Changelog Entries

#### Format Rules
All changelog entries must follow this exact format:
```
- (ticaki) Description of the change
```

#### Examples
```
- (ticaki) Added new datapoint for MDI icons support
- (ticaki) Wind bearing text is now translated into ioBroker system language  
- (ticaki) Fixed issue with fallback weather station selection
```

#### Guidelines
- Use past tense ("Added", "Fixed", "Updated")
- Be concise but descriptive
- Reference issue numbers when applicable: `fixes [#11](https://github.com/ticaki/ioBroker.brightsky/issues/11)`
- Group related changes together
- Always use `(ticaki)` as the author prefix
- **Always add user-relevant changes to the README changelog**: For any changes that affect the adapter's functionality, configuration, or user experience, add a brief and concise entry to the "### **WORK IN PROGRESS**" section in README.md

### Translation Requirements

#### Multilingual Support
All user-facing strings MUST be translated into these languages:
- `en` (English) - base language
- `de` (German)
- `ru` (Russian)
- `pt` (Portuguese)
- `nl` (Dutch)
- `fr` (French)
- `it` (Italian)
- `es` (Spanish)
- `pl` (Polish)
- `uk` (Ukrainian)
- `zh-cn` (Chinese Simplified)

#### Translation Files
- Admin UI translations: `admin/i18n/{lang}/translations.json`
- Package descriptions: `io-package.json` - `common.news.{version}` and `common.desc`

#### Translation Guidelines
- Provide accurate translations, not literal word-for-word translations
- Maintain consistency with existing ioBroker terminology
- Technical terms (like "datapoint", "solar radiation") should use established translations
- When in doubt, check other ioBroker adapters for similar terminology

#### Example Translation Structure
```json
{
    "en": "Solar radiation data for energy estimation",
    "de": "Solarstrahlungsdaten für Energieschätzung",
    "ru": "Данные солнечной радиации для оценки энергии",
    // ... other languages
}
```

### Datapoints and Object Structure

#### Object Hierarchy
```
brightsky.0/
├── info/
│   └── connection (boolean)
├── current/          # Current weather data
│   ├── temperature
│   ├── cloud_cover
│   ├── solar_60
│   └── ...
├── hourly/           # Hourly forecasts (configurable hours)
│   ├── 0/
│   ├── 1/
│   └── ...
└── daily/           # Daily overviews (8 days)
    ├── 0/
    ├── 1/
    └── ...
```

#### State Definition Patterns
Follow these patterns when creating new states:

```typescript
// For weather data
{
    _id: 'temperature',
    type: 'state',
    common: {
        name: 'Temperature',
        type: 'number',
        role: 'value.temperature',
        read: true,
        write: false,
        unit: '°C'
    },
    native: {}
}

// For solar data
{
    _id: 'solar_60',
    type: 'state',
    common: {
        name: 'Solar Radiation 60 min',
        type: 'number',
        role: 'value.power',
        read: true,
        write: false,
        unit: 'kWh/m²'
    },
    native: {}
}
```

#### Naming Conventions
- Use snake_case for state IDs matching BrightSky API
- Use descriptive names for channels and folders
- Include time periods in names when relevant (e.g., `solar_60`, `precipitation_10`)
- Use appropriate ioBroker roles (e.g., `value.temperature`, `value.clouds`, `value.power`)

### API Integration Guidelines

#### BrightSky API Usage
- Base URL: `https://api.brightsky.dev/`
- Endpoints:
  - Current weather: `/current_weather`
  - Weather forecasts: `/weather`
- Always handle API errors gracefully
- Implement proper timeout handling (default: 15 seconds)
- Use station fallback logic for missing data

#### Error Handling
```typescript
try {
    const response = await axios.get(apiUrl, { timeout: 15000 });
    // Process response
} catch (error) {
    this.log.error(`BrightSky API request failed: ${error instanceof Error ? error.message : String(error)}`);
    await this.setState('info.connection', false, true);
}
```

### Weather Station Handling

#### Station Selection
- Primary: Use lat/lon coordinates with maximum distance
- Override: Allow specific WMO or DWD station IDs
- Fallback: Automatically use next nearest station for missing data
- Format for multiple stations: comma-separated without spaces

#### Station ID Formats
- WMO Station ID: 5-digit format (pad with leading zero if needed)
- DWD Station ID: 5-digit format

### Solar Energy Calculations

#### Solar Data Types
- `solar_10`: 10-minute solar radiation (kWh/m²)
- `solar_30`: 30-minute solar radiation (kWh/m²)  
- `solar_60`: 60-minute solar radiation (kWh/m²)

#### Conversion Guidelines
- API provides kWh/m² values
- Can be converted to W/m² by multiplying by 1000
- Use for solar panel energy estimations
- Consider panel azimuth, tilt, efficiency, and area

### Testing Guidelines

#### Test Structure
- Unit tests: `src/**/*.test.ts`
- Integration tests: `test/integration-brightsky.js` (working offline test)
- Package tests: `test/package.js`

#### Test Commands
```bash
npm run test:ts      # TypeScript unit tests
npm run test:package # Package validation
npm run test         # All tests (unit + package)
npm run test:integration # Integration tests
```

#### ioBroker Integration Testing

**CRITICAL**: This project uses **OFFLINE integration testing** with mocked data to avoid real API calls during testing.

##### Framework Structure
Integration tests MUST use the working pattern from `test/integration-brightsky.js`:

```javascript
// Load test setup FIRST to configure mocking for offline testing
require('./test-setup');

const path = require('path');
const { tests } = require('@iobroker/testing');

const GERMAN_COORDINATES = '52.520008,13.404954';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with German coordinates - complete workflow', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should start adapter and create states', function () {
                return new Promise(async (resolve, reject) => {
                    harness = getHarness();
                    const obj = await harness.objects.getObject('system.adapter.brightsky.0');

                    // Configure adapter properties
                    Object.assign(obj.native, {
                        position: GERMAN_COORDINATES,
                        createCurrently: true,
                        createHourly: true,
                        createDaily: true,
                        // ... other configuration
                    });

                    // Create connection state object
                    harness.objects.setObject(
                        'brightsky.0.info.connection',
                        {
                            type: 'state',
                            common: {
                                name: 'Connection status',
                                type: 'boolean',
                                role: 'indicator.connected',
                                read: true,
                                write: false
                            },
                            native: {}
                        },
                        () => {}
                    );

                    // Set configuration and start adapter
                    harness.objects.setObject(obj._id, obj);
                    await harness.startAdapterAndWait();
                    
                    // Wait for adapter to process offline data
                    await wait(15000);

                    // Get states and validate
                    const stateIds = await harness.dbConnection.getStateIDs('brightsky.0.*');
                    const allStates = await new Promise((resolve, reject) => {
                        harness.states.getStates(stateIds, (err, states) => {
                            if (err) return reject(err);
                            resolve(states || []);
                        });
                    });

                    if (stateIds.length === 0) {
                        reject(new Error('No states were created by the adapter'));
                        return;
                    }

                    // CRITICAL: Test both SUCCESS and FAILURE scenarios
                    // Check that required states exist (MUST FAIL if missing)
                    const currentStates = stateIds.filter(key => key.includes('current'));
                    if (currentStates.length === 0) {
                        reject(new Error('Expected current weather states but none were found'));
                        return;
                    }

                    const hourlyStates = stateIds.filter(key => key.includes('hourly'));
                    if (hourlyStates.length === 0) {
                        reject(new Error('Expected hourly weather states but none were found'));
                        return;
                    }

                    const dailyStates = stateIds.filter(key => key.includes('daily'));
                    if (dailyStates.length === 0) {
                        reject(new Error('Expected daily weather states but none were found'));
                        return;
                    }

                    await harness.stopAdapter();
                    resolve(true);
                });
            }).timeout(40000);
        });

        // FAILURE TEST: Test when data types are disabled
        suite('should NOT create daily states when daily is disabled', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should NOT create daily states when daily is disabled', () => {
                return new Promise(async (resolve, reject) => {
                    harness = getHarness();
                    const obj = await harness.objects.getObject('system.adapter.brightsky.0');

                    // Configure with daily DISABLED
                    Object.assign(obj.native, {
                        position: GERMAN_COORDINATES,
                        createCurrently: false,
                        createHourly: true,
                        createDaily: false, // DISABLED
                    });

                    harness.objects.setObject(obj._id, obj);
                    await harness.startAdapterAndWait();
                    await wait(20000);

                    const stateIds = await harness.dbConnection.getStateIDs('brightsky.0.*');

                    // Verify hourly states exist (enabled)
                    const hourlyStates = stateIds.filter(key => key.includes('hourly'));
                    if (hourlyStates.length === 0) {
                        reject(new Error('Expected hourly states but found none'));
                        return;
                    }

                    // Verify daily states DON'T exist (disabled)
                    const dailyStates = stateIds.filter(key => key.includes('daily'));
                    if (dailyStates.length > 0) {
                        reject(new Error('Expected no daily states but found some'));
                        return;
                    }

                    // Verify current states DON'T exist (disabled)
                    const currentStates = stateIds.filter(key => key.includes('current'));
                    if (currentStates.length > 0) {
                        reject(new Error('Expected no current states but found some'));
                        return;
                    }

                    await harness.stopAdapter();
                    resolve(true);
                });
            }).timeout(40000);
        });
    }
});
```

##### Key Integration Testing Rules

**CRITICAL PRINCIPLES:**
1. **ALWAYS use offline testing** - Load `require('./test-setup')` at the top
2. **Split test suites** - Use separate suites for different scenarios (can't restart adapter within same `it`)
3. **Test SUCCESS and FAILURE** - For every "it works" test, add corresponding "it fails when disabled" test
4. **MUST FAIL when expected states missing** - Use `reject(new Error(...))` not just logging
5. **Use proper async patterns** - `await harness.startAdapterAndWait()`, proper Promise handling
6. **Allow sufficient time** - `await wait(15000)` for data processing, `timeout(40000)` for tests

**Required Test Structure:**
- ✅ Success test: All data types enabled → Verify all state types exist
- ✅ Failure test: Daily disabled → Verify no daily states created  
- ✅ Failure test: All disabled → Verify no weather states created
- ✅ Use `reject(new Error(...))` when validation fails
- ✅ Use offline mocked data (no real API calls)

##### What NOT to Do
❌ Real API calls in integration tests
❌ Single test suite for all scenarios (adapter restart issues)
❌ Only logging failures without rejecting
❌ Testing only success cases without corresponding failure cases
❌ Insufficient timeouts for async operations

##### What TO Do  
✅ Use offline testing with `test-setup.js` mocking
✅ Separate test suites for different scenarios
✅ Test both success (states created) and failure (states not created) scenarios
✅ Use `reject(new Error(...))` when expected states are missing
✅ Use proper timeouts: `timeout(40000)` for tests, `await wait(15000)` for processing
✅ Follow the exact pattern from the working `integration-brightsky.js`

##### Workflow Dependencies
Integration tests should run ONLY after lint and adapter tests pass:

```yaml
integration-tests:
  needs: [check-and-lint, adapter-tests]
  runs-on: ubuntu-latest
  steps:
    - name: Run integration tests
      run: npx mocha test/integration-*.js --exit
```

### Build and Development

#### Build Process
```bash
npm run build        # Compile TypeScript
npm run watch        # Watch mode for development
npm run check        # Type checking without build
npm run lint         # ESLint checking
```

#### Code Quality
- Use ESLint configuration from `@iobroker/eslint-config`
- Follow Prettier formatting rules
- Ensure TypeScript compilation without errors
- All code must pass linting before commits

## Documentation Links

### Essential References
- [BrightSky API Documentation](https://brightsky.dev/docs/#/)
- [ioBroker Adapter Development Guide](https://www.iobroker.net/#en/documentation/dev/adapterdev.md)
- [German Weather Service (DWD)](https://www.dwd.de/)

### ioBroker Specific
- [Official Testing Framework Documentation](https://github.com/ioBroker/testing)
- [State Roles Documentation](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/objectsschema.md)
- [Adapter Configuration Schema](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/adapterconfigschema.md)
- [Translation Guidelines](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/translating.md)

## Common Patterns and Examples

### Creating New Weather Datapoints
When adding new weather data from the BrightSky API:

1. Add the field to the TypeScript interface in `src/lib/definition.ts`
2. Create the state object definition with appropriate role and unit
3. Add translation strings for the datapoint name
4. Update processing logic to handle the new field
5. Consider fallback behavior if data is missing
6. Update changelog with the addition

### Adding Configuration Options
For new adapter configuration options:
1. Update `admin/jsonConfig.json` with the new field
2. Add translations in all supported languages
3. Update the TypeScript configuration interface
4. Handle the configuration in the main adapter logic
5. Document the option in README.md if user-facing

Remember: Always prioritize code clarity, proper error handling, and comprehensive multilingual support. This adapter serves international users and must maintain high quality standards consistent with the ioBroker ecosystem.