// server.js - Entry point for the Express backend
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const imageRoutes = require('./routes/imageRoutes');
const albumRoutes = require('./routes/albumRoutes');
const authRoutes = require('./routes/authRoutes');
const shareRoutes = require('./routes/shareRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { errorHandler, wrapAsync } = require('./middleware/errorHandler');
const cloudinary = require('./config/cloudinaryConfig');
const { initTrashCleanupJob } = require('./jobs/trashCleanup');

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Performance Middlewares ──────────────────────────────────────

// 1. Secure HTTP headers
app.use(helmet());

// 2. Gzip compression
app.use(compression());

// Request-ID & Pino HTTP logging middleware
const { randomUUID } = require('crypto');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');

app.use((req, res, next) => {
  const reqId = req.header('X-Request-Id') || randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
});

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
    },
  })
);

// 3. Rate limiting (100 requests per 15 minutes per IP globally)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'test-server') ? 10000 : 100, // limit each IP requests per windowMs
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

// Swagger API Documentation UI
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────────────────────

// All image-related API routes are prefixed with /api
app.use('/api', imageRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// Shareable links router mounted at /api/share.
// Note: The resolveShareLink route (GET /api/share/:token) bypasses global protect middleware
// to serve read-only resource details to unauthenticated users.
app.use('/api/share', shareRoutes);

// GET /health - Health liveness check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Health-check ready route
app.get('/health/ready', wrapAsync(async (req, res) => {
  const mongoHealthy = mongoose.connection.readyState === 1;
  let cloudinaryHealthy = false;

  try {
    if (cloudinary && cloudinary.api) {
      if (typeof cloudinary.api.ping === 'function') {
        await cloudinary.api.ping();
        cloudinaryHealthy = true;
      } else if (typeof cloudinary.api.resources === 'function') {
        await cloudinary.api.resources({ max_results: 1 });
        cloudinaryHealthy = true;
      }
    }
  } catch (err) {
    logger.error('Cloudinary health check failed: ' + err.message);
    cloudinaryHealthy = false;
  }

  const isHealthy = mongoHealthy && cloudinaryHealthy;
  const status = isHealthy ? 200 : 503;
  res.status(status).json({
    status: isHealthy ? 'ok' : 'error',
    mongo: mongoHealthy,
    cloudinary: cloudinaryHealthy,
  });
}));

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Photo Gallery API is running 🚀' });
});

// ─── Centralized Error Handler Middleware ─────────────────────────────────────
app.use(errorHandler);

// ─── Socket.IO & Server Initialization ────────────────────────────────────────
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  },
});

app.set('io', io);
app.server = server; // Attach server to app for testing integration

// Import helpers for Socket verification
const verifyToken = require('./utils/verifyToken');
const checkAlbumAccess = require('./utils/checkAlbumAccess');

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    logger.info('🔌 Socket connection rejected: No token provided.');
    socket.disconnect(true);
    return;
  }

  try {
    const decoded = verifyToken(token);
    socket.user = decoded;
    logger.info(`🔌 Socket connected: User "${decoded.name}" (${decoded.id})`);
  } catch (err) {
    logger.info(`🔌 Socket connection rejected: Invalid token. Error: ${err.message}`);
    socket.disconnect(true);
    return;
  }

  socket.on('join-album', async ({ albumId }) => {
    try {
      await checkAlbumAccess(albumId, socket.user.id, 'viewer');
      socket.join(`album:${albumId}`);
      logger.info(`🔌 Socket: User "${socket.user.name}" joined album room: album:${albumId}`);
    } catch (err) {
      logger.warn(`🔌 Socket join-album failed: ${err.message}`);
      socket.emit('error', { message: err.message, status: err.status || 403 });
    }
  });

  socket.on('leave-album', ({ albumId }) => {
    socket.leave(`album:${albumId}`);
    logger.info(`🔌 Socket: User "${socket.user.name}" left album room: album:${albumId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`🔌 Socket disconnected: User "${socket.user?.name || 'Unknown'}"`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`✅ Server running on http://localhost:${PORT}`);
    // Start automated daily trash cleanup job
    initTrashCleanupJob();
  });
}

module.exports = app;
