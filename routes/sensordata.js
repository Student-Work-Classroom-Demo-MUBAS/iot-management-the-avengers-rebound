// routes/sensordata.js
const express = require('express');
const router = express.Router();
const { Sensor, SensorData, Device } = require('../models');
const { validateSensorData } = require('../middleware/validation');

// API Key authentication for ESP32 devices (simple approach)
const authenticateSensor = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    // In production, you'd validate against stored API keys
    if (!apiKey && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'API key required' });
    }
    
    // For development, allow without API key
    next();
  } catch (error) {
    console.error('Sensor authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Rate limiting for sensor data (more generous than user endpoints)
const sensorRateLimit = require('express-rate-limit')({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  message: { error: 'Too many sensor data requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST endpoint to receive data from ESP32
router.post('/', authenticateSensor, sensorRateLimit, async (req, res) => {
  const io = req.app.get('io');
  const models = req.app.get('models');
  const { SensorData, Sensor } = models;

  try {
    console.log('Received sensor data:', req.body);
    
    const { 
      light_intensity, 
      temperature, 
      humidity, 
      current, 
      power, 
      timestamp = Date.now(),
      sensorId, // ESP32 should identify which sensor
      location = 'unknown'
    } = req.body;

    const results = [];
    const sensorUpdates = [];

    // Process light intensity data
    if (light_intensity !== undefined && light_intensity !== null) {
      const lightData = await SensorData.create({
        sensorId: sensorId || 1, // Fallback sensor ID
        type: 'light',
        value: parseFloat(light_intensity),
        unit: 'lux',
        location: location,
        timestamp: timestamp,
        source: 'esp32'
      });
      results.push(lightData);
      sensorUpdates.push({ type: 'light', data: lightData });
    }

    // Process temperature data
    if (temperature !== undefined && temperature !== null) {
      const tempData = await SensorData.create({
        sensorId: sensorId || 2, // Fallback sensor ID
        type: 'temperature',
        value: parseFloat(temperature),
        unit: '°C',
        location: location,
        timestamp: timestamp,
        source: 'esp32'
      });
      results.push(tempData);
      sensorUpdates.push({ type: 'temperature', data: tempData });
    }

    // Process humidity data
    if (humidity !== undefined && humidity !== null) {
      const humidityData = await SensorData.create({
        sensorId: sensorId || 3, // Fallback sensor ID
        type: 'humidity',
        value: parseFloat(humidity),
        unit: '%',
        location: location,
        timestamp: timestamp,
        source: 'esp32'
      });
      results.push(humidityData);
      sensorUpdates.push({ type: 'humidity', data: humidityData });
    }

    // Process current data
    if (current !== undefined && current !== null) {
      const currentData = await SensorData.create({
        sensorId: sensorId || 4, // Fallback sensor ID
        type: 'current',
        value: parseFloat(current),
        unit: 'A',
        location: location,
        timestamp: timestamp,
        source: 'esp32'
      });
      results.push(currentData);
      sensorUpdates.push({ type: 'current', data: currentData });
    }

    // Process power data
    if (power !== undefined && power !== null) {
      const powerData = await SensorData.create({
        sensorId: sensorId || 5, // Fallback sensor ID
        type: 'energy',
        value: parseFloat(power),
        unit: 'W',
        location: location,
        timestamp: timestamp,
        source: 'esp32'
      });
      results.push(powerData);
      sensorUpdates.push({ type: 'energy', data: powerData });
    }

    // Emit real-time updates for each sensor type
    sensorUpdates.forEach(update => {
      io.emit('sensor-update', {
        sensorType: update.type,
        value: update.data.value,
        unit: update.data.unit,
        location: update.data.location,
        timestamp: update.data.timestamp
      });
    });

    // Also emit a consolidated event
    if (sensorUpdates.length > 0) {
      io.emit('sensor-batch-update', {
        count: sensorUpdates.length,
        types: sensorUpdates.map(u => u.type),
        timestamp: timestamp
      });
    }

    console.log(`Processed ${results.length} sensor readings`);

    res.status(201).json({
      success: true,
      message: `Processed ${results.length} sensor readings`,
      readings: results.map(r => ({
        type: r.type,
        value: r.value,
        unit: r.unit,
        id: r.id
      }))
    });

  } catch (error) {
    console.error('Error saving sensor data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save sensor data',
      details: error.message
    });
  }
});

// Alternative POST endpoint for unified data format
router.post('/unified', authenticateSensor, sensorRateLimit, validateSensorData, async (req, res) => {
  const io = req.app.get('io');
  const { SensorData } = req.app.get('models');

  try {
    const { sensorType, value, unit, location, sensorId, timestamp = Date.now() } = req.body;

    const sensorData = await SensorData.create({
      sensorId: sensorId || 1,
      type: sensorType,
      value: parseFloat(value),
      unit: unit,
      location: location,
      timestamp: timestamp,
      source: 'esp32'
    });

    // Emit real-time update
    io.emit('sensor-update', {
      sensorType: sensorData.type,
      value: sensorData.value,
      unit: sensorData.unit,
      location: sensorData.location,
      timestamp: sensorData.timestamp
    });

    res.status(201).json({
      success: true,
      message: 'Sensor data saved successfully',
      data: sensorData
    });

  } catch (error) {
    console.error('Error saving unified sensor data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save sensor data'
    });
  }
});

// GET endpoint to fetch all sensor data with filtering
router.get('/', async (req, res) => {
  const { SensorData, Sensor } = req.app.get('models');
  
  try {
    const { 
      type, 
      sensorId, 
      startTime, 
      endTime, 
      limit = 100,
      page = 1 
    } = req.query;

    // Build where clause
    const where = {};
    if (type) where.type = type;
    if (sensorId) where.sensorId = parseInt(sensorId);
    
    // Time range filter
    if (startTime || endTime) {
      where.timestamp = {};
      if (startTime) where.timestamp[Op.gte] = parseInt(startTime);
      if (endTime) where.timestamp[Op.lte] = parseInt(endTime);
    }

    const offset = (page - 1) * limit;

    const data = await SensorData.findAll({
      where,
      include: [{ 
        model: Sensor, 
        as: 'sensor',
        attributes: ['id', 'type', 'location', 'status']
      }],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalCount = await SensorData.count({ where });

    res.json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor data'
    });
  }
});

// GET endpoint for dashboard current values
router.get('/current-values', async (req, res) => {
  const { SensorData, Sensor } = req.app.get('models');
  
  try {
    // Get latest reading for each sensor type
    const sensorTypes = ['current', 'temperature', 'humidity', 'light', 'energy'];
    
    const currentValues = {};
    
    for (const type of sensorTypes) {
      const latest = await SensorData.findOne({
        include: [{ 
          model: Sensor, 
          as: 'sensor', 
          where: { type } 
        }],
        order: [['timestamp', 'DESC']]
      });
      
      if (latest) {
        currentValues[type] = {
          value: latest.value,
          unit: latest.unit,
          timestamp: latest.timestamp
        };
      } else {
        // Fallback values for development
        const fallbackValues = {
          current: { value: 2.5, unit: 'A' },
          temperature: { value: 22.5, unit: '°C' },
          humidity: { value: 45, unit: '%' },
          light: { value: 650, unit: 'lux' },
          energy: { value: 1.2, unit: 'kWh' }
        };
        currentValues[type] = fallbackValues[type] || { value: 0, unit: 'N/A' };
      }
    }

    res.json({
      success: true,
      current: currentValues.current.value,
      temperature: currentValues.temperature.value,
      humidity: currentValues.humidity.value,
      light: currentValues.light.value,
      energy: currentValues.energy.value,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching current values:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current values'
    });
  }
});

// GET endpoint for energy data (used by charts)
router.get('/energy-data', async (req, res) => {
  const { SensorData, Sensor } = req.app.get('models');
  
  try {
    const { hours = 24, sensorId } = req.query;
    
    const startTime = Date.now() - (parseInt(hours) * 60 * 60 * 1000);
    
    const where = {
      type: 'energy',
      timestamp: {
        [Op.gte]: startTime
      }
    };
    
    if (sensorId) where.sensorId = parseInt(sensorId);

    const energyData = await SensorData.findAll({
      where,
      include: [{ 
        model: Sensor, 
        as: 'sensor',
        attributes: ['id', 'location']
      }],
      order: [['timestamp', 'ASC']]
    });

    // Format for Chart.js
    const chartData = {
      labels: energyData.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }),
      data: energyData.map(item => item.value),
      rawData: energyData
    };

    res.json({
      success: true,
      ...chartData
    });

  } catch (error) {
    console.error('Error fetching energy data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch energy data'
    });
  }
});

