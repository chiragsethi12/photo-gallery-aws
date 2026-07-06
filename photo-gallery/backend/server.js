// server.js - Entry point for the Express backend
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const imageRoutes = require('./routes/imageRoutes');
const albumRoutes = require('./routes/albumRoutes');

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

// Enable Cross-Origin Resource Sharing so the React frontend can communicate
app.use(cors({
  origin: 'http://localhost:3000', // React dev server
  methods: ['GET', 'POST', 'DELETE'],
}));

// Parse incoming JSON request bodies
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

// All image-related API routes are prefixed with /api
app.use('/api', imageRoutes);
app.use('/api/albums', albumRoutes);

// Health-check route
app.get('/', (req, res) => {
  res.json({ message: 'Photo Gallery API is running 🚀' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
