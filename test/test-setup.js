/**
 * Test setup that enables offline data testing by mocking axios globally
 * This module must be loaded before any tests that use the adapter
 */

const path = require('path');
const fs = require('fs');
const { TestDataProvider } = require('./test-data-provider');

// Initialize test data provider
const testDataProvider = new TestDataProvider();

// Store original require
const Module = require('module');
const originalRequire = Module.prototype.require;

/**
 * Setup test environment with mocked axios
 */
function setupTestEnvironment() {
    console.log('🔧 Setting up test environment with offline data support...');
    
    // Override require to inject mock axios
    Module.prototype.require = function(id) {
        if (id === 'axios') {
            console.log('📦 Intercepting axios import for testing');
            return testDataProvider.createMockAxios();
        }
        return originalRequire.apply(this, arguments);
    };
    
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