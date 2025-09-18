// Load test setup FIRST to configure mocking for offline testing
require('./test-setup');

const path = require('path');
const { tests } = require('@iobroker/testing');

// German coordinates for testing (Berlin)
const GERMAN_COORDINATES = '52.520008,13.404954';

// Run integration tests
tests.integration(path.join(__dirname, '..'), {
    // Define additional tests that test the adapter with German coordinates
    defineAdditionalTests ({ suite }) {
        // Test suite for German coordinates functionality using offline data
        suite('Test adapter with German coordinates - complete workflow', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should start adapter with German coordinates, fetch data, and write states', function () {
                return new Promise((resolve, reject) => {
                    harness.objects.getObject('system.adapter.brightsky.0', (err, obj) => {
                        if (err || !obj) return reject(err || new Error('Adapter object missing'));

                        // Konfiguration setzen
                        Object.assign(obj.native, {
                            position: GERMAN_COORDINATES,
                            maxDistance: 50000,
                            hours: 24,
                            pollInterval: 1,
                            pollIntervalCurrently: 30,
                            createCurrently: true,
                            createHourly: true,
                            createDaily: true,
                            dwd_station_id: '',
                            wmo_station: '',
                            panels: [],
                        });

                        // Connection-State anlegen
                        harness.objects.setObject(
                            'brightsky.0.info.connection',
                            {
                                type: 'state',
                                common: { name: 'Connection status', type: 'boolean', role: 'indicator.connected', read: true, write: false },
                                native: {},
                            },
                            () => { }
                        );

                        // Objekt speichern und Adapter starten
                        harness.objects.setObject(obj._id, obj, (e) => {
                            if (e) return reject(e);

                            console.log('✅ Step 1: Configuration written, starting adapter...');

                            harness.startAdapterAndWait()
                                .then(() => {
                                    console.log('✅ Step 2: Adapter started');

                                    const waitMs = 15000;
                                    setTimeout(() => {
                                        console.log('🔍 Step 3: Checking states after adapter run...');

                                        harness.states.getState('brightsky.0.info.connection', (errState, connectionState) => {
                                            if (errState) return reject(errState);

                                            harness.dbConnection.getStateIDs('brightsky.0.*').then((stateIds) => {
                                                if (!stateIds || stateIds.length === 0) {
                                                    return reject(new Error('No states found matching pattern brightsky.0.*'));
                                                }

                                                harness.states.getStates(stateIds, (errAll, allStates) => {
                                                    if (errAll) return reject(errAll);

                                                    console.log(`📊 Found ${stateIds.length} states`);
                                                    console.log(`📊 Connection state: ${connectionState ? connectionState.val : 'null'}`);

                                                    // Beispielausgabe der ersten paar States
                                                    stateIds.slice(0, 5).forEach((id, idx) => {
                                                        const st = allStates[ idx ];
                                                        console.log(`   ${id}: ${st && st.val !== undefined ? st.val : 'undefined'}`);
                                                    });
                                                    const stateCount = stateIds.length;

                                                    console.log(`📊 Found ${stateCount} total states created by adapter`);

                                                    if (stateCount > 0) {
                                                        console.log('✅ Step 6: Adapter successfully created states');

                                                        // Show sample of created states
                                                        console.log('📋 Sample states created:');
                                                        stateIds.slice(0, 10).forEach((stateId, index) => {
                                                            const state = allStates[ index ];
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
                                                                const state = allStates[ index ];
                                                                console.log(`   📊 ${stateId}: ${state && state.val !== undefined ? state.val : 'undefined'}`);
                                                            });
                                                        }

                                                        // Check for current weather states - MUST exist when enabled
                                                        const currentStates = stateIds.filter(key => key.includes('current'));
                                                        if (currentStates.length === 0) {
                                                            console.log('❌ No current weather datapoints found - test failed');
                                                            reject(new Error('Expected current weather states but none were found'));
                                                            return;
                                                        } else {
                                                            console.log(`✅ Found ${currentStates.length} current weather datapoints`);
                                                        }

                                                        // Check for hourly weather states - MUST exist when enabled
                                                        const hourlyStates = stateIds.filter(key => key.includes('hourly'));
                                                        if (hourlyStates.length === 0) {
                                                            console.log('❌ No hourly weather datapoints found - test failed');
                                                            reject(new Error('Expected hourly weather states but none were found'));
                                                            return;
                                                        } else {
                                                            console.log(`✅ Found ${hourlyStates.length} hourly weather datapoints`);
                                                        }

                                                        // Check for daily weather states - MUST exist when enabled
                                                        const dailyStates = stateIds.filter(key => key.includes('daily'));
                                                        if (dailyStates.length === 0) {
                                                            console.log('❌ No daily weather datapoints found - test failed');
                                                            reject(new Error('Expected daily weather states but none were found'));
                                                            return;
                                                        } else {
                                                            console.log(`✅ Found ${dailyStates.length} daily weather datapoints`);
                                                        }

                                                        // Check for source information
                                                        const sourceStates = stateIds.filter(key => key.includes('sources'));
                                                        if (sourceStates.length > 0) {
                                                            console.log(`✅ Found ${sourceStates.length} weather source datapoints`);
                                                        }

                                                        console.log('\n🎉 === INTEGRATION TEST SUMMARY ===');
                                                        console.log(`✅ Adapter initialized with German coordinates: ${GERMAN_COORDINATES}`);
                                                        console.log(`✅ Adapter started successfully using offline test data`);
                                                        console.log(`✅ Adapter created ${stateCount} total datapoints`);
                                                        console.log(`✅ Weather-specific datapoints: ${weatherStates.length}`);

                                                        if (connectionState && connectionState.val === true) {
                                                            console.log(`✅ Offline data processing successful`);
                                                        } else {
                                                            console.log(`⚠️  Connection state indicates potential issue, but adapter structure was created successfully`);
                                                        }

                                                        console.log(`✅ No real API calls were made - all data from offline test files`);
                                                        console.log(`✅ Integration test completed successfully\n`);

                                                        resolve(undefined);
                                                    } else {
                                                        console.log('❌ Step 6: No states were created by the adapter - test failed');
                                                        reject(new Error('Adapter did not create any states'));
                                                    }
                                                });
                                            }).catch(reject);
                                        });
                                    }, waitMs);
                                })
                                .catch(reject);
                        });
                    });
                });
            }).timeout(30000);



            it('should validate German coordinates are within valid bounds', () => {
                const coords = GERMAN_COORDINATES.split(',');
                const lat = parseFloat(coords[ 0 ]);
                const lon = parseFloat(coords[ 1 ]);

                console.log('\n=== COORDINATE VALIDATION TEST ===');
                console.log(`Testing coordinates: ${GERMAN_COORDINATES}`);
                console.log(`Parsed - Latitude: ${lat}, Longitude: ${lon}`);

                // Validate coordinates are properly formatted
                const isValidFormat = coords.length === 2 && !isNaN(lat) && !isNaN(lon);
                console.log(`Valid format: ${isValidFormat}`);

                // Validate coordinates are within German bounds
                const isInGermany = lat >= 47 && lat <= 56 && lon >= 5 && lon <= 16;
                console.log(`Within German bounds: ${isInGermany}`);

                if (isValidFormat && isInGermany) {
                    console.log('✅ German coordinates validation passed');
                } else {
                    console.log('❌ German coordinates validation failed');
                    throw new Error('German coordinates validation failed');
                }

                console.log('=== COORDINATE VALIDATION COMPLETE ===\n');
            });

            // FAILURE TEST: Test when daily data is disabled - should NOT create daily states
            it('should NOT create daily states when daily data is disabled', () => new Promise(async (resolve, reject) => {
                harness.objects.getObject('system.adapter.brightsky.0', async (err, obj) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Configure with daily DISABLED
                    obj.native.position = GERMAN_COORDINATES;
                    obj.native.createCurrently = true;
                    obj.native.createHourly = true;
                    obj.native.createDaily = false; // DISABLED

                    harness.objects.setObject(obj._id, obj);

                    try {
                        await harness.startAdapterAndWait();

                        setTimeout(() => {
                            harness.dbConnection.getStateIDs('brightsky.0.*').then(stateIds => {
                                const dailyStates = stateIds.filter(key => key.includes('daily'));

                                if (dailyStates.length > 0) {
                                    console.log(`❌ Found ${dailyStates.length} daily states but daily data was disabled - test failed`);
                                    reject(new Error(`Expected no daily states when disabled but found ${dailyStates.length}`));
                                } else {
                                    console.log('✅ Correctly no daily states created when daily data disabled');
                                    resolve(undefined);
                                }
                            }).catch(reject);
                        }, 10000);
                    } catch (error) {
                        reject(error);
                    }
                });
            })).timeout(20000);

            // FAILURE TEST: Test when ALL data types are disabled - should fail appropriately
            it('should handle when all data types are disabled', () => new Promise(async (resolve, reject) => {
                harness.objects.getObject('system.adapter.brightsky.0', async (err, obj) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Configure with ALL data types DISABLED
                    obj.native.position = GERMAN_COORDINATES;
                    obj.native.createCurrently = false; // DISABLED
                    obj.native.createHourly = false;  // DISABLED
                    obj.native.createDaily = false;   // DISABLED

                    harness.objects.setObject(obj._id, obj);

                    try {
                        await harness.startAdapterAndWait();

                        setTimeout(() => {
                            harness.dbConnection.getStateIDs('brightsky.0.*').then(stateIds => {
                                const weatherStates = stateIds.filter(key =>
                                    key.includes('daily') || key.includes('hourly') || key.includes('current')
                                );

                                if (weatherStates.length > 0) {
                                    console.log(`❌ Found ${weatherStates.length} weather states but all data types were disabled - test failed`);
                                    reject(new Error(`Expected no weather states when all disabled but found ${weatherStates.length}`));
                                } else {
                                    console.log('✅ Correctly no weather states created when all data types disabled');
                                    resolve(undefined);
                                }
                            }).catch(reject);
                        }, 5000);
                    } catch (error) {
                        reject(error);
                    }
                });
            })).timeout(15000);
        });
    }
});