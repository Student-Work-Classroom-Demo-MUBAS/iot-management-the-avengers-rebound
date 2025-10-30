//index
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Initialize models
const User = require('./User')(sequelize, DataTypes);
const Device = require('./Device')(sequelize, DataTypes);
const Sensor = require('./Sensor')(sequelize, DataTypes);
const SensorData = require('./SensorData')(sequelize, DataTypes);

// Associations
Sensor.hasMany(SensorData, { foreignKey: 'sensorId', as: 'readings' });
SensorData.belongsTo(Sensor, { foreignKey: 'sensorId', as: 'sensor' });

// Sync function
async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
}

module.exports = {
  sequelize,
  User,
  Device,
  SensorData,
  Sensor,
  syncDatabase
};
