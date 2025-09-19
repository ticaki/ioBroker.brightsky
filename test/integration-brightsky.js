
// Load test setup FIRST to configure mocking for offline testing
require('./test-setup');

const path = require('path');
const { tests } = require('@iobroker/testing');

// German coordinates for testing (Berlin)
const GERMAN_COORDINATES = '52.520008,13.404954';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
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
                return new Promise(async (resolve, reject) => {
                    harness = getHarness()
                    const obj = await harness.objects.getObject('system.adapter.brightsky.0');


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
                    harness.objects.setObject(obj._id, obj)


                    console.log('✅ Step 1: Configuration written, starting adapter...');

                    await harness.startAdapterAndWait();

                    console.log('✅ Step 2: Adapter started');

                    const waitMs = 15000;
                    await wait(waitMs);

                    console.log('🔍 Step 3: Checking states after adapter run...');



                    const stateIds = await harness.dbConnection.getStateIDs('brightsky.0.*')

                    console.log('🔍 Step 4: Checking states after adapter run...');
                    const allStates = await new Promise((resolve, reject) => {
                        harness.states.getStates(stateIds, (err, states) => {
                            if (err) return reject(err);
                            resolve(states || []);
                        });
                    });

                    console.log(`📊 Found ${stateIds.length} states`);

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

                        /*if (connectionState && connectionState.val === true) {
                            console.log(`✅ Offline data processing successful`);
                        } else {
                            console.log(`⚠️  Connection state indicates potential issue, but adapter structure was created successfully`);
                        }*/

                        console.log(`✅ No real API calls were made - all data from offline test files`);
                        console.log(`✅ Integration test completed successfully\n`);
                        await harness.stopAdapter();
                        resolve(true);
                    } else {
                        console.log('❌ Step 6: No states were created by the adapter - test failed');
                        reject(new Error('Adapter did not create any states'));
                    }
                });
            }).timeout(40000);

        });

        // New test suite because `it` not support restarting adapter
        suite('should NOT create daily states when daily is disabled', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should NOT create daily states when daily is disabled', () => {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();

                        console.log('🔍 Step 1: Fetching adapter object...');
                        const obj = await new Promise((res, rej) => {
                            harness.objects.getObject('system.adapter.brightsky.0', (err, o) => {
                                if (err) return rej(err);
                                res(o);
                            });
                        });
                        if (!obj) return reject(new Error('Adapter object not found'));
                        console.log('✅ Step 1.5: Adapter object loaded');

                        console.log('🔍 Step 2: Updating adapter config...');
                        Object.assign(obj.native, {
                            position: GERMAN_COORDINATES,
                            createCurrently: false,
                            createHourly: true,
                            createDaily: false, // Daily enabled, others disabled
                        });

                        await new Promise((res, rej) => {
                            harness.objects.setObject(obj._id, obj, (err) => {
                                if (err) return rej(err);
                                console.log('✅ Step 2.5: Adapter object updated');
                                res(undefined);
                            });
                        });

                        console.log('🔍 Step 3: Starting adapter...');
                        await harness.startAdapterAndWait();
                        console.log('✅ Step 4: Adapter started');

                        console.log('⏳ Step 5: Waiting 20 seconds for states...');
                        await new Promise((res) => setTimeout(res, 20000));

                        console.log('🔍 Step 6: Fetching state IDs...');
                        const stateIds = await harness.dbConnection.getStateIDs('brightsky.0.*');

                        console.log('🔎 Step 7: Checking states after adapter run...');
                        console.log(`📊 Step 8: Found ${stateIds.length} total states`);

                        const weatherStates = stateIds.filter((key) => key.includes('hourly'));
                        if (weatherStates.length > 0) {
                            console.log(`✅ Step 9: Correctly ${weatherStates.length} hourly weather states created`);
                        } else {
                            console.log('❌ Step 9: No hourly states created (test failed)');
                            return reject(new Error('Expected hourly states but found none'));
                        }

                        // ▶️ Step 10: Daily present?
                        const dailyStates = stateIds.filter((key) => key.includes('daily'));
                        if (dailyStates.length === 0) {
                            console.log(`✅ Step 10: No daily states found as expected`);
                        } else {
                            console.log('❌ Step 10: Daily states present (${dailyStates.length}) (test failed)');
                            return reject(new Error('Expected daily states but found none'));
                        }

                        // ▶️ Step 11: Currently absent?
                        const currentlyStates = stateIds.filter((key) => key.includes('current'));
                        if (currentlyStates.length === 0) {
                            console.log('✅ Step 11: No currently states found as expected');
                        } else {
                            console.log(`❌ Step 11: Found ${currentlyStates.length} currently states (test failed)`);
                            return reject(new Error('Expected no currently states but found some'));
                        }

                        await harness.stopAdapter();
                        console.log('🛑 Step 12: Adapter stopped');

                        resolve(true);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).timeout(40000);
        });
    }
});