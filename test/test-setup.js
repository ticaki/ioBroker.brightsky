/**
 * Test setup that enables offline data testing by mocking fetch globally
 * This module must be loaded before any tests that use the adapter
 */

const path = require('path');
const fs = require('fs');
const { TestDataProvider } = require('./test-data-provider');

// Initialize test data provider
const testDataProvider = new TestDataProvider();

/**
 * Setup test environment with mocked fetch
 */
function setupTestEnvironment() {
    console.log('🔧 Setting up test environment with offline data support...');

    // Mock global fetch
    if (typeof global.fetch !== 'function') {
        // @ts-ignore
        global.fetch = async function(url, options) {
            let urlStr;
            if (typeof url === 'string') {
                urlStr = url;
            } else if (url instanceof URL) {
                urlStr = url.toString();
            } else if (typeof url === 'object' && url && typeof url.url === 'string') {
                urlStr = url.url;
            } else {
                throw new Error('Mock fetch only supports string or URL');
            }
            console.log(`🔄 Mock fetch call: ${urlStr}`);
            if (!options || !options.method || options.method === 'GET') {
                const response = testDataProvider.mockAxiosResponse(urlStr);
                // @ts-ignore
                return {
                    ok: true,
                    status: response.status,
                    statusText: response.statusText,
                    json: async () => response.data,
                    text: async () => JSON.stringify(response.data),
                    headers: new Map(),
                    url: urlStr,
                    redirected: false,
                    type: 'basic',
                    clone() { return this; },
                    body: null,
                };
            }
            throw new Error('Mock fetch only supports GET');
        };
        console.log('✅ Global fetch mocked for offline data');
    }

    console.log('✅ Test environment configured with offline data');
}

/**
 * Restore original environment after tests
 */
function teardownTestEnvironment() {
    console.log('🧹 Restoring original environment after tests');
    Module.prototype.require = originalRequire;
}

/**
 * Setup process handlers
 */
function setupProcessHandlers() {
    // Clean up on exit
    process.on('exit', teardownTestEnvironment);
    process.on('SIGINT', () => {
        teardownTestEnvironment();
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        teardownTestEnvironment();
        process.exit(0);
    });
}

// Auto-setup when this module is loaded
setupTestEnvironment();
setupProcessHandlers();

module.exports = {
    setupTestEnvironment,
    teardownTestEnvironment,
    testDataProvider
};