const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

const User = require('./User')(sequelize, DataTypes);
const Device = require('./Device')(sequelize, DataTypes);
const Sensor = require('./Sensor')(sequelize, DataTypes);
const SensorData = require('./SensorData')(sequelize, DataTypes);
// const EnergyUsage = require('./EnergyUsage')(sequelize, DataTypes);

// Associations
Sensor.hasMany(SensorData, { foreignKey: 'sensorId', as: 'readings' });
SensorData.belongsTo(Sensor, { foreignKey: 'sensorId', as: 'sensor' });

module.exports = {
  sequelize,
  User,
  Device,
  Sensor,
  SensorData,
  // EnergyUsage
};
