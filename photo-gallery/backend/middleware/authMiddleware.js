// middleware/authMiddleware.js - Middleware to verify JWT and authenticate routes
const jwt = require('jsonwebtoken');

/**
 * protect
 * Middleware function that verifies the Bearer token in the Authorization header.
 * Attaches the verified user payload { id, name, email } to req.user.
 */
const protect = (req, res, next) => {
  let token;

  // Check if Authorization header is present and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Split "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user payload to request object
      req.user = decoded;

      return next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'TokenExpiredError', message: 'Not authorized: token is expired.' });
      }
      return res.status(401).json({ error: 'Not authorized: token is invalid or expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized: no token provided.' });
  }
};

module.exports = { protect };
