// controllers/authController.js - Authentication handler functions
const User = require('../models/User');
const Session = require('../models/Session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AppError, wrapAsync } = require('../middleware/errorHandler');

/**
 * Helper to generate access token and active session (refresh token) for the user.
 * Access token expires in 15 minutes, refresh token is a 40-byte cryptographically secure hex.
 */
const issueTokens = async (user, req) => {
  const token = jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenHash = await bcrypt.hash(rawRefreshToken, 10);

  const session = new Session({
    userId: user._id,
    refreshTokenHash,
    userAgent: req.headers['user-agent'] || '',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });
  await session.save();

  return { token, refreshToken: rawRefreshToken };
};

// POST /api/auth/register
const register = wrapAsync(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User with this email already exists.', 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const user = new User({
    name,
    email,
    passwordHash,
  });

  const savedUser = await user.save();
  const { token, refreshToken } = await issueTokens(savedUser, req);

  console.log(`👤 User registered: ${savedUser.email}`);

  res.status(201).json({
    token,
    refreshToken,
    user: {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
    },
  });
});

// POST /api/auth/login
const login = wrapAsync(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const { token, refreshToken } = await issueTokens(user, req);

  console.log(`🔑 User logged in: ${user.email}`);

  res.status(200).json({
    token,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

// POST /api/auth/refresh
const refresh = wrapAsync(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError('Refresh token is required.', 400);
  }

  // Query all active (non-revoked, non-expired) sessions
  const activeSessions = await Session.find({
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  let matchedSession = null;
  for (const session of activeSessions) {
    if (await bcrypt.compare(refreshToken, session.refreshTokenHash)) {
      matchedSession = session;
      break;
    }
  }

  if (matchedSession) {
    // Revoke old session (token rotation)
    matchedSession.revokedAt = new Date();
    await matchedSession.save();

    // Query user
    const user = await User.findById(matchedSession.userId);
    if (!user) {
      throw new AppError('User not found.', 401);
    }

    // Issue brand new token pair
    const { token: newAccessToken, refreshToken: newRefreshToken } = await issueTokens(user, req);
    console.log(`🔄 Tokens rotated for user ${user.email}`);

    return res.status(200).json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  }

  // Check if this was a reuse of an already-rotated (revoked) token
  const revokedSessions = await Session.find({ revokedAt: { $ne: null } });
  for (const session of revokedSessions) {
    if (await bcrypt.compare(refreshToken, session.refreshTokenHash)) {
      console.warn(`⚠️ Potential refresh token reuse/theft detected! Revoked Session ID: ${session._id}, User: ${session.userId}`);
      break;
    }
  }

  throw new AppError('Invalid or expired refresh token.', 401);
});

// POST /api/auth/logout
const logout = wrapAsync(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError('Refresh token is required.', 400);
  }

  const userSessions = await Session.find({ userId: req.user.id, revokedAt: null });
  for (const session of userSessions) {
    if (await bcrypt.compare(refreshToken, session.refreshTokenHash)) {
      session.revokedAt = new Date();
      await session.save();
      console.log(`🔒 Session revoked for user ${req.user.id}`);
      return res.status(200).json({ message: 'Session revoked successfully.' });
    }
  }

  throw new AppError('Session not found.', 404);
});

// GET /api/auth/sessions
const getSessions = wrapAsync(async (req, res) => {
  const activeSessions = await Session.find({
    userId: req.user.id,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  const result = activeSessions.map((session) => ({
    id: session._id,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  }));

  res.status(200).json(result);
});

// DELETE /api/auth/sessions/:id
const deleteSession = wrapAsync(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    throw new AppError('Session not found.', 404);
  }

  if (session.userId.toString() !== req.user.id) {
    throw new AppError('You are not authorized to revoke this session.', 403);
  }

  session.revokedAt = new Date();
  await session.save();

  res.status(200).json({ message: 'Session revoked successfully.' });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getSessions,
  deleteSession,
};
