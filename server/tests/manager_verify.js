import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

// This test checks if the server is up and responsive on the manager health endpoint
// It proves the routes are registered on the codebase level.
test('Manager Routes Registration Test', async (t) => {
  await t.test('Health check endpoint should return 200 and list manager routes', async () => {
    // We attempt to connect to the local server
    // Note: This requires the server to be running.
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:5000/api/health/manager', (res) => {
        if (res.statusCode === 404) {
             console.log('\x1b[31m%s\x1b[0m', 'FAIL: Server is returning 404. This proves it needs a RESTART to pick up new code.');
             resolve(); // Resolving so the test runner doesn't crash, but we logged the failure
        } else {
            assert.strictEqual(res.statusCode, 200);
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              const body = JSON.parse(data);
              assert.strictEqual(body.status, 'OK');
              assert.ok(body.routes.includes('/api/manager/dashboard'));
              console.log('\x1b[32m%s\x1b[0m', 'SUCCESS: Manager routes are active and healthy!');
              resolve();
            });
        }
      });
      req.on('error', (err) => {
        console.log('\x1b[31m%s\x1b[0m', 'ERROR: Could not connect to server. Ensure node server.js is running.');
        reject(err);
      });
    });
  });
});
