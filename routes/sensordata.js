// routes/sensordata.js
const express = require('express');
const router = express.Router();

// POST endpoint to receive data from ESP32
router.post('/', async (req, res) => {
  const { SensorData } = req.app.get('models');
  try {
    // Extract data from ESP32 payload
    const { light_intensity, temperature, humidity, current, power, timestamp } = req.body;
    // Save to database (adjust fields as needed)
    await SensorData.create({ light_intensity, temperature, humidity, current, power, timestamp });
    res.status(201).json({ message: 'Data saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET endpoint to fetch all sensor data for dashboard
router.get('/', async (req, res) => {
  const { SensorData } = req.app.get('models');
  const data = await SensorData.findAll({ order: [['timestamp', 'DESC']] });
  res.json(data);
});

module.exports = router;

router.get('/latest', async (req, res) => {
  try {
    const data = await SensorData.findAll({
      order: [['timestamp', 'DESC']],
      limit: 20
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
