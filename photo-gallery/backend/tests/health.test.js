const request = require('supertest');

// Mock Cloudinary SDK
jest.mock('cloudinary', () => {
  return {
    v2: {
      config: jest.fn(),
      api: {
        ping: jest.fn().mockResolvedValue({ status: 'ok' })
      }
    }
  };
});

describe('Health Endpoint - GET /health/ready', () => {
  let app;

  beforeAll(() => {
    app = require('../server');
  });

  it('should return 200 ok when MongoDB is connected', async () => {
    const res = await request(app)
      .get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.mongo).toBe(true);
    expect(res.body.cloudinary).toBe(true);
  });
});
