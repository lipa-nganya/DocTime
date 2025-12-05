require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const { cleanupTempFiles } = require('./utils/tempFileCleanup');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy (required for Cloud Run and rate limiting)
app.set('trust proxy', true);

// Middleware
// Response compression to reduce bandwidth costs (saves ~70% on JSON/text responses)
app.use(compression({
  level: 6, // Balance between compression and CPU usage
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Configure CORS to allow all origins (for development)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'User-Agent'],
  credentials: false
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' })); // Limit request size to prevent abuse
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting to prevent abuse and reduce costs
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Apply rate limiting to all routes except health checks
app.use('/api', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/payers', require('./routes/payers'));
app.use('/api/procedures', require('./routes/procedures'));
app.use('/api/team-members', require('./routes/teamMembers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/migration', require('./routes/migration'));

// Health check (both /health and /api/health for compatibility)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server - connect to database in background to avoid blocking startup
async function startServer() {
  // Start HTTP server immediately (so Cloud Run health check passes)
  // Use callback to ensure server is listening before logging
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'production') {
      logger.info('💰 Cost-saving features enabled: compression, rate limiting, optimized logging');
    }
  });
  
  // Ensure server is listening
  server.on('listening', () => {
    logger.info(`✅ HTTP server is listening on port ${PORT}`);
  });
  
  server.on('error', (error) => {
    logger.error(`❌ Server error:`, error);
    process.exit(1);
  });
  
  // Connect to database in background (non-blocking)
  // This allows the server to start even if DB connection takes time
  (async function connectDatabase() {
    const maxRetries = 10;
    const retryDelay = 3000; // 3 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`🔄 Attempting database connection (attempt ${attempt}/${maxRetries})...`);
        await sequelize.authenticate();
        logger.info('✅ Database connection established');
        
        // Sync database - ensure all tables exist
        // In production, we sync without altering to avoid data loss
        try {
          if (process.env.NODE_ENV === 'production') {
            await sequelize.sync({ alter: false }); // Create missing tables only
            logger.info('✅ Database tables verified (production mode)');
          } else {
            await sequelize.sync({ alter: true }); // Development: alter existing tables
            logger.info('✅ Database synced (development mode)');
          }
        } catch (syncError) {
          logger.warn('⚠️ Database sync warning:', syncError.message);
          // Continue anyway - some tables might already exist
        }
        
        // Initialize temp file cleanup
        cleanupTempFiles();
        
        // Success - exit retry loop
        return;
      } catch (error) {
        logger.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          logger.info(`⏳ Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          logger.error('❌ Unable to connect to database after all retry attempts');
          logger.error('⚠️ Server is running but database is unavailable. Some features may not work.');
        }
      }
    }
  })();
}

startServer();

