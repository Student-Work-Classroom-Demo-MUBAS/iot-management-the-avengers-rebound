module.exports = (sequelize, DataTypes) => {
  const EnergyUsage = sequelize.define('EnergyUsage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'devices', // Fixed: lowercase table name
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Fixed: lowercase table name
        key: 'id'
      }
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    powerConsumed: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    voltage: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    current: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    cost: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'energy_usage',
    timestamps: true,
    indexes: [
      {
        fields: ['deviceId', 'timestamp']
      },
      {
        fields: ['userId'] // Add index for userId
      }
    ]
  });

  return EnergyUsage;
};