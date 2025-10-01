const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// Import middleware - your files export exactly what we need
const auth = require('../middleware/auth');
const { validateEnergyQuery } = require('../middleware/validation');

// Note: We're only importing validateEnergyQuery since that's what's used in this file
// validateSensorData is available but not used in your current routes

// GET /api/sensors - Get all sensors (Protected)
router.get('/', auth, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Sensor } = models;
    
    const sensors = await Sensor.findAll({
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: sensors,
      count: sensors.length
    });
  } catch (error) {
    console.error('Error fetching sensors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensors',
      message: error.message
    });
  }
});

// GET /api/sensors/:id - Get specific sensor by ID (Protected)
router.get('/:id', auth, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Sensor, SensorData } = models;
    const { id } = req.params;

    const sensor = await Sensor.findByPk(id, {
      include: [{
        model: SensorData,
        as: 'readings',
        limit: 10,
        order: [['timestamp', 'DESC']]
      }]
    });

    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: 'Sensor not found'
      });
    }

    res.json({
      success: true,
      data: sensor
    });
  } catch (error) {
    console.error('Error fetching sensor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor',
      message: error.message
    });
  }
});

// GET /api/sensors/:id/data - Get sensor data with filtering (Protected)
router.get('/:id/data', auth, validateEnergyQuery, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Sensor, SensorData } = models;
    const { id } = req.params;
    const { hours = 24, limit = 1000, startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.timestamp[Op.lte] = new Date(endDate);
    } else {
      // Default to last X hours if no specific dates provided
      dateFilter.timestamp = {
        [Op.gte]: new Date(Date.now() - hours * 60 * 60 * 1000)
      };
    }

    const sensor = await Sensor.findByPk(id);
    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: 'Sensor not found'
      });
    }

    const sensorData = await SensorData.findAll({
      where: {
        sensorId: id,
        ...dateFilter
      },
      order: [['timestamp', 'ASC']],
      limit: parseInt(limit)
    });

    // Calculate statistics
    const stats = {
      count: sensorData.length,
      average: sensorData.length > 0 ? 
        sensorData.reduce((sum, item) => sum + item.value, 0) / sensorData.length : 0,
      min: sensorData.length > 0 ? 
        Math.min(...sensorData.map(item => item.value)) : 0,
      max: sensorData.length > 0 ? 
        Math.max(...sensorData.map(item => item.value)) : 0
    };

    res.json({
      success: true,
      data: sensorData,
      statistics: stats,
      sensor: {
        id: sensor.id,
        name: sensor.name,
        type: sensor.type,
        location: sensor.location,
        unit: sensor.unit
      }
    });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor data',
      message: error.message
    });
  }
});

// POST /api/sensors - Create a new sensor (Protected)
router.post('/', auth, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Sensor } = models;
    const { name, type, location, unit, calibrationFactor = 1.0, deviceId, userId } = req.body;

    // Validate required fields
    if (!name || !type || !location || !unit) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, location, unit'
      });
    }

    // Validate sensor type
    const validTypes = ['current', 'temperature', 'humidity', 'light', 'energy'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid sensor type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const sensor = await Sensor.create({
      name,
      type,
      location,
      unit,
      calibrationFactor,
      deviceId: deviceId || null,
      userId: userId || req.user.id,
      status: 'ACTIVE'
    });

    res.status(201).json({
      success: true,
      message: 'Sensor created successfully',
      data: sensor
    });
  } catch (error) {
    console.error('Error creating sensor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sensor',
      message: error.message
    });
  }
});

// PUT /api/sensors/:id - Update a sensor (Protected)
router.put('/:id', auth, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Sensor } = models;
    const { id } = req.params;
    const { name, type, location, unit, calibrationFactor, status } = req.body;

    const sensor = await Sensor.findByPk(id);
    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: 'Sensor not found'
      });
    }

    // Update only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (location !== undefined) updateData.location = location;
    if (unit !== undefined) updateData.unit = unit;
    if (calibrationFactor !== undefined) updateData.calibrationFactor = calibrationFactor;
    if (status !== undefined) updateData.status = status;

    await sensor.update(updateData);

    res.json({
      success: true,
      message: 'Sensor updated successfully',
      data: sensor
    });
  } catch (error) {
    console.error('Error updating sensor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sensor',
      message: error.message
    });
  }
});

// DELETE /api/sensors/:id - Delete a sensor (Protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Sensor, SensorData } = models;
    const { id } = req.params;

    const sensor = await Sensor.findByPk(id);
    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: 'Sensor not found'
      });
    }

    // Delete associated sensor data first (due to foreign key constraint)
    await SensorData.destroy({
      where: { sensorId: id }
    });

    // Delete the sensor
    await sensor.destroy();

    res.json({
      success: true,
      message: 'Sensor and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sensor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete sensor',
      message: error.message
    });
  }
});

