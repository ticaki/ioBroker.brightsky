'use strict';

/**
 * Local mock of the Bright Sky API for the integration tests.
 *
 * A tiny HTTP server that answers every Bright Sky endpoint from local fixtures.
 * The adapter is pointed at it via the BRIGHTSKY_API_BASE environment variable
 * (passed to the spawned adapter process by the harness), so the tests never hit
 * the real api.brightsky.dev / DWD servers.
 *
 * This is a localhost server rather than an in-process fetch mock because
 * @iobroker/testing spawns the adapter as a SEPARATE process - a fetch override
 * in the mocha process would not reach it, and NODE_OPTIONS-based preloading is
 * not reliably honored in all environments.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const DATA = path.join(__dirname, 'data');
const load = f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

const currentFixture = load('current_weather.json');
const hourlyFixture = load('hourly_weather.json');
const dailyFixture = load('daily_weather.json');

const HOUR = 60 * 60 * 1000;
const FIVE_MIN = 5 * 60 * 1000;

function getParam(url, name) {
    const m = url.match(new RegExp(`[?&]${name}=([^&]+)`));
    return m ? decodeURIComponent(m[1]) : undefined;
}

/**
 * Re-anchor an hourly weather fixture so its timestamps line up with the range
 * the adapter requested (derived from the real "now"). The adapter buckets daily
 * data relative to today's midnight, so static past timestamps would be dropped.
 * We keep the fixture's weather VALUES but rewrite each item's timestamp to
 * anchor + i hours, trimmed to last_date.
 *
 * @param {object} fixture weather fixture with a `weather` array
 * @param {string} url request url containing date / last_date params
 * @returns {object} re-anchored { weather, sources }
 */
function reanchorWeather(fixture, url) {
    const startParam = getParam(url, 'date');
    const lastParam = getParam(url, 'last_date');
    const anchor = startParam ? new Date(startParam).getTime() : Date.now();
    const last = lastParam ? new Date(lastParam).getTime() : anchor + 24 * HOUR;

    const weather = [];
    for (let i = 0; i < fixture.weather.length; i++) {
        const ts = anchor + i * HOUR;
        if (ts > last) {
            break;
        }
        weather.push({ ...fixture.weather[i], timestamp: new Date(ts).toISOString() });
    }
    return { weather, sources: fixture.sources || [] };
}

/**
 * Build a deterministic radar response relative to "now". A uniform grid of
 * 25 (= 0.25 mm after the adapter's /100 conversion), single row x 3 columns,
 * across enough 5-minute frames to cover the adapter's [now, now+2h] window.
 * Uniform values make every aggregate exactly predictable in the assertions.
 *
 * @returns {object} radar response { radar: [...] }
 */
function buildRadar() {
    const now = Date.now();
    const start = Math.floor(now / FIVE_MIN) * FIVE_MIN - FIVE_MIN; // one frame before now for safe coverage
    const radar = [];
    for (let i = 0; i < 28; i++) {
        radar.push({
            timestamp: new Date(start + i * FIVE_MIN).toISOString(),
            source: 'TEST',
            precipitation_5: [[25, 25, 25]],
        });
    }
    return { radar };
}

/**
 * Resolve a request URL to the fixture payload, or null for unknown endpoints.
 *
 * @param {string} url request url (path + query)
 * @returns {object|null} response payload
 */
function resolve(url) {
    if (url.includes('/current_weather')) {
        return currentFixture;
    }
    if (url.includes('/radar')) {
        return buildRadar();
    }
    if (url.includes('/weather')) {
        const start = getParam(url, 'date');
        const end = getParam(url, 'last_date');
        let daily = false;
        if (start && end) {
            daily = (new Date(end).getTime() - new Date(start).getTime()) / (24 * HOUR) > 2;
        }
        return reanchorWeather(daily ? dailyFixture : hourlyFixture, url);
    }
    return null;
}

/**
 * Start the mock server on an ephemeral localhost port.
 *
 * @returns {Promise<{url: string, close: () => Promise<void>}>} server handle
 */
function startMockServer() {
    return new Promise((resolve_, reject) => {
        const server = http.createServer((req, res) => {
            const payload = resolve(req.url || '');
            if (payload === null) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: `mock-server: unexpected URL ${req.url}` }));
                return;
            }
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(payload));
        });
        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            resolve_({
                url: `http://127.0.0.1:${port}`,
                close: () =>
                    new Promise(done => {
                        server.close(() => done());
                    }),
            });
        });
    });
}

module.exports = { startMockServer };
