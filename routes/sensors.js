const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { validateSensorData, validateEnergyQuery } = require('../middleware/validation');

// GET /api/sensors - Get all sensors
router.get('/', async (req, res) => {
  try {
    const { Sensor } = req.app.get('models');
    
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

// GET /api/sensors/:id - Get specific sensor by ID
router.get('/:id', async (req, res) => {
  try {
    const { Sensor, SensorData } = req.app.get('models');
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

// GET /api/sensors/:id/data - Get sensor data with filtering
router.get('/:id/data', validateEnergyQuery, async (req, res) => {
  try {
    const { Sensor, SensorData } = req.app.get('models');
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
        sensor_id: id,
        ...dateFilter
      },
      order: [['timestamp', 'ASC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: sensorData,
      count: sensorData.length,
      sensor: {
        id: sensor.id,
        name: sensor.name,
        type: sensor.type,
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

// POST /api/sensors - Create a new sensor
router.post('/', async (req, res) => {
  try {
    const { Sensor } = req.app.get('models');
    const { name, type, location, unit, calibration_factor = 1.0 } = req.body;

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
      calibration_factor,
      is_active: true
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

// PUT /api/sensors/:id - Update a sensor
router.put('/:id', async (req, res) => {
  try {
    const { Sensor } = req.app.get('models');
    const { id } = req.params;
    const { name, type, location, unit, calibration_factor, is_active } = req.body;

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
    if (calibration_factor !== undefined) updateData.calibration_factor = calibration_factor;
    if (is_active !== undefined) updateData.is_active = is_active;

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

// DELETE /api/sensors/:id - Delete a sensor
router.delete('/:id', async (req, res) => {
  try {
    const { Sensor, SensorData } = req.app.get('models');
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
      where: { sensor_id: id }
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

// GET /api/sensors/stats/summary - Get sensor statistics summary
router.get('/stats/summary', async (req, res) => {
  try {
    const { Sensor, SensorData } = req.app.get('models');

    // Get all sensors with their latest reading
    const sensors = await Sensor.findAll({
      include: [{
        model: SensorData,
        as: 'readings',
        limit: 1,
        order: [['timestamp', 'DESC']]
      }],
      where: { is_active: true }
    });

    const summary = sensors.map(sensor => ({
      id: sensor.id,
      name: sensor.name,
      type: sensor.type,
      location: sensor.location,
      unit: sensor.unit,
      last_reading: sensor.readings[0] ? {
        value: sensor.readings[0].value,
        timestamp: sensor.readings[0].timestamp
      } : null,
      is_active: sensor.is_active,
      last_updated: sensor.updated_at
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

// POST /api/sensors/data/bulk - Bulk insert sensor data (for multiple sensors)
router.post('/data/bulk', async (req, res) => {
  try {
    const { Sensor, SensorData } = req.app.get('models');
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
        const { sensorType, value, unit, location } = reading;

        // Validate required fields
        if (!sensorType || value === undefined || !unit || !location) {
          errors.push({
            reading,
            error: 'Missing required fields: sensorType, value, unit, location'
          });
          continue;
        }

        // Find or create sensor
        let sensor = await Sensor.findOne({
          where: { type: sensorType, location }
        });

        if (!sensor) {
          sensor = await Sensor.create({
            name: `${sensorType} Sensor - ${location}`,
            type: sensorType,
            location: location,
            unit: unit,
            calibration_factor: 1.0,
            is_active: true
          });
        }

        // Update sensor last reading
        await sensor.update({
          last_reading: new Date(),
          last_value: value
        });

        // Create sensor data record
        const sensorData = await SensorData.create({
          sensor_id: sensor.id,
          value: value,
          unit: unit,
          location: location,
          timestamp: reading.timestamp || new Date()
        });

        results.push({
          sensor_id: sensor.id,
          data_id: sensorData.id,
          success: true
        });

        // Emit real-time update for each sensor reading
        req.app.get('io').emit('sensor-update', {
          sensorType,
          value,
          unit,
          location,
          timestamp: sensorData.timestamp,
          sensorId: sensor.id
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

// GET /api/sensors/types/count - Get count of sensors by type
router.get('/types/count', async (req, res) => {
  try {
    const { Sensor } = req.app.get('models');

    const sensorCounts = await Sensor.findAll({
      attributes: [
        'type',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['type'],
      where: { is_active: true }
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

module.exports = router;