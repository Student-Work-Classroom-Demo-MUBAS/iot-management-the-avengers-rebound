const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sensor = sequelize.define('Sensor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('current', 'temperature', 'humidity', 'light', 'energy', 'power'),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  calibrationFactor: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1.0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  lastReading: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastValue: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'sensors'
});

module.exports = Sensor;