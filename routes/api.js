const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const Device = require('../models/Device');

// GET energy data for charts
router.get('/energy-data', async (req, res) => {
  try {
    // Get energy data for the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const energyData = await SensorData.find({
      sensorType: 'energy',
      timestamp: { $gte: twentyFourHoursAgo }
    }).sort({ timestamp: 1 });

    // Format data for chart
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

// GET current sensor values
router.get('/current-values', async (req, res) => {
  try {
    // Get latest readings for all sensors
    const currentData = await SensorData.findOne({ sensorType: 'current' }).sort({ timestamp: -1 });
    const tempData = await SensorData.findOne({ sensorType: 'temperature' }).sort({ timestamp: -1 });
    const lightData = await SensorData.findOne({ sensorType: 'light' }).sort({ timestamp: -1 });
    const energyData = await SensorData.findOne({ sensorType: 'energy' }).sort({ timestamp: -1 });

    const currentValues = {
      current: `${currentData ? currentData.value.toFixed(1) : 0} ${currentData ? currentData.unit : 'A'}`,
      temperature: `${tempData ? tempData.value.toFixed(1) : 0}${tempData ? tempData.unit : '°C'}`,
      light: `${lightData ? lightData.value.toFixed(0) : 0} ${lightData ? lightData.unit : 'lux'}`,
      energy: `${energyData ? energyData.value.toFixed(1) : 0} ${energyData ? energyData.unit : 'kWh'}`
    };
    
    res.json(currentValues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST receive sensor data
router.post('/sensor-data', async (req, res) => {
  try {
    const { sensorType, value, unit, location } = req.body;
    
    // Validate input
    if (!sensorType || value === undefined || !unit || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new sensor data record
    const sensorData = new SensorData({
      sensorType,
      value,
      unit,
      location,
      timestamp: new Date()
    });

    await sensorData.save();
    
    // Emit real-time update to all connected clients
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

    const device = await Device.findByIdAndUpdate(
      id,
      { 
        status,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Emit real-time update to all connected clients
    req.app.get('io').emit('device-update', device);

    res.json(device);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
