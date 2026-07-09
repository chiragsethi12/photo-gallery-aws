const request = require('supertest');
const User = require('../models/User');
const Session = require('../models/Session');

describe('Refresh Token Session Management', () => {
  let app;
  let userA, userB;
  let credentialsA, credentialsB;

  beforeAll(() => {
    app = require('../server');
  });

  beforeEach(async () => {
    credentialsA = {
      name: 'User A',
      email: 'usera@example.com',
      password: 'password123',
    };
    
    credentialsB = {
      name: 'User B',
      email: 'userb@example.com',
      password: 'password123',
    };

    // Create User A via registration
    await request(app)
      .post('/api/auth/register')
      .send(credentialsA);

    // Create User B via registration
    await request(app)
      .post('/api/auth/register')
      .send(credentialsB);

    // Retrieve user documents
    userA = await User.findOne({ email: credentialsA.email });
    userB = await User.findOne({ email: credentialsB.email });
  });

  it('login returns both token (access) and refreshToken', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: credentialsA.email,
        password: credentialsA.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe(credentialsA.email);

    // Confirm session created in DB
    const session = await Session.findOne({ userId: userA._id });
    expect(session).toBeTruthy();
    expect(session.revokedAt).toBeNull();
  });

  it('POST /refresh with a valid refresh token returns a new pair and invalidates the old one', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: credentialsA.email,
        password: credentialsA.password,
      });

    const oldRefreshToken = loginRes.body.refreshToken;

    // Refresh token
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toHaveProperty('token');
    expect(refreshRes.body).toHaveProperty('refreshToken');

    const newRefreshToken = refreshRes.body.refreshToken;
    expect(newRefreshToken).not.toBe(oldRefreshToken);

    // Confirm old session is now revoked in DB
    const oldSession = await Session.findOne({ userId: userA._id, revokedAt: { $ne: null } });
    expect(oldSession).toBeTruthy();

    // Confirm a new active session exists
    const newSession = await Session.findOne({ userId: userA._id, revokedAt: null });
    expect(newSession).toBeTruthy();

    // Attempting to refresh with old refresh token should fail
    const retryRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefreshToken });

    expect(retryRes.status).toBe(401);
  });

  it('reusing an already-rotated refresh token is rejected', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: credentialsA.email,
        password: credentialsA.password,
      });

    const originalToken = loginRes.body.refreshToken;

    // Rotation 1 (Valid)
    const rotate1 = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: originalToken });

    expect(rotate1.status).toBe(200);

    // Rotation 2 (Attempt to reuse original token)
    const rotate2 = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: originalToken });

    expect(rotate2.status).toBe(401);
  });

  it('POST /logout revokes the session so it can no longer be refreshed', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: credentialsA.email,
        password: credentialsA.password,
      });

    const { token, refreshToken } = loginRes.body;

    // Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);

    // Verify session revoked in DB
    const sessions = await Session.find({ userId: userA._id });
    const revoked = sessions.find(s => s.revokedAt !== null);
    expect(revoked).toBeTruthy();

    // Verify cannot refresh anymore
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
  });

  it('GET /sessions only returns the requesting user\'s own sessions', async () => {
    // User A login (creates 1 session)
    const loginARes = await request(app)
      .post('/api/auth/login')
      .send({
        email: credentialsA.email,
        password: credentialsA.password,
      });

    // User B login (creates 1 session)
    const loginBRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: credentialsB.email,
        password: credentialsB.password,
      });

    // Request active sessions as User A
    const res = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${loginARes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    
    // Check that we only see User A's sessions
    res.body.forEach(session => {
      expect(session).not.toHaveProperty('refreshTokenHash');
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('userAgent');
    });
  });

  it('DELETE /sessions/:id rejects revoking another user\'s session with 403', async () => {
    // User A login
    const loginARes = await request(app)
      .post('/api/auth/login')
      .send({
        email: credentialsA.email,
        password: credentialsA.password,
      });

    // User B login
    const loginBRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: credentialsB.email,
        password: credentialsB.password,
      });

    // Get User B's session ID from DB
    const sessionB = await Session.findOne({ userId: userB._id });
    expect(sessionB).toBeTruthy();

    // User A attempts to delete User B's session
    const res = await request(app)
      .delete(`/api/auth/sessions/${sessionB._id}`)
      .set('Authorization', `Bearer ${loginARes.body.token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/authorized to revoke this session/i);

    // Verify session B is still active
    const checkSessionB = await Session.findById(sessionB._id);
    expect(checkSessionB.revokedAt).toBeNull();
  });
});
