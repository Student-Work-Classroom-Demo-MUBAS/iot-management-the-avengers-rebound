const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const { User, Device, Sensor, SensorData, sequelize } = req.app.get('models');
  try {
    const user = await User.findOne();
    const devices = await Device.findAll({ order: [['name', 'ASC']] });
    const recentData = await SensorData.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    const statistics = await SensorData.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_records'],
        [sequelize.fn('AVG', sequelize.col('light_intensity')), 'avg_light'],
        [sequelize.fn('AVG', sequelize.col('temperature')), 'avg_temp'],
        [sequelize.fn('AVG', sequelize.col('humidity')), 'avg_humidity'],
        [sequelize.fn('AVG', sequelize.col('current')), 'avg_current'],
        [sequelize.fn('AVG', sequelize.col('power')), 'avg_power'],
        [sequelize.fn('MAX', sequelize.col('createdAt')), 'last_update']
      ]
    });

    // Build the data object expected by your EJS template
    res.render('dashboard', {
      data: {
        user: user ? user.get() : { name: 'Guest', role: 'User', image: '/default-user.png' },
        devices: devices.map(d => d.get()),
        cards: {
          currentUsage: {
            value: statistics ? statistics.get('avg_current')?.toFixed(3) + ' A' : '',
            trend: 'up', // You can calculate trend if you want
            trendValue: '+0.01'
          },
          temperature: {
            value: statistics ? statistics.get('avg_temp')?.toFixed(2) + ' °C' : '',
            humidity: statistics ? statistics.get('avg_humidity')?.toFixed(2) + ' %' : ''
          },
          lightLevel: {
            value: statistics ? statistics.get('avg_light')?.toFixed(2) + ' lux' : '',
            location: 'Living Room',
            status: 'Normal'
          },
          energyToday: {
            value: statistics ? statistics.get('avg_power')?.toFixed(2) + ' W' : '',
            cost: '$0.50', // Placeholder, calculate if you want
            trend: 'down',
            trendValue: '-0.02'
          }
        }
      },
      statistics: statistics ? statistics.get() : {},
      sensorData: recentData.map(d => d.get()),
      currentTime: new Date().toLocaleString()
    });
  } catch (error) {
    console.error(error);
    res.render('dashboard', {
      data: {
        user: { name: 'Guest', role: 'User', image: '/default-user.png' },
        devices: [],
        cards: {
          currentUsage: { value: 'N/A', trend: 'up', trendValue: '0' },
          temperature: { value: 'N/A', humidity: 'N/A' },
          lightLevel: { value: 'N/A', location: 'N/A', status: 'N/A' },
          energyToday: { value: 'N/A', cost: '$0.00', trend: 'down', trendValue: '0' }
        }
      },
      statistics: {},
      sensorData: [],
      currentTime: new Date().toLocaleString(),
      error: 'Failed to load sensor data from database'
    });
  }
});

module.exports = router;
