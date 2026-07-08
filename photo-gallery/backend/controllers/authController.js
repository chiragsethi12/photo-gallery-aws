// controllers/authController.js - Authentication handler functions
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError, wrapAsync } = require('../middleware/errorHandler');

/**
 * Generate a JWT token for the user
 * @param {object} user - User document
 * @returns {string} Signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
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
  const token = generateToken(savedUser);

  console.log(`👤 User registered: ${savedUser.email}`);

  res.status(201).json({
    token,
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

  const token = generateToken(user);

  console.log(`🔑 User logged in: ${user.email}`);

  res.status(200).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

module.exports = {
  register,
  login,
};
