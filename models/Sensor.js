const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Sensor extends Model {}

Sensor.init({
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
  }
}, {
  sequelize,
  modelName: 'Sensor',
  tableName: 'sensors'
});

module.exports = (sequelize, DataTypes) => {
  const Sensor = sequelize.define('Sensor', {
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
    }
  }, {
    tableName: 'sensors'
  });

  return Sensor;
};
