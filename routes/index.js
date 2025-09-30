const express = require('express');
const router = express.Router();
const { Op } = require('sequelize'); // <-- Add this line

// Constants for sensor types to avoid magic strings
const SENSOR_TYPES = {
  CURRENT: 'current',
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  LIGHT: 'light',
  ENERGY: 'energy'
};

// Helper function to get latest sensor data by type
async function getLatestSensorData(models, type) {
  const { Sensor, SensorData } = models;
  return await SensorData.findOne({
    include: [{ 
      model: Sensor, 
      as: 'sensor', 
      where: { type } 
    }],
    order: [['timestamp', 'DESC']]
  });
}

// Common data fetching function
async function getCommonData(req) {
  const { User, Device } = req.app.get('models');
  const user = await User.findOne();
  const devices = await Device.findAll({ order: [['name', 'ASC']] });
  return { user, devices };

} 

// Dashboard homepage ("/")
router.get('/', async (req, res) => {
  const models = req.app.get('models');
  try {
    const { user, devices } = await getCommonData(req);
    
    // Get all sensor data
    const [
      currentData,
      tempData,
      humidityData,
      lightData,
      energyData
    ] = await Promise.all([
      getLatestSensorData(models, 'current'),
      getLatestSensorData(models, 'temperature'),
      getLatestSensorData(models, 'humidity'),
      getLatestSensorData(models, 'light'),
      getLatestSensorData(models, 'energy')
    ]);

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

    res.render('dashboard', { data: data, currentPage: 'dashboard' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Energy Usage Page
router.get('/energy', async (req, res) => {
  const models = req.app.get('models');
  const { Sensor, SensorData, sequelize } = models;
  try {
    console.log('Starting energy route...');
    
    const { user, devices } = await getCommonData(req);
    console.log('User and devices fetched:', user ? 'yes' : 'no', devices.length);
    
    // Get energy data for charts
    const energyData24h = await SensorData.findAll({
      include: [{ model: Sensor, as: 'sensor', where: { type: 'energy' } }],
      where: {
        timestamp: {
          [sequelize.Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000)
        }
      },
      order: [['timestamp', 'ASC']]
    });
    
    console.log('Energy data fetched:', energyData24h.length, 'records');

    const data = {
      user: user,
      energyData: energyData24h,
      timeRange: '24h'
    };

    console.log('Rendering energy page...');
    res.render('energy', { data: data, currentPage: 'energy' });
    
  } catch (error) {
    console.error('ERROR in energy route:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Something went wrong!',
      details: error.message 
    });
  }
});

// Temperature Page
router.get('/temperature', async (req, res) => {
  const models = req.app.get('models');
  const { Sensor, SensorData, sequelize } = models;
  try {
    const { user, devices } = await getCommonData(req);
    
    const [tempData, humidityData] = await Promise.all([
      SensorData.findAll({
        include: [{ model: Sensor, as: 'sensor', where: { type: 'temperature' } }],
        where: {
          timestamp: {
            [sequelize.Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000)
          }
        },
        order: [['timestamp', 'ASC']]
      }),
      SensorData.findAll({
        include: [{ model: Sensor, as: 'sensor', where: { type: 'humidity' } }],
        where: {
          timestamp: {
            [sequelize.Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000)
          }
        },
        order: [['timestamp', 'ASC']]
      })
    ]);

    const data = {
      user: user,
      temperatureData: tempData,
      humidityData: humidityData
    };

    res.render('temperature', { data: data, currentPage: 'temperature' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Lighting Page
router.get('/lighting', async (req, res) => {
  const models = req.app.get('models');
  const { Device, Sensor, SensorData } = models;
  try {
    const { user, devices } = await getCommonData(req);
    
    const lightDevices = devices.filter(device => 
      device.type === 'light' || device.name.toLowerCase().includes('light')
    );

    const lightData = await getLatestSensorData(models, 'light');

    const data = {
      user: user,
      lightDevices: lightDevices,
      currentLightLevel: lightData
    };

    res.render('lighting', { data: data, currentPage: 'lighting' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Appliances Page
router.get('/appliances', async (req, res) => {
  try {
    const { user, devices } = await getCommonData(req);
    
    // Categorize devices
    const appliances = devices.filter(device => 
      !['light', 'sensor'].includes(device.type)
    );

    const data = {
      user: user,
      appliances: appliances,
      categories: [...new Set(appliances.map(app => app.category))].filter(Boolean)
    };

    res.render('appliances', { data: data, currentPage: 'appliances' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


// Settings Page
router.get('/settings', async (req, res) => {
  try {
    const { user, devices } = await getCommonData(req);
    
    // Provide fallback if user is null
    const safeUser = user || { 
      name: 'Guest User', 
      role: 'Administrator', 
      image: '/images/default-avatar.png' 
    };

    const data = {
      user: safeUser,
      totalDevices: devices.length,
      connectedDevices: devices.filter(d => d.status === 'Online').length
    };

    res.render('settings', { data: data, currentPage: 'settings' });
  } catch (error) {
    console.error('Settings route error:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;

