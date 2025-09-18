# Testing System Documentation

This document describes the testing system implemented for the ioBroker.brightsky adapter.

## Overview

The adapter includes comprehensive testing capabilities:

1. **Unit Tests** (`src/**/*.test.ts`) - Test individual functions and calculations
2. **Package Tests** (`test/package`) - Validate package.json and io-package.json  
3. **Integration Tests** (`test/integration-brightsky.js`) - Test complete adapter functionality with real API calls

## Test Commands

```bash
# Run all standard tests (unit + package)
npm test

# Run only TypeScript unit tests
npm run test:ts

# Run only package validation tests
npm run test:package

# Run integration tests
npm run test:integration
```

## Integration Test Details

The integration tests validate that:
- Adapter correctly creates states when data types are enabled (daily, hourly, current)
- Adapter properly fails to create states when data types are disabled
- Coordinate validation works correctly
- Connection states are handled properly

The tests include both success and failure validation to ensure the adapter behaves correctly under all conditions. For every success case, there are corresponding failure tests to ensure robust validation.

## CI/CD Integration

The integration tests are automatically run in the GitHub Actions workflow and use real API calls to ensure end-to-end functionality:

```yaml
# Integration tests run after main tests pass
- name: Run integration tests
  run: npx mocha test/integration-brightsky.js --exit
```

This ensures comprehensive testing with actual weather service connectivity.