
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'smart_home_energy',
  process.env.DB_USER || 'smart_home_app',
  process.env.DB_PASSWORD || '123456',
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

module.exports = { sequelize };