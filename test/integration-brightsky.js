const path = require('path');
const { tests } = require('@iobroker/testing');

// German coordinates for testing (Berlin)
const GERMAN_COORDINATES = '52.520008,13.404954';

// Run integration tests
tests.integration(path.join(__dirname, '..'), {
    // Define additional tests that test the adapter with German coordinates
    defineAdditionalTests({ suite }) {
        // Test suite for German coordinates functionality using offline data
        suite('Test adapter with German coordinates - complete workflow', (getHarness) => {
            let harness;
            
            before(() => {
                harness = getHarness();
            });

            it('should start adapter with German coordinates, fetch data, and write states', () => new Promise(async (resolve, reject) => {
                // Configure adapter with German coordinates  
                harness.objects.getObject('system.adapter.brightsky.0', async (err, obj) => {
                    if (err) {
                        console.error('Error getting adapter object:', err);
                        reject(err);
                        return;
                    }

                    // Set configuration with German coordinates and enable all data types
                    obj.native.position = GERMAN_COORDINATES;
                    obj.native.maxDistance = 50000;
                    obj.native.hours = 24;
                    obj.native.pollInterval = 1;
                    obj.native.pollIntervalCurrently = 30;
                    obj.native.createCurrently = true;
                    obj.native.createHourly = true;  
                    obj.native.createDaily = true;
                    obj.native.dwd_station_id = '';
                    obj.native.wmo_station = '';
                    obj.native.panels = [];

                    console.log('=== ADAPTER INTEGRATION TEST START ===');
                    console.log('Configuring adapter with German coordinates:', GERMAN_COORDINATES);

                    // First, create the connection state object that the adapter expects
                    try {
                        await new Promise((resolveState) => {
                            harness.objects.setObject('brightsky.0.info.connection', {
                                type: 'state',
                                common: {
                                    name: 'Connection status',
                                    type: 'boolean',
                                    role: 'indicator.connected',
                                    read: true,
                                    write: false
                                },
                                native: {}
                            }, (err) => {
                                if (err) {
                                    console.log('Connection state creation result:', err.message);
                                } else {
                                    console.log('Connection state object created');
                                }
                                resolveState();
                            });
                        });
                    } catch (error) {
                        console.log('⚠️ Note: Could not pre-create connection state:', error.message);
                    }

                    // Set the updated object
                    harness.objects.setObject(obj._id, obj);

                    console.log('Starting adapter...');
                    await harness.startAdapterAndWait();
                    console.log('Adapter started successfully');

                    // Give adapter time to fetch data and write states
                    console.log('Waiting for data processing...');
                    
                    setTimeout(() => {
                        console.log('Verifying weather data was written to states...');

                        // Check connection state to see if API calls were successful
                        harness.states.getState('brightsky.0.info.connection', (err, connectionState) => {
                            if (err) {
                                console.error('❌ Error getting connection state:', err);
                            } else {
                                console.log('📊 Connection state:', connectionState ? connectionState.val : 'null');
                            }

                            // Get all states to see what was created
                            // First get the state IDs that match the pattern
                            harness.dbConnection.getStateIDs('brightsky.0.*').then(stateIds => {
                                if (stateIds && stateIds.length > 0) {
                                    harness.states.getStates(stateIds, (err, allStates) => {
                                        if (err) {
                                            console.error('❌ Error getting states:', err);
                                            reject(err); // Properly fail the test instead of just resolving
                                            return;
                                        }

                                const stateCount = stateIds.length;
                                
                                console.log(`📊 Found ${stateCount} total states created by adapter`);

                                if (stateCount > 0) {
                                    console.log('✅ Step 6: Adapter successfully created states');
                                    
                                    // Show sample of created states
                                    console.log('📋 Sample states created:');
                                    stateIds.slice(0, 10).forEach((stateId, index) => {
                                        const state = allStates[index];
                                        console.log(`   ${stateId}: ${state && state.val !== undefined ? state.val : 'undefined'}`);
                                    });

                                    // Check for specific weather states
                                    const weatherStates = stateIds.filter(key => 
                                        key.includes('temperature') || 
                                        key.includes('condition') || 
                                        key.includes('cloud_cover') ||
                                        key.includes('wind_speed')
                                    );

                                    if (weatherStates.length > 0) {
                                        console.log(`✅ Found ${weatherStates.length} weather-specific datapoints:`);
                                        weatherStates.slice(0, 5).forEach(stateId => {
                                            const index = stateIds.indexOf(stateId);
                                            const state = allStates[index];
                                            console.log(`   📊 ${stateId}: ${state && state.val !== undefined ? state.val : 'undefined'}`);
                                        });
                                    }

                                    // Check for current weather states
                                    const currentStates = stateIds.filter(key => key.includes('current'));
                                    if (currentStates.length === 0) {
                                        console.log('❌ No current weather datapoints found - this should not happen when current data is enabled');
                                        reject(new Error('Expected current weather states to be created but none were found'));
                                        return;
                                    } else {
                                        console.log(`✅ Found ${currentStates.length} current weather datapoints`);
                                    }

                                    // Check for hourly weather states
                                    const hourlyStates = stateIds.filter(key => key.includes('hourly'));
                                    if (hourlyStates.length === 0) {
                                        console.log('❌ No hourly weather datapoints found - this should not happen when hourly data is enabled');
                                        reject(new Error('Expected hourly weather states to be created but none were found'));
                                        return;
                                    } else {
                                        console.log(`✅ Found ${hourlyStates.length} hourly weather datapoints`);
                                    }

                                    // Check for daily weather states
                                    const dailyStates = stateIds.filter(key => key.includes('daily'));
                                    if (dailyStates.length === 0) {
                                        console.log('❌ No daily weather datapoints found - this should not happen when daily data is enabled');
                                        reject(new Error('Expected daily weather states to be created but none were found'));
                                        return;
                                    } else {
                                        console.log(`✅ Found ${dailyStates.length} daily weather datapoints`);
                                    }

                                    // Check for source information
                                    const sourceStates = stateIds.filter(key => key.includes('sources'));
                                    if (sourceStates.length > 0) {
                                        console.log(`Found ${sourceStates.length} weather source datapoints`);
                                    }

                                    console.log(`Adapter created ${stateCount} total datapoints`);
                                    console.log(`Weather-specific datapoints: ${weatherStates.length}`);
                                    
                                    if (connectionState && connectionState.val === true) {
                                        console.log('Data processing successful');
                                    } else {
                                        console.log('Connection state indicates potential issue, but adapter structure was created successfully');
                                    }
                                    
                                    console.log('Integration test completed successfully');

                                } else {
                                    console.log('❌ No states created by adapter');
                                    reject(new Error('No states were created by the adapter'));
                                    return;
                                }

                                resolve();
                            });
                            } else {
                                console.log('❌ No states found with pattern brightsky.0.*');
                                reject(new Error('No states found matching pattern brightsky.0.*'));
                            }
                            }).catch(err => {
                                console.error('❌ Error getting state IDs:', err);
                                reject(err); // Properly fail the test
                            });
                        });
                    }, 15000); // Wait 15 seconds for data fetching
                });
            })).timeout(30000); // 30 second timeout

            it('should validate German coordinates are within valid bounds', () => {
                const coords = GERMAN_COORDINATES.split(',');
                const lat = parseFloat(coords[0]);  
                const lon = parseFloat(coords[1]);

                // Validate coordinates are properly formatted
                const isValidFormat = coords.length === 2 && !isNaN(lat) && !isNaN(lon);

                // Validate coordinates are within German bounds
                const isInGermany = lat >= 47 && lat <= 56 && lon >= 5 && lon <= 16;

                if (!isValidFormat || !isInGermany) {
                    throw new Error('German coordinates validation failed');
                }
            });

            // Test failure scenarios - ensuring tests fail when expected conditions are not met
            it('should fail when daily data is disabled but daily states are expected', () => new Promise(async (resolve, reject) => {
                // Configure adapter with daily disabled
                harness.objects.getObject('system.adapter.brightsky.0', async (err, obj) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Disable daily data creation
                    obj.native.position = GERMAN_COORDINATES;
                    obj.native.createCurrently = true;
                    obj.native.createHourly = true;  
                    obj.native.createDaily = false; // Disabled
                    
                    harness.objects.setObject(obj._id, obj);

                    try {
                        await harness.startAdapterAndWait();
                        
                        setTimeout(async () => {
                            try {
                                const stateIds = await harness.dbConnection.getStateIDs('brightsky.0.*');
                                const dailyStates = stateIds.filter(key => key.includes('daily'));
                                
                                if (dailyStates.length > 0) {
                                    reject(new Error(`Daily data was disabled but ${dailyStates.length} daily states were still created`));
                                } else {
                                    console.log('✅ Correctly no daily states created when daily data is disabled');
                                    resolve();
                                }
                            } catch (error) {
                                reject(error);
                            }
                        }, 10000);
                    } catch (error) {
                        reject(error);
                    }
                });
            })).timeout(20000);

            it('should fail when no data types are enabled', () => new Promise(async (resolve, reject) => {
                // Configure adapter with all data types disabled
                harness.objects.getObject('system.adapter.brightsky.0', async (err, obj) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Disable all data creation
                    obj.native.position = GERMAN_COORDINATES;
                    obj.native.createCurrently = false;
                    obj.native.createHourly = false;  
                    obj.native.createDaily = false;
                    
                    harness.objects.setObject(obj._id, obj);

                    try {
                        await harness.startAdapterAndWait();
                        
                        setTimeout(async () => {
                            try {
                                const stateIds = await harness.dbConnection.getStateIDs('brightsky.0.*');
                                const weatherStates = stateIds.filter(key => 
                                    key.includes('daily') || key.includes('hourly') || key.includes('current')
                                );
                                
                                if (weatherStates.length > 0) {
                                    reject(new Error(`No data types enabled but ${weatherStates.length} weather states were still created`));
                                } else {
                                    console.log('✅ Correctly no weather states created when no data types are enabled');
                                    resolve();
                                }
                            } catch (error) {
                                reject(error);
                            }
                        }, 5000);
                    } catch (error) {
                        reject(error);
                    }
                });
            })).timeout(15000);
        });
    }
});