const request = require('supertest');
const mongoose = require('mongoose');

// Mock Cloudinary SDK
jest.mock('cloudinary', () => {
  return {
    v2: {
      config: jest.fn(),
      api: {
        ping: jest.fn().mockResolvedValue({ status: 'ok' }),
      },
    },
  };
});

describe('Health & Request ID Endpoints', () => {
  let app;

  beforeAll(() => {
    app = require('../server');
  });

  describe('GET /health (Liveness)', () => {
    it('should always return 200 and status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /health/ready (Readiness)', () => {
    it('should return 200 and status ok when DB is connected', async () => {
      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.mongo).toBe(true);
      expect(res.body.cloudinary).toBe(true);
    });

    it('should return 503 and status error when DB is disconnected', async () => {
      // Temporarily mock readyState to 0 (disconnected)
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        writable: true,
        configurable: true,
      });

      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('error');
      expect(res.body.mongo).toBe(false);

      // Restore readyState
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: originalReadyState,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('Request-ID Middleware', () => {
    it('should echo back X-Request-Id header if provided in request', async () => {
      const testId = 'custom-request-id-12345';
      const res = await request(app)
        .get('/health')
        .set('X-Request-Id', testId);

      expect(res.headers['x-request-id']).toBe(testId);
    });

    it('should generate a new UUID for X-Request-Id if not provided', async () => {
      const res = await request(app).get('/health');
      const generatedId = res.headers['x-request-id'];
      expect(generatedId).toBeDefined();
      // UUID regex check (v4 format check)
      expect(generatedId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });
});
