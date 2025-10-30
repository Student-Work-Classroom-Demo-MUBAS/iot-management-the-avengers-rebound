module.exports = (sequelize, DataTypes) => {
  const SensorData = sequelize.define('SensorData', {
    light_intensity: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    humidity: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    current: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    power: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    sensorId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'sensor_data'
  });

  return SensorData;
};