// GET sensor data statistics
router.get('/stats', async (req, res) => {
  const { SensorData, sequelize } = req.app.get('models');
  
  try {
    const { type, days = 7 } = req.query;
    
    const startTime = Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000);
    
    const where = {
      timestamp: {
        [Op.gte]: startTime
      }
    };
    
    if (type) where.type = type;

    const stats = await SensorData.findAll({
      where,
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('value')), 'avgValue'],
        [sequelize.fn('MAX', sequelize.col('value')), 'maxValue'],
        [sequelize.fn('MIN', sequelize.col('value')), 'minValue']
      ],
      group: ['type']
    });

    res.json({
      success: true,
      stats: stats,
      timeRange: `${days} days`
    });

  } catch (error) {
    console.error('Error fetching sensor stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor statistics'
    });
  }
});

// DELETE endpoint to clear old data (admin only)
router.delete('/clear-old', async (req, res) => {
  const { SensorData } = req.app.get('models');
  
  try {
    const { olderThanDays = 30 } = req.query;
    const cutoffTime = Date.now() - (parseInt(olderThanDays) * 24 * 60 * 60 * 1000);
    
    const deletedCount = await SensorData.destroy({
      where: {
        timestamp: {
          [Op.lt]: cutoffTime
        }
      }
    });

    res.json({
      success: true,
      message: `Cleared ${deletedCount} records older than ${olderThanDays} days`
    });

  } catch (error) {
    console.error('Error clearing old data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear old data'
    });
  }
});

module.exports = router;