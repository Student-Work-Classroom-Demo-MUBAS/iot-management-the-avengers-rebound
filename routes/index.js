const express = require('express');
const router = express.Router();
const { Op } = require('sequelize'); // <-- Op is imported here, so we use it directly

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
      getLatestSensorData(models, SENSOR_TYPES.CURRENT),
      getLatestSensorData(models, SENSOR_TYPES.TEMPERATURE),
      getLatestSensorData(models, SENSOR_TYPES.HUMIDITY),
      getLatestSensorData(models, SENSOR_TYPES.LIGHT),
      getLatestSensorData(models, SENSOR_TYPES.ENERGY)
    ]);
    
    const current = currentData || { value: 0, unit: 'A' };
    const temp = tempData || { value: 0, unit: '°C' };
    const humidity = humidityData || { value: 0, unit: '%' };
    const light = lightData || { value: 0, unit: 'lx' };
    const energy = energyData || { value: 0, unit: 'kWh' };

    const data = {
      user,
      devices, 
      cards: {
        currentUsage: {
          value: `${current.value} ${current.unit}`, 
          trend: "up",
          trendValue: "12%"
        },
        temperature: {
          value: `${temp.value}${temp.unit}`, 
          humidity: `${humidity.value}${humidity.unit}`
        },
        lightLevel: {
          value: `${light.value} ${light.unit}`,
          location: "Living Room",
          status: "Optimal"
        },
        energyToday: {
          value: `${energy.value} ${energy.unit}`,
          cost: "$1.25",
          trend: "down",
          trendValue: "5%"
        }
      },
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
  // Removed 'sequelize' from destructuring, as we use the global 'Op' now.
  const { Sensor, SensorData } = models; 
  try {
    console.log('Starting energy route...');
    
    const { user, devices } = await getCommonData(req);
    console.log('User and devices fetched:', user ? 'yes' : 'no', devices.length);
    
    // Get energy data for charts
    const energyData24h = await SensorData.findAll({
      include: [{ model: Sensor, as: 'sensor', where: { type: SENSOR_TYPES.ENERGY } }], 
      where: {
        timestamp: {
          // FIX: Changed from [sequelize.Op.gte] to [Op.gte]
          [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000) 
        }
      },
      order: [['timestamp', 'ASC']]
    });
    
    console.log('Energy data fetched:', energyData24h.length, 'records');

    const data = {
      user: user,
      energyData: energyData24h,
      timeRange: '24h',
      devices 
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
  // Removed 'sequelize' from destructuring, as we use the global 'Op' now.
  const { Sensor, SensorData } = models; 
  try {
    const { user, devices } = await getCommonData(req);
    
    const [tempData, humidityData] = await Promise.all([
      SensorData.findAll({
        include: [{ model: Sensor, as: 'sensor', where: { type: SENSOR_TYPES.TEMPERATURE } }], 
        where: {
          timestamp: {
            // FIX: Changed from [sequelize.Op.gte] to [Op.gte]
            [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000)
          }
        },
        order: [['timestamp', 'ASC']]
      }),
      SensorData.findAll({
        include: [{ model: Sensor, as: 'sensor', where: { type: SENSOR_TYPES.HUMIDITY } }], 
        where: {
          timestamp: {
            // FIX: Changed from [sequelize.Op.gte] to [Op.gte]
            [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000)
          }
        },
        order: [['timestamp', 'ASC']]
      })
    ]);

    const data = {
      user: user,
      temperatureData: tempData,
      humidityData: humidityData,
      devices 
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

    const lightData = await getLatestSensorData(models, SENSOR_TYPES.LIGHT); 

    const data = {
      user: user,
      lightDevices: lightDevices,
      currentLightLevel: lightData,
      devices 
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
      categories: [...new Set(appliances.map(app => app.category))].filter(Boolean),
      devices 
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
      connectedDevices: devices.filter(d => d.status === 'Online').length,
      devices 
    };

    res.render('settings', { data: data, currentPage: 'settings' });
  } catch (error) {
    console.error('Settings route error:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
