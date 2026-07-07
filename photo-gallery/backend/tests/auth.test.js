// tests/auth.test.js - Integration tests for user authentication
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('Auth Endpoints', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.name).toBe('Test User');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('should reject registration with duplicate email', async () => {
    // Pre-seed a user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    await User.create({
      name: 'Existing User',
      email: 'test@example.com',
      passwordHash,
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New User',
        email: 'test@example.com',
        password: 'newpassword123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('should reject registration with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'missingname@example.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/provide name, email, and password/i);
  });

  it('should login an existing user successfully', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    await User.create({
      name: 'Login User',
      email: 'login@example.com',
      passwordHash,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('should reject login with wrong password (401)', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    await User.create({
      name: 'Login User',
      email: 'login@example.com',
      passwordHash,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid credentials/i);
  });
});
