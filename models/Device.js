const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = (sequelize, DataTypes) => {
  const Device = sequelize.define('Device', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      defaultValue: 'unknown'
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'devices'
  });

  return Device;
};
