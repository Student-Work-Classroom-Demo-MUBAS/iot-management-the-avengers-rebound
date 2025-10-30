const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'iot_management',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'root',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    timezone: '+00:00',
    logging: false,
    define: {
      charset: 'utf8mb4',
      timestamps: true
    }
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL database successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

module.exports = { sequelize, testConnection };