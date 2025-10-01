module.exports = (sequelize, DataTypes) => {
  const Sensor = sequelize.define('Sensor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    type: {
      type: DataTypes.ENUM('current', 'temperature', 'humidity', 'light', 'energy'),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 20]
      }
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'ERROR'),
      defaultValue: 'ACTIVE'
    },
    calibrationFactor: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0
    },
    // ADD THESE: Foreign key fields for associations
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if sensor isn't attached to a device
      references: {
        model: 'devices',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'sensors',
    timestamps: true,
    indexes: [
      {
        fields: ['deviceId'] // This index was causing the error
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['userId']
      }
    ]
  });

  Sensor.associate = function(models) {
    // Associations are defined in models/index.js
  };

  return Sensor;
};