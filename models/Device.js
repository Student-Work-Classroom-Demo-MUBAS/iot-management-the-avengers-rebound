const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  power: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('ON', 'OFF'),
    allowNull: false,
    defaultValue: 'OFF'
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: false
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
  tableName: 'devices'
});

module.exports = Device;