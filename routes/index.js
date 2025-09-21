const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');

// GET dashboard homepage
router.get('/', async (req, res) => {
  try {
    // Get user data
    const user = await User.findOne();
    
    // Get devices
    const devices = await Device.find().sort({ name: 1 });
    
    // Get latest sensor readings
    const currentData = await SensorData.findOne({ sensorType: 'current' }).sort({ timestamp: -1 });
    const tempData = await SensorData.findOne({ sensorType: 'temperature' }).sort({ timestamp: -1 });
    const humidityData = await SensorData.findOne({ sensorType: 'humidity' }).sort({ timestamp: -1 });
    const lightData = await SensorData.findOne({ sensorType: 'light' }).sort({ timestamp: -1 });
    const energyData = await SensorData.findOne({ sensorType: 'energy' }).sort({ timestamp: -1 });
    
    // Format data for the dashboard
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