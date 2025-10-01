// models/index.js

const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

const User = require('./User')(sequelize, DataTypes);
const Device = require('./Device')(sequelize, DataTypes);
const Sensor = require('./Sensor')(sequelize, DataTypes);
const SensorData = require('./SensorData')(sequelize, DataTypes);
const EnergyUsage = require('./EnergyUsage')(sequelize, DataTypes);

// Define associations
User.hasMany(Device, { foreignKey: 'userId', as: 'devices' });
Device.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

User.hasMany(Sensor, { foreignKey: 'userId', as: 'sensors' });
Sensor.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

Device.hasMany(Sensor, { foreignKey: 'deviceId', as: 'sensors' });
Sensor.belongsTo(Device, { foreignKey: 'deviceId', as: 'device' });

Sensor.hasMany(SensorData, { foreignKey: 'sensorId', as: 'readings' });
SensorData.belongsTo(Sensor, { foreignKey: 'sensorId', as: 'sensor' });

Device.hasMany(EnergyUsage, { foreignKey: 'deviceId', as: 'energyUsage' });
EnergyUsage.belongsTo(Device, { foreignKey: 'deviceId', as: 'device' });

User.hasMany(EnergyUsage, { foreignKey: 'userId', as: 'energyUsage' });
EnergyUsage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Improved sync function
async function syncDatabase(force = false) {
  try {
    console.log('🔄 Starting database synchronization...');
    
    // Use alter for safer migrations in development when not forcing
    const syncOptions = { 
      force,
      alter: !force // Use alter if not forcing (safer for existing data)
    };
    
    await sequelize.sync(syncOptions);
    console.log('✅ Database synced successfully');
    
    // Optional: Add default admin user in development
    if (force && process.env.NODE_ENV === 'development') {
      await createDefaultData();
    }
  } catch (error) {
    console.error('❌ Error syncing database:', error.message);
    
    // In production, we don't want to crash the app due to sync issues
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️  Continuing with database sync issues in production');
    } else {
      // In development, re-throw the error for debugging
      throw error;
    }
  }
}

// Optional: Default data creation
async function createDefaultData() {
  const bcrypt = require('bcrypt');
  
  try {
    const adminExists = await User.findOne({ where: { email: 'admin@smarthome.com' } });
    if (!adminExists) {
      await User.create({
        name: 'Administrator',
        email: 'admin@smarthome.com',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin'
      });
      console.log('✅ Default admin user created');
    }
  } catch (error) {
    console.error('Error creating default data:', error);
  }
}

module.exports = {
  sequelize,
  User,
  Device,
  Sensor,
  SensorData,
  EnergyUsage,
  syncDatabase
};