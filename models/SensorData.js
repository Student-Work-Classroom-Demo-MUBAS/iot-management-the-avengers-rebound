// models/SensorData.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('SensorData', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sensorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sensors',
        key: 'id'
      }
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'sensor_data'
  });
};
