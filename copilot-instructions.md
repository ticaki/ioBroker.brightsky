# GitHub Copilot Instructions for ioBroker.brightsky

## Project Overview

This is an ioBroker adapter for the [BrightSky API](https://brightsky.dev/docs/#/), which provides free weather data from the German Weather Service (DWD). The adapter converts DWD weather data into an easy-to-use format for ioBroker installations.

**Key Features:**
- Weather data from DWD (German Weather Service) via BrightSky API
- Current weather, hourly forecasts, and daily overviews
- Solar radiation data for solar panel estimations
- Automatic fallback to nearest weather stations
- Multilingual support for all user-facing content

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
    // Convert solar radiation from kWh/m² to W/m² for better usability
    const solarRadiation = weatherData.solar_60 * 1000;
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
- Integration tests: `test/integration.js`
- Package tests: `test/package.js`

#### Test Commands
```bash
npm run test:ts      # TypeScript unit tests
npm run test:package # Package validation
npm run test         # All tests
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