const express = require('express');
const router = express.Router();

// Constants for sensor types to avoid magic strings
const SENSOR_TYPES = {
  CURRENT: 'current',
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  LIGHT: 'light',
  ENERGY: 'energy'
};

// Helper function to get latest sensor data by type
async function getLatestSensorData(type) {
  return await SensorData.findOne({
    include: [{ 
      model: Sensor, 
      as: 'sensor', 
      where: { type } 
    }],
    order: [['timestamp', 'DESC']]
  });
}

// Format sensor value with proper units
function formatSensorValue(sensorData, fallbackUnit = '') {
  if (!sensorData) return { value: '0', unit: fallbackUnit };
  
  const value = sensorData.value;
  const unit = sensorData.unit || fallbackUnit;
  
  // Determine decimal places based on sensor type
  const decimalPlaces = [SENSOR_TYPES.CURRENT, SENSOR_TYPES.TEMPERATURE].includes(sensorData.sensor?.type) ? 1 : 0;
  
  return {
    value: value.toFixed(decimalPlaces),
    unit
  };
}

// Dashboard homepage ("/")
router.get('/', async (req, res) => {
  const { User, Device, Sensor, SensorData, sequelize } = req.app.get('models');
  try {
    // Execute all database queries in parallel for better performance
    const [
      user, 
      devices, 
      currentData, 
      tempData, 
      humidityData, 
      lightData, 
      energyData
    ] = await Promise.all([
      User.findOne(),
      Device.findAll({ order: [['name', 'ASC']] }),
      getLatestSensorData(SENSOR_TYPES.CURRENT),
      getLatestSensorData(SENSOR_TYPES.TEMPERATURE),
      getLatestSensorData(SENSOR_TYPES.HUMIDITY),
      getLatestSensorData(SENSOR_TYPES.LIGHT),
      getLatestSensorData(SENSOR_TYPES.ENERGY)
    ]);

    // Format sensor data
    const currentUsage = formatSensorValue(currentData, 'A');
    const temperature = formatSensorValue(tempData, '°C');
    const humidity = formatSensorValue(humidityData, '%');
    const lightLevel = formatSensorValue(lightData, 'lux');
    const energyToday = formatSensorValue(energyData, 'kWh');

    const data = {
      user,
      cards: {
        currentUsage: {
          value: `${currentUsage.value} ${currentUsage.unit}`,
          trend: "up",
          trendValue: "12%"
        },
        temperature: {
          value: `${temperature.value}${temperature.unit}`,
          humidity: `${humidity.value}${humidity.unit}`
        },
        lightLevel: {
          value: `${lightLevel.value} ${lightLevel.unit}`,
          location: "Living Room",
          status: "Optimal"
        },
        energyToday: {
          value: `${energyToday.value} ${energyToday.unit}`,
          cost: "$1.25",
          trend: "down",
          trendValue: "5%"
        }
      },
      devices
    };

    res.render('dashboard', { 
      activePage: 'dashboard', 
      data 
    });
  } catch (error) {
    console.error('Dashboard route error:', error);
    res.status(500).render('error', { 
      message: 'Unable to load dashboard data',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Route configuration for static pages
const routes = [
  { path: 'energy_usage', page: 'energy_usage' },
  { path: 'temperature', page: 'temperature' },
  { path: 'lighting', page: 'lighting' },
  { path: 'appliances', page: 'appliances' },
  { path: 'analytics', page: 'analytics' },
  { path: 'settings', page: 'settings' }
];

// Register routes dynamically
routes.forEach(route => {
  router.get(`/${route.path}`, (req, res) => {
    res.render(route.page, { 
      activePage: route.page, 
      data: {} 
    });
  });
});

module.exports = router;