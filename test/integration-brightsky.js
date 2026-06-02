const path = require('path');
const { tests } = require('@iobroker/testing');
const { expect } = require('chai');
const { startMockServer } = require('./mock-server');

// Fixtures used to derive expected values for assertions.
const currentFixture = require('./data/current_weather.json');
const hourlyFixture = require('./data/hourly_weather.json');
const dailyFixture = require('./data/daily_weather.json');

// A local mock server answers every Bright Sky endpoint from the fixtures. The
// adapter (spawned as a SEPARATE process by the harness) is pointed at it via
// the BRIGHTSKY_API_BASE env var, so the tests never reach the real API.
// Started lazily on first use and reused across all suites.
let mockServer = null;
const getMockEnv = async () => {
    if (!mockServer) {
        mockServer = await startMockServer();
    }
    return { BRIGHTSKY_API_BASE: mockServer.url };
};
after(async () => {
    if (mockServer) {
        await mockServer.close();
        mockServer = null;
    }
});

// German coordinates for testing (Berlin)
const GERMAN_COORDINATES = '52.520008,13.404954';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Read all states for the given ids into an id -> value map.
 *
 * @param {object} harness test harness
 * @param {string[]} stateIds state ids to read
 * @returns {Promise<Record<string, any>>} map of state id to value
 */
