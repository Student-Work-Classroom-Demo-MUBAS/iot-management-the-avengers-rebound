
const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { sequelize } = require('./config/database');
const { swaggerUi, swaggerSpec } = require('./config/swagger');
const swaggerUiOptions = { explorer: true };

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 3000;

// Import models
const { User, Device, Sensor, SensorData } = require('./models');

// Test database connection

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }

  // Sync database (set force to true only in development to reset tables)
  await sequelize.sync({ force: process.env.NODE_ENV === 'development' });
  console.log('Database synced successfully');
})();

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Make io accessible to routes
app.set('io', io);
app.set('models', {User, Device, Sensor, SensorData});

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/sensors', require('./routes/sensors'));
app.use('/auth', require('./routes/auth'));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection() ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Initialize database endpoint (for development)
if (process.env.NODE_ENV === 'development') {
  app.get('/init-db', async (req, res) => {
    try {
      const initializeDatabase = require('./scripts/init-database');
      await initializeDatabase();
      res.json({ message: 'Database initialized successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API documentation available at http://localhost:${port}/api-docs`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`Database initialization available at http://localhost:${port}/init-db`);
  }
});