// server.js - Entry point for the Express backend
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const imageRoutes = require('./routes/imageRoutes');
const albumRoutes = require('./routes/albumRoutes');
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorHandler');

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Performance Middlewares ──────────────────────────────────────

// 1. Secure HTTP headers
app.use(helmet());

// 2. Gzip compression
app.use(compression());

// 3. Rate limiting (100 requests per 15 minutes per IP globally)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// 4. Dynamic CORS matching
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or local testing)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
}));

// Parse incoming JSON request bodies
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

// All image-related API routes are prefixed with /api
app.use('/api', imageRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/auth', authRoutes);

// Health-check route
app.get('/', (req, res) => {
  res.json({ message: 'Photo Gallery API is running 🚀' });
});

// ─── Centralized Error Handler Middleware ─────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
