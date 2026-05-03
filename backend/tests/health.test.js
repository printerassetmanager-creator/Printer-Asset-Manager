const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

afterAll(async () => {
  await pool.end();
});

describe('Health endpoint', () => {
  test('GET /health should respond (may fail if DB not available)', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('status', 'OK');
    }
  });
});
