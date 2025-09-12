const request = require('supertest');
const app = require('../app');

describe('API Tests', () => {
  test('GET /api/products returns products', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
});