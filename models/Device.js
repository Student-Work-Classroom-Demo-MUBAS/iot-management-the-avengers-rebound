module.exports = (sequelize, DataTypes) => {
  const Device = sequelize.define('Device', {
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
    model: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
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
    power: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
        is: /^[0-9]+(\.[0-9]+)?\s*[Ww]$/ // Match validation pattern
      }
    },
    status: {
      type: DataTypes.ENUM('ON', 'OFF'),
      allowNull: false,
      defaultValue: 'OFF'
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50],
        is: /^fas fa-[a-z-]+$/ // Match validation pattern
      }
    },
    // ADD THIS: userId field for the association
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'devices',
    timestamps: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['location']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['userId'] // Add index for userId
      }
    ]
  });

  Device.associate = function(models) {
    // Associations are defined in models/index.js
  };

  return Device;
};