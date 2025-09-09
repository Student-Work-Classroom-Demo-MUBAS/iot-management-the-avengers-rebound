const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Data model
const SensorData = mongoose.model('SensorData', new mongoose.Schema({
  deviceId: String,
  temperature: Number,
  humidity: Number,
  airQuality: Number,
  lightLevel: Number,
  motion: Boolean,
  timestamp: { type: Date, default: Date.now }
}));

// Middleware
app.use(express.json());

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IoT Environment API',
      version: '1.0.0',
      description: 'API for Smart Environment Monitoring System',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['./app.js'], // files containing annotations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes

/**
 * @swagger
 * /api/data:
 *   post:
 *     summary: Receive sensor data from IoT device
 *     tags: [Sensor Data]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               temperature:
 *                 type: number
 *               humidity:
 *                 type: number
 *               air_quality:
 *                 type: number
 *               light_level:
 *                 type: number
 *               motion:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Data received successfully
 *       400:
 *         description: Invalid data
 */
app.post('/api/data', async (req, res) => {
  try {
    const deviceId = req.headers['device-id'];
    const { temperature, humidity, air_quality, light_level, motion } = req.body;
    
    const sensorData = new SensorData({
      deviceId,
      temperature,
      humidity,
      airQuality: air_quality,
      lightLevel: light_level,
      motion
    });
    
    await sensorData.save();
    
    // Emit real-time data to connected clients
    io.emit('newData', sensorData);
    
    res.status(200).json({ message: 'Data received successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: Retrieve historical sensor data
 *     tags: [Sensor Data]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records to return
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *         description: Data from last X hours
 *     responses:
 *       200:
 *         description: A list of sensor data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SensorData'
 */
app.get('/api/data', async (req, res) => {
  try {
    const { limit = 100, hours } = req.query;
    let query = {};
    
    if (hours) {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - parseInt(hours));
      query.timestamp = { $gte: pastDate };
    }
    
    const data = await SensorData.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

// Serve static files
app.use(express.static('public'));

// Scheduled task for data analysis (runs every hour)
cron.schedule('0 * * * *', async () => {
  try {
    // Calculate averages for the last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const avgData = await SensorData.aggregate([
      { $match: { timestamp: { $gte: oneHourAgo } } },
      { $group: {
        _id: null,
        avgTemp: { $avg: "$temperature" },
        avgHumidity: { $avg: "$humidity" },
        avgAirQuality: { $avg: "$airQuality" }
      }}
    ]);
    
    console.log('Hourly averages:', avgData[0]);
    
    // Check for alerts (example: temperature too high)
    if (avgData[0].avgTemp > 30) {
      console.log('ALERT: High temperature detected!');
      // Here you could send an email or push notification
    }
  } catch (error) {
    console.error('Error in scheduled task:', error);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});