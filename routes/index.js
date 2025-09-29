const express = require('express');
const router = express.Router();
const { User, Device, Sensor, SensorData } = require('../models');

// Dashboard homepage
router.get('/', async (req, res) => {
  try {
    const user = await User.findOne();
    const devices = await Device.findAll({ order: [['name', 'ASC']] });
    const currentData = await SensorData.findOne({
      include: [{ model: Sensor, as: 'sensor', where: { type: 'current' } }],
      order: [['timestamp', 'DESC']]
    });
    const tempData = await SensorData.findOne({
      include: [{ model: Sensor, as: 'sensor', where: { type: 'temperature' } }],
      order: [['timestamp', 'DESC']]
    });
    const humidityData = await SensorData.findOne({
      include: [{ model: Sensor, as: 'sensor', where: { type: 'humidity' } }],
      order: [['timestamp', 'DESC']]
    });
    const lightData = await SensorData.findOne({
      include: [{ model: Sensor, as: 'sensor', where: { type: 'light' } }],
      order: [['timestamp', 'DESC']]
    });
    const energyData = await SensorData.findOne({
      include: [{ model: Sensor, as: 'sensor', where: { type: 'energy' } }],
      order: [['timestamp', 'DESC']]
    });

    const data = {
      user: user,
      cards: {
        currentUsage: {
          value: `${currentData ? currentData.value.toFixed(1) : 0} ${currentData ? currentData.unit : 'A'}`,
          trend: "up",
          trendValue: "12%"
        },
        temperature: {
          value: `${tempData ? tempData.value.toFixed(1) : 0}${tempData ? tempData.unit : '°C'}`,
          humidity: `${humidityData ? humidityData.value.toFixed(0) : 0}${humidityData ? humidityData.unit : '%'}`
        },
        lightLevel: {
          value: `${lightData ? lightData.value.toFixed(0) : 0} ${lightData ? lightData.unit : 'lux'}`,
          location: "Living Room",
          status: "Optimal"
        },
        energyToday: {
          value: `${energyData ? energyData.value.toFixed(1) : 0} ${energyData ? energyData.unit : 'kWh'}`,
          cost: "$1.25",
          trend: "down",
          trendValue: "5%"
        }
      },
      devices: devices
    };

    res.render('dashboard', { data: data });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
