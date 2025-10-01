// app.js
const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import configurations
const { testConnection } = require('./config/database');
const { swaggerSpec } = require('./config/swagger');
const swaggerUi = require('swagger-ui-express');

// Import models
const { User, Device, Sensor, SensorData, EnergyUsage, syncDatabase } = require('./models');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
      : ['http://localhost:3000', 'http://localhost:8080'],
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// More specific rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'smart-home-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// CSRF protection
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply CSRF to all routes except API and webhooks
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/webhook/')) {
    return next();
  }
  csrfProtection(req, res, next);
});

// Static files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
  etag: true,
  lastModified: true
}));

// Make io accessible to routes
app.set('io', io);
app.set('models', { User, Device, Sensor, SensorData, EnergyUsage });

// Add CSRF token to all views
app.use((req, res, next) => {
  if (typeof req.csrfToken === 'function') {
    res.locals.csrfToken = req.csrfToken();
  }
  res.locals.currentYear = new Date().getFullYear();
  res.locals.nodeEnv = process.env.NODE_ENV;
  next();
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection and synchronization
(async () => {
  try {
    console.log('Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    console.log('Database connection successful');
    
    const forceSync = process.env.NODE_ENV === 'development' && process.env.FORCE_SYNC === 'true';
    if (forceSync) {
      console.log('Force syncing database...');
    }
    
    await syncDatabase(forceSync);
    console.log('Database synchronization completed');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
})();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined their room`);
  });
  
  socket.on('sensor-data', (data) => {
    socket.broadcast.emit('sensor-update', data);
  });
  
  socket.on('device-control', (data) => {
    io.emit('device-update', data);
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`🔌 User disconnected: ${socket.id} (${reason})`);
  });
  
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Routes
app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/sensors', require('./routes/sensors'));
app.use('/api/sensordata', require('./routes/sensordata'));
app.use('/auth', authLimiter, require('./routes/auth'));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Smart Home API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true
  }
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection() ? 'connected' : 'disconnected';
    
    res.json({
      status: 'healthy',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System status endpoint
app.get('/status', async (req, res) => {
  try {
    const { Sensor, Device, SensorData } = app.get('models');
    
    const [sensorCount, deviceCount, recentDataCount] = await Promise.all([
      Sensor.count(),
      Device.count(),
      SensorData.count({
        where: {
          timestamp: {
            [require('sequelize').Op.gte]: Date.now() - 24 * 60 * 60 * 1000
          }
        }
      })
    ]);
    
    res.json({
      system: 'operational',
      sensors: sensorCount,
      devices: deviceCount,
      readingsLast24h: recentDataCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      system: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Initialize database endpoint (for development)
if (process.env.NODE_ENV === 'development') {
  app.get('/init-db', async (req, res) => {
    try {
      const initializeDatabase = require('./scripts/init-database');
      await initializeDatabase();
      res.json({ 
        success: true,
        message: 'Database initialized successfully' 
      });
    } catch (error) {
      console.error('Database initialization error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
}

// Webhook endpoint for ESP32 devices
app.post('/webhook/sensor-data', express.json(), async (req, res) => {
  try {
    const { SensorData } = app.get('models');
    const io = app.get('io');
    
    const { sensorType, value, unit, location, sensorId, timestamp = Date.now() } = req.body;
    
    if (!sensorType || value === undefined || !unit) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sensorType, value, unit'
      });
    }
    
    const sensorData = await SensorData.create({
      sensorId: sensorId || 1,
      type: sensorType,
      value: parseFloat(value),
      unit: unit,
      location: location || 'unknown',
      timestamp: timestamp,
      source: 'webhook'
    });
    
    io.emit('sensor-update', {
      sensorType: sensorData.type,
      value: sensorData.value,
      unit: sensorData.unit,
      location: sensorData.location,
      timestamp: sensorData.timestamp
    });
    
    res.json({
      success: true,
      message: 'Sensor data received and processed',
      id: sensorData.id
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process sensor data'
    });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      message: 'Form submission failed. Please refresh the page and try again.'
    });
  }
  
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      message: 'A record with this information already exists.'
    });
  }
  
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler - FIXED: Removed the '*' pattern
app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).render('error', {
      title: 'Page Not Found - Smart Home',
      error: {
        status: 404,
        message: 'The page you are looking for does not exist.'
      }
    });
  } else if (req.accepts('json')) {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      path: req.originalUrl
    });
  } else {
    res.status(404).send('Not found');
  }
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`\n${signal} received, starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('HTTP server closed');
    console.log('Database connections closed');
    console.log('Graceful shutdown completed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.log('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Start server
server.listen(port, () => {
  console.log(`
Smart Home Energy Monitoring System Started!
Server running at http://localhost:${port}
API documentation available at http://localhost:${port}/api-docs
Environment: ${process.env.NODE_ENV || 'development'}
  `);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Database initialization available at http://localhost:${port}/init-db`);
    console.log(`Health check available at http://localhost:${port}/health`);
  }
});

module.exports = { app, server, io };