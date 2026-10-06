const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const setupSocketIO = require('./sockets/socketHandler');
const { runFallbackCheck } = require('./utils/fallbackScheduler');
const { runClothFallbackCheck } = require('./utils/clothFallbackScheduler');

// Routes imports
const authRoutes = require('./routes/authRoutes');
const foodDonationRoutes = require('./routes/foodDonationRoutes');
const foodRequestRoutes = require('./routes/foodRequestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const locationRoutes = require('./routes/locationRoutes');

// Clothes Module Routes
const clothDonationRoutes = require('./routes/clothDonationRoutes');
const clothRequestRoutes = require('./routes/clothRequestRoutes');
const clothLocationRoutes = require('./routes/clothLocationRoutes');

// Explore Unified Route
const exploreRoutes = require('./routes/exploreRoutes');

// Transfer System (Phase 6)
const transferRoutes = require('./routes/transferRoutes');

// Chat System (Phase 8)
const chatRoutes = require('./routes/chatRoutes');

// Trust & Reliability System (Phase 10)
const reviewRoutes = require('./routes/reviewRoutes');

// Impact System (Phase 13)
const impactRoutes = require('./routes/impactRoutes');

// Admin System (Phase 14)
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Enable CORS for Express
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

// Enable Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
});

app.set('socketio', io);
setupSocketIO(io);

// Background Fallback & Expiry Schedulers (Runs every 30 seconds)
setInterval(() => {
  runFallbackCheck(io);
  runClothFallbackCheck(io);
}, 30000);

// Security Middleware Hardening (Phase 16)
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL injections
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 500, // limit each IP to 500 reqs per window
  message: 'Too many requests from this IP, please try again after 10 minutes'
});
app.use('/api', limiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Favicon Route Handler
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.join(__dirname, '../client/public/favicon.svg');
  res.sendFile(faviconPath, (err) => {
    if (err) {
      res.status(204).end();
    }
  });
});

// Root Route Handler
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'HungerLink backend is running',
    version: '1.0.0',
    documentation: 'Use http://localhost:5173 for web UI or /api/health for REST API status',
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'OK' : 'DEGRADED',
    database: databaseConnected ? 'connected' : 'disconnected',
    message: databaseConnected
      ? 'HungerLink Backend API Running (Food & Clothes Modules Active)'
      : 'The database is temporarily unavailable. Please try again shortly.',
  });
});

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'The database is temporarily unavailable. Please try again shortly.',
    });
  }
  next();
});

// API Routes - Food
app.use('/api/auth', authRoutes);
app.use('/api/food/donations', foodDonationRoutes);
app.use('/api/food/requests', foodRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/food/location', locationRoutes);

// API Routes - Clothes
app.use('/api/cloth/donations', clothDonationRoutes);
app.use('/api/cloth/requests', clothRequestRoutes);
app.use('/api/cloth/location', clothLocationRoutes);

// Explore unified discovery
app.use('/api/explore', exploreRoutes);

// Transfer System (Phase 6)
app.use('/api/transfer', transferRoutes);

// Chat System (Phase 8)
app.use('/api/chat', chatRoutes);

// Trust & Reliability System (Phase 10)
app.use('/api/reviews', reviewRoutes);

// Impact System (Phase 13)
app.use('/api/impact', impactRoutes);

// Admin System (Phase 14)
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[API Error]:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[HungerLink Server Running]: http://localhost:${PORT}`);
  console.log(`[Food & Clothes Fallback Schedulers Active]`);
});
