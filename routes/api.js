const express = require('express');
const router = express.Router();
const { Sensor, SensorData, Device } = require('../models');
const { validateSensorData } = require('../middleware/validation');

// GET energy data for charts
router.get('/energy-data', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const energyData = await SensorData.findAll({
      where: {
        sensorId: 1, // Assuming sensorId 1 is for energy
        timestamp: {
          [Sequelize.Op.gte]: twentyFourHoursAgo
        }
      },
      order: [['timestamp', 'ASC']]
    });

    const labels = energyData.map(item => {
      const date = new Date(item.timestamp);
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    
    const data = energyData.map(item => item.value);

    res.json({ labels, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST receive sensor data
router.post('/sensor-data', validateSensorData, async (req, res) => {
  try {
    const { sensorType, value, unit, location } = req.body;
    
    // Find or create sensor
    const [sensor] = await Sensor.findOrCreate({
      where: { type: sensorType, location },
      defaults: {
        name: `${sensorType} Sensor`,
        unit,
        calibrationFactor: 1.0
      }
    });
    
    // Update sensor last reading
    await Sensor.update({
      lastReading: new Date(),
      lastValue: value
    }, {
      where: { id: sensor.id }
    });
    
    // Create sensor data record
    const sensorData = await SensorData.create({
      sensorId: sensor.id,
      value,
      unit,
      location,
      timestamp: new Date()
    });
    
    // Emit real-time update
    req.app.get('io').emit('sensor-update', {
      sensorType,
      value,
      unit,
      location,
      timestamp: sensorData.timestamp
    });

    res.status(201).json({ message: 'Sensor data saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update device status
router.put('/device/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['ON', 'OFF'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const device = await Device.findByPk(id);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    device.status = status;
    device.updatedAt = new Date();
    await device.save();

    // Emit real-time update
    req.app.get('io').emit('device-update', device);

    res.json(device);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;