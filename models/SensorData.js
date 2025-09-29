module.exports = (sequelize, DataTypes) => {
  return sequelize.define('SensorData', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    light_intensity: { type: DataTypes.FLOAT, allowNull: true },
    temperature: { type: DataTypes.FLOAT, allowNull: true },
    humidity: { type: DataTypes.FLOAT, allowNull: true },
    current: { type: DataTypes.FLOAT, allowNull: true },
    power: { type: DataTypes.FLOAT, allowNull: true },
    timestamp: { type: DataTypes.BIGINT, allowNull: false }
  }, {
    tableName: 'sensor_data'
  });
};