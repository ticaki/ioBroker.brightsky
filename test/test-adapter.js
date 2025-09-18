/**
 * Test-enabled version of the Brightsky adapter
 * This file wraps the main adapter to inject mock data during testing
 */

const path = require('path');
const { TestDataProvider } = require('./test-data-provider');

/**
 * Create a test-enabled version of the adapter that uses offline data
 */
function createTestAdapter() {
    // Import the built adapter
    const { Brightsky } = require('../build/main');
    const testDataProvider = new TestDataProvider();
    
    // Create mock axios for testing
    const mockAxios = testDataProvider.createMockAxios();
    
    // Override the axios module used by the adapter
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    
    Module.prototype.require = function(...args) {
        if (args[0] === 'axios') {
            console.log('📦 Using mock axios for testing');
            return mockAxios;
        }
        return originalRequire.apply(this, args);
    };
    
    // Create and return the adapter class
    class TestBrightsky extends Brightsky {
        constructor(options = {}) {
            // Ensure testing mode is enabled
            super({
                ...options,
                name: 'brightsky',
                systemConfig: {
                    ...options.systemConfig,
                    // Add any test-specific system config here
                }
            });
            
            console.log('🧪 Test adapter initialized with offline data');
        }
        
        /**
         * Override onReady to ensure connection state is properly created
         */
        async onReady() {
            console.log('🚀 Test adapter starting with offline mode...');
            
            // First create the connection state object if it doesn't exist
            try {
                await this.setObjectNotExistsAsync('info.connection', {
                    type: 'state',
                    common: {
                        name: 'Connection status',
                        type: 'boolean',
                        role: 'indicator.connected',
                        read: true,
                        write: false
                    },
                    native: {}
                });
                console.log('✅ Created info.connection state object');
            } catch (error) {
                console.log('ℹ️ Connection state object already exists or error creating it:', error.message);
            }
            
            // Now call the original onReady method
            return super.onReady();
        }
    }
    
    // Restore original require
    Module.prototype.require = originalRequire;
    
    return TestBrightsky;
}

module.exports = { createTestAdapter };