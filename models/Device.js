// models/Device.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Device', {
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
    }
  }, {
    tableName: 'devices',
    timestamps: true
  });
};