// GET /api/sensors/stats/summary - Get sensor statistics summary (Protected)
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Sensor, SensorData } = models;

    // Get all sensors with their latest reading
    const sensors = await Sensor.findAll({
      include: [{
        model: SensorData,
        as: 'readings',
        limit: 1,
        order: [['timestamp', 'DESC']]
      }],
      where: { status: 'ACTIVE' }
    });

    const summary = sensors.map(sensor => ({
      id: sensor.id,
      name: sensor.name,
      type: sensor.type,
      location: sensor.location,
      unit: sensor.unit,
      lastReading: sensor.readings[0] ? {
        value: sensor.readings[0].value,
        timestamp: sensor.readings[0].timestamp
      } : null,
      status: sensor.status,
      lastUpdated: sensor.updatedAt
    }));

    res.json({
      success: true,
      data: summary,
      count: summary.length
    });
  } catch (error) {
    console.error('Error fetching sensor summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor summary',
      message: error.message
    });
  }
});

// POST /api/sensors/data/bulk - Bulk insert sensor data (Protected)
router.post('/data/bulk', auth, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Sensor, SensorData } = models;
    const { readings } = req.body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Readings must be a non-empty array'
      });
    }

    const results = [];
    const errors = [];

    for (const reading of readings) {
      try {
        const { sensorType, value, unit, location, sensorId, timestamp = Date.now() } = reading;

        // Validate required fields
        if (!sensorType || value === undefined || !unit) {
          errors.push({
            reading,
            error: 'Missing required fields: sensorType, value, unit'
          });
          continue;
        }

        let sensor;

        // Use provided sensorId or find/create by type and location
        if (sensorId) {
          sensor = await Sensor.findByPk(sensorId);
          if (!sensor) {
            errors.push({
              reading,
              error: `Sensor with ID ${sensorId} not found`
            });
            continue;
          }
        } else if (location) {
          // Find or create sensor by type and location
          sensor = await Sensor.findOne({
            where: { type: sensorType, location }
          });

          if (!sensor) {
            sensor = await Sensor.create({
              name: `${sensorType} Sensor - ${location}`,
              type: sensorType,
              location: location,
              unit: unit,
              calibrationFactor: 1.0,
              status: 'ACTIVE',
              userId: req.user.id
            });
          }
        } else {
          errors.push({
            reading,
            error: 'Either sensorId or location must be provided'
          });
          continue;
        }

        // Create sensor data record
        const sensorData = await SensorData.create({
          sensorId: sensor.id,
          value: parseFloat(value),
          unit: unit,
          location: sensor.location,
          timestamp: timestamp
        });

        // Update sensor last reading timestamp
        await sensor.update({
          lastReading: new Date()
        });

        results.push({
          sensorId: sensor.id,
          dataId: sensorData.id,
          success: true
        });

      } catch (error) {
        errors.push({
          reading,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Processed ${results.length} readings successfully`,
      processed: results.length,
      errors: errors.length,
      details: {
        successful: results,
        failed: errors
      }
    });
  } catch (error) {
    console.error('Error processing bulk sensor data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process bulk sensor data',
      message: error.message
    });
  }
});

// GET /api/sensors/types/count - Get count of sensors by type (Protected)
router.get('/types/count', auth, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Sensor, sequelize } = models;

    const sensorCounts = await Sensor.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type'],
      where: { status: 'ACTIVE' }
    });

    res.json({
      success: true,
      data: sensorCounts
    });
  } catch (error) {
    console.error('Error fetching sensor type counts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor type counts',
      message: error.message
    });
  }
});

// GET /api/sensors/type/:type - Get sensors by type (Protected)
router.get('/type/:type', auth, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Sensor } = models;
    const { type } = req.params;

    const sensors = await Sensor.findAll({
      where: { 
        type: type,
        status: 'ACTIVE'
      },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: sensors,
      count: sensors.length
    });
  } catch (error) {
    console.error('Error fetching sensors by type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensors by type',
      message: error.message
    });
  }
});

// PATCH /api/sensors/:id/status - Update sensor status (Protected)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const models = req.app.get('models');
    const { Sensor } = models;
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be ACTIVE, INACTIVE, or MAINTENANCE'
      });
    }

    const sensor = await Sensor.findByPk(id);
    if (!sensor) {
      return res.status(404).json({
        success: false,
        error: 'Sensor not found'
      });
    }

    await sensor.update({ status });

    res.json({
      success: true,
      message: `Sensor status updated to ${status}`,
      data: sensor
    });
  } catch (error) {
    console.error('Error updating sensor status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sensor status',
      message: error.message
    });
  }
});

module.exports = router;