// tests/authMiddleware.test.js - Unit/integration tests for protect auth middleware
const request = require('supertest');
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

describe('Auth Middleware Protect', () => {
  let testApp;

  beforeAll(() => {
    testApp = express();
    testApp.use(express.json());
    
    // Mount a dummy protected endpoint to test the middleware
    testApp.get('/protected', protect, (req, res) => {
      res.status(200).json({ user: req.user });
    });
  });

  it('should reject requests with missing Authorization header (401)', async () => {
    const res = await request(testApp).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/no token provided/i);
  });

  it('should reject malformed or expired tokens (401)', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer invalid-signature-token-here');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token is invalid or expired/i);
  });

  it('should call next() and attach user details on valid JWT', async () => {
    const payload = { id: 'user123', name: 'John Middleware', email: 'john@mid.com' };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(expect.objectContaining({
      id: 'user123',
      name: 'John Middleware',
      email: 'john@mid.com',
    }));
  });
});
