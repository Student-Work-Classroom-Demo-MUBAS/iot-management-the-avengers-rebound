// routes/index.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// Constants for sensor types
const SENSOR_TYPES = {
  CURRENT: 'current',
  TEMPERATURE: 'temperature', 
  HUMIDITY: 'humidity',
  LIGHT: 'light',
  ENERGY: 'energy'
};

// Helper function to get latest sensor data by type
async function getLatestSensorData(models, type) {
  const { SensorData } = models;
  try {
    return await SensorData.findOne({
      where: { type },
      order: [['timestamp', 'DESC']]
    });
  } catch (error) {
    console.error(`Error getting ${type} sensor data:`, error);
    return null;
  }
}

// Helper function to get sensor data for time range
async function getSensorDataTimeRange(models, type, hours = 24) {
  const { SensorData } = models;
  try {
    return await SensorData.findAll({
      where: {
        type,
        timestamp: {
          [Op.gte]: new Date(Date.now() - hours * 60 * 60 * 1000)
        }
      },
      order: [['timestamp', 'ASC']]
    });
  } catch (error) {
    console.error(`Error getting ${type} time range data:`, error);
    return [];
  }
}

// Common data fetching function
async function getCommonData(req) {
  try {
    const models = req.app.get('models');
    const { User, Device } = models;
    
    const [user, devices] = await Promise.all([
      User.findOne(),
      Device.findAll({ 
        order: [['name', 'ASC']],
        where: { status: { [Op.in]: ['ON', 'OFF'] } }
      })
    ]);
    
    return { user, devices };
  } catch (error) {
    console.error('Error in getCommonData:', error);
    return { user: null, devices: [] };
  }
}

// Generate mock data for development
function generateMockSensorData(type) {
  const mockData = {
    [SENSOR_TYPES.CURRENT]: { value: 2.5, unit: 'A' },
    [SENSOR_TYPES.TEMPERATURE]: { value: 22.5, unit: '°C' },
    [SENSOR_TYPES.HUMIDITY]: { value: 45, unit: '%' },
    [SENSOR_TYPES.LIGHT]: { value: 650, unit: 'lux' },
    [SENSOR_TYPES.ENERGY]: { value: 1.2, unit: 'kWh' }
  };
  
  return mockData[type] || { value: 0, unit: 'N/A' };
}

// Dashboard homepage
router.get('/', async (req, res) => {
  try {
    const models = req.app.get('models');
    const { user, devices } = await getCommonData(req);
    
    // Get all latest sensor data
    const sensorPromises = Object.values(SENSOR_TYPES).map(type => 
      getLatestSensorData(models, type)
    );
    
    const sensorData = await Promise.all(sensorPromises);
    
    // Map sensor data to usable format with fallbacks
    const [
      currentData,
      tempData, 
      humidityData,
      lightData,
      energyData
    ] = sensorData;

    // Create card data with proper fallbacks
    const cards = {
      currentUsage: {
        value: currentData ? `${currentData.value} ${currentData.unit}` : '0 A',
        trend: "up",
        trendValue: "12%",
        icon: "fas fa-bolt"
      },
      temperature: {
        value: tempData ? `${tempData.value}${tempData.unit}` : '22.5°C',
        humidity: humidityData ? `${humidityData.value}${humidityData.unit}` : '45%',
        icon: "fas fa-thermometer-half"
      },
      lightLevel: {
        value: lightData ? `${lightData.value} ${lightData.unit}` : '650 lux',
        location: lightData && lightData.location ? lightData.location : "Living Room",
        status: "Optimal",
        icon: "fas fa-lightbulb"
      },
      energyToday: {
        value: energyData ? `${energyData.value} ${energyData.unit}` : '1.2 kWh',
        cost: "$1.25",
        trend: "down",
        trendValue: "5%",
        icon: "fas fa-charging-station"
      }
    };

    const data = {
      user: user || { name: 'Smart Home User', role: 'user' },
      cards,
      devices: devices || []
    };

    res.render('dashboard', { 
      data: data, 
      currentPage: 'dashboard',
      title: 'Dashboard - Smart Home'
    });
    
  } catch (error) {
    console.error('Dashboard route error:', error);
    
    // Fallback data for error case
    const fallbackData = {
      user: { name: 'Smart Home User', role: 'user' },
      cards: {
        currentUsage: { value: '2.5 A', trend: 'up', trendValue: '12%', icon: 'fas fa-bolt' },
        temperature: { value: '22.5°C', humidity: '45%', icon: 'fas fa-thermometer-half' },
        lightLevel: { value: '650 lux', location: 'Living Room', status: 'Optimal', icon: 'fas fa-lightbulb' },
        energyToday: { value: '1.2 kWh', cost: '$1.25', trend: 'down', trendValue: '5%', icon: 'fas fa-charging-station' }
      },
      devices: []
    };
    
    res.render('dashboard', { 
      data: fallbackData, 
      currentPage: 'dashboard',
      title: 'Dashboard - Smart Home',
      error: 'Unable to load live data'
    });
  }
});

// Energy Usage Page
router.get('/energy', async (req, res) => {
  try {
    const models = req.app.get('models');
    const { user, devices } = await getCommonData(req);
    
    // Get energy data for charts
    const energyData = await getSensorDataTimeRange(models, SENSOR_TYPES.ENERGY, 24);
    
    // Format data for charts
    const chartData = {
      labels: energyData.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }),
      values: energyData.map(item => item.value)
    };

    const data = {
      user: user || { name: 'Smart Home User', role: 'user' },
      energyData: chartData,
      timeRange: '24h',
      totalEnergy: energyData.reduce((sum, item) => sum + (item.value || 0), 0).toFixed(2),
      averageEnergy: energyData.length > 0 ? 
        (energyData.reduce((sum, item) => sum + (item.value || 0), 0) / energyData.length).toFixed(2) : 0
    };

    res.render('energy', { 
      data: data, 
      currentPage: 'energy',
      title: 'Energy Usage - Smart Home'
    });
    
  } catch (error) {
    console.error('Energy route error:', error);
    res.status(500).render('error', { 
      error: 'Failed to load energy data',
      message: error.message 
    });
  }
});

