// ============================================================
//  ZENSUTRA — Smart Mental Health Platform
//  Backend Entry Point: server.js
//  ────────────────────────────────────────────────────────────
//  WHAT THIS FILE DOES:
//    1. Loads environment variables from .env
//    2. Creates the Express application
//    3. Mounts all global middleware (CORS, JSON parser, security headers)
//    4. Registers every API route prefix
//    5. Connects to MongoDB via Mongoose
//    6. Starts the HTTP server on the configured PORT
//
//  DATA FLOW:
//    HTTP Request → Express middleware chain → Route handler → Controller
//    → Model (MongoDB via Mongoose) → Response
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// ── 1. Load .env ─────────────────────────────────────────────
dotenv.config();

// ── 2. Create Express App ─────────────────────────────────────
const app = express();

// ── 3. Security & Middleware ──────────────────────────────────

// Helmet adds secure HTTP response headers (XSS protection, no-sniff, etc.)
app.use(helmet({
  contentSecurityPolicy: false, // disabled so frontend can load CDN resources
  crossOriginEmbedderPolicy: false,
}));

// CORS — allow your Vercel frontend and localhost dev server
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://zensutra.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger (dev = colourful, production = combined Apache format)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global rate-limiter → 200 requests per IP per 15 min
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' },
});
app.use(globalLimiter);

// Stricter limiter for auth endpoints → 20 requests per IP per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, try again later.' },
});

// ── 4. Serve static frontend files (for production) ───────────
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// ── 5. Import Routes ──────────────────────────────────────────
const {
  authRoutes, moodRoutes, aiRoutes,
  mentalHealthRoutes, appointmentRoutes,
  profileRoutes, settingsRoutes, journalRoutes,
} = require('./routes');

// ── 6. Mount Routes ───────────────────────────────────────────
// Each prefix maps to a controller group:
//   /api/auth         → register, login, OTP verify, forgot/reset password
//   /api/mood         → CRUD mood entries + ML emotion analysis
//   /api/ai           → Gemini AI chat + conversation history
//   /api/mental-health→ DASS-21 / GAD-7 / PHQ-9 assessments + reports
//   /api/appointments → book / manage counselor appointments
//   /api/user         → user profile CRUD
//   /api/settings     → account info, email change, password change, data export
//   /api/journal      → private diary entries CRUD

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/mental-health', mentalHealthRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/user', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/journal', journalRoutes);

// ── 7. Health Check ───────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'OK', platform: 'Zensutra', timestamp: new Date().toISOString() })
);

// ── 8. Catch-all → serve index.html for SPA routing ──────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── 9. Global Error Handler ───────────────────────────────────
// Catches any error thrown or passed via next(err)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── 10. Connect MongoDB & Start Server ────────────────────────
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zensutra';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('❌  MongoDB connection failed:', err.message);
  });

// Only call app.listen when running locally, Vercel handles serverless routing via exports
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () =>
    console.log(`🚀  Zensutra API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
  );
}

module.exports = app; // for testing