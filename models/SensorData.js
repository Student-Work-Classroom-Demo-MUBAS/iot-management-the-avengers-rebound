module.exports = (sequelize, DataTypes) => {
  const SensorData = sequelize.define('SensorData', {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    sensorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sensors', // Fixed: lowercase table name
        key: 'id'
      },
      validate: {
        notNull: true
      }
    },
    type: {
      type: DataTypes.ENUM('current', 'temperature', 'humidity', 'light', 'energy'),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['current', 'temperature', 'humidity', 'light', 'energy']]
      }
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        notNull: true,
        isFloat: true
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
    // In the SensorData model, update the timestamp field:
timestamp: { 
  type: DataTypes.BIGINT, 
  allowNull: false,
  defaultValue: () => Date.now(),
  get() {
    const rawValue = this.getDataValue('timestamp');
    return new Date(parseInt(rawValue));
  }
},
    quality: {
      type: DataTypes.ENUM('GOOD', 'QUESTIONABLE', 'BAD'),
      defaultValue: 'GOOD'
    },
    source: {
      type: DataTypes.STRING(50),
      defaultValue: 'sensor'
    }
    // REMOVED: location field (it's in the Sensor model)
  }, {
    tableName: 'sensor_data',
    timestamps: true,
    indexes: [
      {
        fields: ['sensorId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['sensorId', 'timestamp']
      }
    ]
  });

  // Instance methods
  SensorData.prototype.getFormattedValue = function() {
    switch(this.unit) {
      case '°C':
        return `${this.value.toFixed(1)}°C`;
      case '%':
        return `${this.value.toFixed(1)}%`;
      case 'W':
        return `${this.value.toFixed(2)}W`;
      case 'A':
        return `${this.value.toFixed(3)}A`;
      case 'lux':
        return `${Math.round(this.value)} lux`;
      default:
        return this.value.toString();
    }
  };

  // Hooks for data validation
  SensorData.beforeValidate((sensorData, options) => {
    if (sensorData.value !== null && sensorData.value !== undefined) {
      switch(sensorData.type) {
        case 'temperature':
          if (sensorData.value < -40 || sensorData.value > 100) {
            sensorData.quality = 'QUESTIONABLE';
          }
          break;
        case 'humidity':
          if (sensorData.value < 0 || sensorData.value > 100) {
            sensorData.quality = 'QUESTIONABLE';
          }
          break;
        case 'current':
          if (sensorData.value < 0 || sensorData.value > 100) {
            sensorData.quality = 'QUESTIONABLE';
          }
          break;
        case 'light':
          if (sensorData.value < 0 || sensorData.value > 10000) {
            sensorData.quality = 'QUESTIONABLE';
          }
          break;
        case 'energy':
          if (sensorData.value < 0 || sensorData.value > 1000) {
            sensorData.quality = 'QUESTIONABLE';
          }
          break;
      }
    }
  });

  return SensorData;
};