async function readStates(harness, stateIds) {
    const allStates = await new Promise((resolve, reject) => {
        harness.states.getStates(stateIds, (err, states) => {
            if (err) {
                return reject(err);
            }
            resolve(states || []);
        });
    });
    const map = {};
    stateIds.forEach((id, idx) => {
        map[id] = allStates[idx] ? allStates[idx].val : undefined;
    });
    return map;
}
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
                    harness = getHarness();
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
                    harness.objects.setObject(obj._id, obj);

                    console.log('✅ Step 1: Configuration written, starting adapter...');

                    await harness.startAdapterAndWait(false, await getMockEnv());

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
                        const st = allStates[idx];
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

                        // Check for weekday name datapoints - MUST exist in daily data
                        const dayNameShortState = stateIds.find(key => key === 'brightsky.0.daily.00.dayName_short');
                        const dayNameLongState = stateIds.find(key => key === 'brightsky.0.daily.00.dayName_long');
                        
                        if (!dayNameShortState) {
                            console.log('❌ dayName_short datapoint not found in daily.00 - test failed');
                            reject(new Error('Expected brightsky.0.daily.00.dayName_short but it was not found'));
                            return;
                        }
                        
                        if (!dayNameLongState) {
                            console.log('❌ dayName_long datapoint not found in daily.00 - test failed');
                            reject(new Error('Expected brightsky.0.daily.00.dayName_long but it was not found'));
                            return;
                        }
                        
                        // Get the actual values of the weekday name states
                        const dayNameShortIndex = stateIds.indexOf(dayNameShortState);
                        const dayNameLongIndex = stateIds.indexOf(dayNameLongState);
                        const dayNameShortValue = allStates[dayNameShortIndex]?.val;
                        const dayNameLongValue = allStates[dayNameLongIndex]?.val;
                        
                        // Get the timestamp state to determine which day daily.00 represents
                        const timestampState = stateIds.find(key => key === 'brightsky.0.daily.00.timestamp');
                        if (!timestampState) {
                            console.log('❌ timestamp datapoint not found in daily.00 - cannot determine expected weekday');
                            reject(new Error('Expected brightsky.0.daily.00.timestamp but it was not found'));
                            return;
                        }
                        
                        const timestampIndex = stateIds.indexOf(timestampState);
                        const timestampValue = allStates[timestampIndex]?.val;
                        
                        // Calculate expected values from the actual timestamp
                        const daily00Date = new Date(timestampValue);
                        const expectedShort = daily00Date.toLocaleString('en', { weekday: 'short' });
                        const expectedLong = daily00Date.toLocaleString('en', { weekday: 'long' });
                        
                        console.log(`📅 Daily.00 timestamp: ${timestampValue}`);
                        console.log(`📅 Daily.00 date: ${daily00Date.toISOString().split('T')[0]} (${expectedLong})`);
                        console.log(`📅 Expected dayName_short: "${expectedShort}", dayName_long: "${expectedLong}"`);
                        
                        // Verify exact values match expected from the timestamp
                        if (dayNameShortValue !== expectedShort) {
                            console.log(`❌ dayName_short has wrong value: "${dayNameShortValue}" (expected: "${expectedShort}") - test failed`);
                            reject(new Error(`Expected dayName_short to be "${expectedShort}" but got: "${dayNameShortValue}"`));
                            return;
                        }
                        
                        if (dayNameLongValue !== expectedLong) {
                            console.log(`❌ dayName_long has wrong value: "${dayNameLongValue}" (expected: "${expectedLong}") - test failed`);
                            reject(new Error(`Expected dayName_long to be "${expectedLong}" but got: "${dayNameLongValue}"`));
                            return;
                        }
                        
                        console.log(`✅ Found weekday name datapoints with correct values:`);
                        console.log(`   📊 dayName_short: "${dayNameShortValue}" (matches expected: "${expectedShort}")`);
                        console.log(`   📊 dayName_long: "${dayNameLongValue}" (matches expected: "${expectedLong}")`);


                        // Check for source information
                        const sourceStates = stateIds.filter(key => key.includes('sources'));
                        if (sourceStates.length > 0) {
                            console.log(`✅ Found ${sourceStates.length} weather source datapoints`);
                        }

                        // --- Value assertions against the known fixture inputs ---
                        // These turn the test into a real regression guard for extensions:
                        // deterministic inputs (fixtures) -> exact expected outputs.
                        try {
                            const valueOf = id => {
                                const idx = stateIds.indexOf(id);
                                return idx >= 0 && allStates[idx] ? allStates[idx].val : undefined;
                            };

                            // current.temperature is written through unchanged from the fixture
                            const expectedCurrentTemp = currentFixture.weather.temperature;
                            expect(
                                valueOf('brightsky.0.current.temperature'),
                                'current.temperature should match fixture',
                            ).to.equal(expectedCurrentTemp);

                            // hourly.00 corresponds to the first hourly fixture item
                            const expectedHourlyTemp = hourlyFixture.weather[0].temperature;
                            expect(
                                valueOf('brightsky.0.hourly.00.temperature'),
                                'hourly.00.temperature should match fixture',
                            ).to.equal(expectedHourlyTemp);

                            // daily.00 aggregates the first 24 hourly items (today 00:00..23:00
                            // after the mock re-anchors timestamps to "now")
                            const day0Temps = dailyFixture.weather
                                .slice(0, 24)
                                .map(x => x.temperature)
                                .filter(v => v != null);
                            const expectedDailyMax = Math.max(...day0Temps);
                            expect(
                                valueOf('brightsky.0.daily.00.temperature_max'),
                                'daily.00.temperature_max should equal max of day-0 hourly temps',
                            ).to.equal(expectedDailyMax);

                            // No panels configured -> PV estimate must be exactly 0
                            expect(
                                valueOf('brightsky.0.daily.00.solar_estimate'),
                                'daily.00.solar_estimate must be 0 without panels',
                            ).to.equal(0);

                            // conditionUI: translated condition text, now also for current + hourly.
                            // No system language is loaded in the harness, so getTranslation()
                            // returns the (capitalized) raw key -> deterministic expectation.
                            const capitalize = c => (c ? c.charAt(0).toUpperCase() + c.slice(1) : '');
                            expect(
                                valueOf('brightsky.0.current.conditionUI'),
                                'current.conditionUI should be the translated current.condition',
                            ).to.equal(capitalize(currentFixture.weather.condition));
                            expect(
                                valueOf('brightsky.0.hourly.00.conditionUI'),
                                'hourly.00.conditionUI should be the translated hourly.00.condition',
                            ).to.equal(capitalize(hourlyFixture.weather[0].condition));

                            console.log('✅ Value assertions passed (current/hourly temperature, daily temperature_max, solar_estimate, current/hourly conditionUI)');
                        } catch (assertErr) {
                            await harness.stopAdapter();
                            return reject(assertErr);
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
                            createDaily: false, // Daily disabled, others as set above
                        });

                        await new Promise((res, rej) => {
                            harness.objects.setObject(obj._id, obj, (err) => {
                                if (err) return rej(err);
                                console.log('✅ Step 2.5: Adapter object updated');
                                res(undefined);
                            });
                        });

                        console.log('🔍 Step 3: Starting adapter...');
                        await harness.startAdapterAndWait(false, await getMockEnv());
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
                            console.log(`❌ Step 10: Daily states present (${dailyStates.length}) (test failed)`);
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

        // Test suite for radar.data when createRadar is enabled but createRadarData is disabled
        suite('should NOT create radar.data folder when createRadarData is disabled', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should create radar but NOT radar.data when createRadarData is disabled', () => {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        const obj = await harness.objects.getObject('system.adapter.brightsky.0');

                        console.log('🧪 Test: createRadar=true, createRadarData=false');
                        
                        // Configure with radar enabled but radar data disabled
                        Object.assign(obj.native, {
                            position: GERMAN_COORDINATES,
                            createCurrently: false,
                            createHourly: false,
                            createDaily: false,
                            createRadar: true,
                            createRadarData: false,  // DISABLED
                            pollIntervalRadar: 10,
                            radarDistance: 10000,
                        });

                        harness.objects.setObject(obj._id, obj);
                        await harness.startAdapterAndWait(false, await getMockEnv());
                        console.log('✅ Step 1: Adapter started');

                        await wait(20000);
                        console.log('✅ Step 2: Wait completed');

                        const stateIds = await harness.dbConnection.getStateIDs('brightsky.0.*');
                        console.log(`📊 Found ${stateIds.length} total states`);

                        // Check that radar folder exists
                        const radarStates = stateIds.filter(key => key.includes('radar') && !key.includes('radar.data'));
                        if (radarStates.length === 0) {
                            console.log('❌ No radar states found - test failed');
                            reject(new Error('Expected radar states but found none'));
                            return;
                        } else {
                            console.log(`✅ Found ${radarStates.length} radar states (excluding radar.data)`);
                        }

                        // Check that radar.data folder does NOT exist
                        const radarDataStates = stateIds.filter(key => key.includes('radar.data'));
                        if (radarDataStates.length > 0) {
                            console.log(`❌ Found ${radarDataStates.length} radar.data states when none were expected - test failed`);
                            reject(new Error('Expected no radar.data states but found some'));
                            return;
                        } else {
                            console.log('✅ No radar.data states found as expected');
                        }

                        await harness.stopAdapter();
                        console.log('✅ Test passed: radar exists, radar.data does not exist');
                        resolve(true);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).timeout(40000);
        });

        // Test suite for radar.data when both createRadar and createRadarData are enabled
        suite('should create radar.data folder when createRadarData is enabled', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should create both radar and radar.data when createRadarData is enabled', () => {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        const obj = await harness.objects.getObject('system.adapter.brightsky.0');

                        console.log('🧪 Test: createRadar=true, createRadarData=true');
                        
                        // Configure with both radar and radar data enabled
                        Object.assign(obj.native, {
                            position: GERMAN_COORDINATES,
                            createCurrently: false,
                            createHourly: false,
                            createDaily: false,
                            createRadar: true,
                            createRadarData: true,  // ENABLED
                            pollIntervalRadar: 10,
                            radarDistance: 10000,
                        });

                        harness.objects.setObject(obj._id, obj);
                        await harness.startAdapterAndWait(false, await getMockEnv());
                        console.log('✅ Step 1: Adapter started');

                        await wait(20000);
                        console.log('✅ Step 2: Wait completed');

                        const stateIds = await harness.dbConnection.getStateIDs('brightsky.0.*');
                        console.log(`📊 Found ${stateIds.length} total states`);

                        // Check that radar folder exists
                        const radarStates = stateIds.filter(key => key.includes('radar'));
                        if (radarStates.length === 0) {
                            console.log('❌ No radar states found - test failed');
                            reject(new Error('Expected radar states but found none'));
                            return;
                        } else {
                            console.log(`✅ Found ${radarStates.length} radar states`);
                        }

                        // Check that radar.data folder DOES exist
                        const radarDataStates = stateIds.filter(key => key.includes('radar.data'));
                        if (radarDataStates.length === 0) {
                            console.log('❌ No radar.data states found when they were expected - test failed');
                            reject(new Error('Expected radar.data states but found none'));
                            return;
                        } else {
                            console.log(`✅ Found ${radarDataStates.length} radar.data states as expected`);
                        }

                        await harness.stopAdapter();
                        console.log('✅ Test passed: both radar and radar.data exist');
                        resolve(true);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).timeout(40000);
        });

        // Test suite for radar.data when createRadar is disabled
        suite('should NOT create radar or radar.data when createRadar is disabled', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should not create any radar states when createRadar is disabled', () => {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        const obj = await harness.objects.getObject('system.adapter.brightsky.0');

                        console.log('🧪 Test: createRadar=false, createRadarData=true (should still not create anything)');
                        
                        // Configure with radar disabled (createRadarData value shouldn't matter)
                        Object.assign(obj.native, {
                            position: GERMAN_COORDINATES,
                            createCurrently: false,
                            createHourly: true,  // Enable at least one to start adapter
                            createDaily: false,
                            createRadar: false,  // DISABLED
                            createRadarData: true,  // This should be ignored
                            pollIntervalRadar: 10,
                            radarDistance: 10000,
                        });

                        harness.objects.setObject(obj._id, obj);
                        await harness.startAdapterAndWait(false, await getMockEnv());
                        console.log('✅ Step 1: Adapter started');

                        await wait(20000);
                        console.log('✅ Step 2: Wait completed');

                        const stateIds = await harness.dbConnection.getStateIDs('brightsky.0.*');
                        console.log(`📊 Found ${stateIds.length} total states`);

                        // Check that NO radar states exist
                        const radarStates = stateIds.filter(key => key.includes('radar'));
                        if (radarStates.length > 0) {
                            console.log(`❌ Found ${radarStates.length} radar states when none were expected - test failed`);
                            reject(new Error('Expected no radar states but found some'));
                            return;
                        } else {
                            console.log('✅ No radar states found as expected');
                        }

                        await harness.stopAdapter();
                        console.log('✅ Test passed: no radar or radar.data states exist');
                        resolve(true);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).timeout(40000);
        });

        // Test suite to verify radar unit conversion and cumulative values
        suite('should create radar states with correct unit conversion and cumulative values', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should create radar states with cumulative precipitation values', () => {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        const obj = await harness.objects.getObject('system.adapter.brightsky.0');

                        console.log('🧪 Test: Verifying radar unit conversion and cumulative values');

                        // Configure with radar enabled
                        Object.assign(obj.native, {
                            position: GERMAN_COORDINATES,
                            createCurrently: false,
                            createHourly: false,
                            createDaily: false,
                            createRadar: true,
                            createRadarData: true,
                            pollIntervalRadar: 10,
                            radarDistance: 10000,
                        });

                        harness.objects.setObject(obj._id, obj);
                        await harness.startAdapterAndWait(false, await getMockEnv());
                        console.log('✅ Step 1: Adapter started');

                        await wait(20000);
                        console.log('✅ Step 2: Wait completed');

                        const stateIds = await harness.dbConnection.getStateIDs('brightsky.0.*');
                        console.log(`📊 Found ${stateIds.length} total states`);

                        // Check for max_precipitation_forecast states
                        const maxPrecipStates = stateIds.filter(key => key.includes('max_precipitation_forecast'));
                        if (maxPrecipStates.length === 0) {
                            console.log('❌ No max_precipitation_forecast states found - test failed');
                            reject(new Error('Expected max_precipitation_forecast states but found none'));
                            return;
                        } else {
                            console.log(`✅ Found ${maxPrecipStates.length} max_precipitation_forecast states`);
                        }

                        // Check for cumulative states (_sum)
                        const cumulativeStates = stateIds.filter(key => key.includes('max_precipitation_forecast') && key.includes('_sum'));
                        if (cumulativeStates.length === 0) {
                            console.log('❌ No cumulative precipitation states (_sum) found - test failed');
                            reject(new Error('Expected cumulative precipitation states but found none'));
                            return;
                        } else {
                            console.log(`✅ Found ${cumulativeStates.length} cumulative precipitation states (_sum)`);
                        }

                        // Verify that expected cumulative forecast states exist
                        const expectedCumulative = [
                            'next_05min_sum',
                            'next_10min_sum',
                            'next_15min_sum',
                            'next_30min_sum',
                            'next_45min_sum',
                            'next_60min_sum',
                            'next_90min_sum'
                        ];

                        for (const cumKey of expectedCumulative) {
                            const fullKey = `brightsky.0.radar.max_precipitation_forecast.${cumKey}`;
                            if (!stateIds.includes(fullKey)) {
                                console.log(`❌ Expected cumulative state ${cumKey} not found - test failed`);
                                reject(new Error(`Expected cumulative state ${cumKey} but not found`));
                                return;
                            }
                        }
                        console.log(`✅ All ${expectedCumulative.length} cumulative forecast states exist`);

                        // --- Value assertions: deterministic uniform grid in the mock ---
                        // Mock radar grid = 25 (0.01mm) per cell, 1 row x 3 cols => 0.25 mm
                        // after the adapter's /100 conversion. Per-5min max is therefore 0.25;
                        // the cumulative sum over N 5-min intervals is 0.25 * N.
                        const radarValues = await readStates(harness, stateIds);
                        const base = 'brightsky.0.radar.max_precipitation_forecast.';

                        // Unit conversion: 25 (0.01mm) -> 0.25 mm per 5-min window
                        expect(radarValues[`${base}next_05min`], 'next_05min unit conversion').to.equal(0.25);

                        // Cumulative sums: 0.25 mm * number of 5-min intervals
                        const expectedSums = {
                            next_05min_sum: 0.25, // 1 interval
                            next_10min_sum: 0.5, // 2
                            next_15min_sum: 0.75, // 3
                            next_30min_sum: 1.5, // 6
                            next_45min_sum: 2.25, // 9
                            next_60min_sum: 3.0, // 12
                            next_90min_sum: 4.5, // 18
                        };
                        for (const [key, expected] of Object.entries(expectedSums)) {
                            expect(radarValues[`${base}${key}`], `${key} cumulative value`).to.equal(expected);
                        }
                        console.log('✅ Radar value assertions passed (unit conversion + cumulative sums)');

                        await harness.stopAdapter();
                        console.log('✅ Test passed: radar states include cumulative values');
                        resolve(true);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).timeout(40000);
        });
    }
});