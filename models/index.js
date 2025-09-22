const { DataTypes } = require('sequelize');

// Import models
const User = require('./User');
const Device = require('./Device')(sequalize, DataTypes);
const Sensor = require('./Sensor')(sequalize, DataTypes);
const SensorData = require('./SensorData')(sequalize, DataTypes);
const EnergyUsage = require('./EnergyUsage')(sequalize, DataTypes);

// Define associations
Sensor.hasMany(SensorData, {
  foreignKey: 'sensorId',
  as: 'readings'
});

SensorData.belongsTo(Sensor, {
  foreignKey: 'sensorId',
  as: 'sensor'
});

// Add other associations as needed

// Sync models with database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Device,
  Sensor,
  SensorData,
  EnergyUsage,
  syncDatabase
};