// Temperature Page
router.get('/temperature', async (req, res) => {
  try {
    const models = req.app.get('models');
    const { user, devices } = await getCommonData(req);
    
    const [tempData, humidityData] = await Promise.all([
      getSensorDataTimeRange(models, SENSOR_TYPES.TEMPERATURE, 24),
      getSensorDataTimeRange(models, SENSOR_TYPES.HUMIDITY, 24)
    ]);

    const data = {
      user: user || { name: 'Smart Home User', role: 'user' },
      temperatureData: {
        labels: tempData.map(item => {
          const date = new Date(item.timestamp);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }),
        values: tempData.map(item => item.value)
      },
      humidityData: {
        labels: humidityData.map(item => {
          const date = new Date(item.timestamp);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }),
        values: humidityData.map(item => item.value)
      },
      currentTemp: tempData.length > 0 ? tempData[tempData.length - 1].value : 22.5,
      currentHumidity: humidityData.length > 0 ? humidityData[humidityData.length - 1].value : 45
    };

    res.render('temperature', { 
      data: data, 
      currentPage: 'temperature',
      title: 'Temperature & Humidity - Smart Home'
    });
    
  } catch (error) {
    console.error('Temperature route error:', error);
    res.status(500).render('error', { 
      error: 'Failed to load temperature data',
      message: error.message 
    });
  }
});

// Lighting Page
router.get('/lighting', async (req, res) => {
  try {
    const models = req.app.get('models');
    const { user, devices } = await getCommonData(req);
    
    // Filter light devices (by name containing 'light' or specific models)
    const lightDevices = devices.filter(device => 
      device.name.toLowerCase().includes('light') || 
      device.model.toLowerCase().includes('light') ||
      device.icon.includes('light')
    );

    const lightData = await getLatestSensorData(models, SENSOR_TYPES.LIGHT);

    const data = {
      user: user || { name: 'Smart Home User', role: 'user' },
      lightDevices: lightDevices,
      currentLightLevel: lightData ? {
        value: lightData.value,
        unit: lightData.unit,
        location: lightData.location || 'Living Room'
      } : { value: 650, unit: 'lux', location: 'Living Room' }
    };

    res.render('lighting', { 
      data: data, 
      currentPage: 'lighting',
      title: 'Lighting - Smart Home'
    });
    
  } catch (error) {
    console.error('Lighting route error:', error);
    res.status(500).render('error', { 
      error: 'Failed to load lighting data',
      message: error.message 
    });
  }
});

// Appliances Page
router.get('/appliances', async (req, res) => {
  try {
    const { user, devices } = await getCommonData(req);
    
    // Filter out sensors and lights to get appliances
    const appliances = devices.filter(device => 
      !device.name.toLowerCase().includes('sensor') &&
      !device.name.toLowerCase().includes('light') &&
      !device.model.toLowerCase().includes('sensor')
    );

    // Group by type for display
    const categories = {
      kitchen: appliances.filter(app => app.location?.toLowerCase().includes('kitchen')),
      living: appliances.filter(app => app.location?.toLowerCase().includes('living')),
      bedroom: appliances.filter(app => app.location?.toLowerCase().includes('bedroom')),
      other: appliances.filter(app => !app.location || 
        !['kitchen', 'living', 'bedroom'].some(room => 
          app.location.toLowerCase().includes(room)))
    };

    const data = {
      user: user || { name: 'Smart Home User', role: 'user' },
      appliances: appliances,
      categories: categories
    };

    res.render('appliances', { 
      data: data, 
      currentPage: 'appliances',
      title: 'Appliances - Smart Home'
    });
    
  } catch (error) {
    console.error('Appliances route error:', error);
    res.status(500).render('error', { 
      error: 'Failed to load appliances data',
      message: error.message 
    });
  }
});

// Settings Page
router.get('/settings', async (req, res) => {
  try {
    const { user, devices } = await getCommonData(req);
    
    const safeUser = user || { 
      name: 'Guest User', 
      email: 'guest@smarthome.com',
      role: 'user', 
      image: '/images/default-avatar.png' 
    };

    const data = {
      user: safeUser,
      totalDevices: devices.length,
      connectedDevices: devices.filter(d => d.status === 'ON').length,
      offlineDevices: devices.filter(d => d.status === 'OFF').length,
      systemInfo: {
        version: '1.0.0',
        lastUpdate: new Date().toISOString().split('T')[0],
        uptime: '99.8%'
      }
    };

    res.render('settings', { 
      data: data, 
      currentPage: 'settings',
      title: 'Settings - Smart Home'
    });
    
  } catch (error) {
    console.error('Settings route error:', error);
    res.status(500).render('error', { 
      error: 'Failed to load settings',
      message: error.message 
    });
  }
});

// Health check endpoint for frontend
router.get('/health', async (req, res) => {
  try {
    const models = req.app.get('models');
    const { sequelize } = models;
    
    // Test database connection
    await sequelize.authenticate();
    
    // Get basic counts
    const deviceCount = await models.Device.count();
    const sensorDataCount = await models.SensorData.count();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      devices: deviceCount,
      sensorReadings: sensorDataCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;