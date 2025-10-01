// scripts/init-database.js
const mysql = require('mysql2/promise'); // Use promise version directly
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Default SQL schema if file doesn't exist
const DEFAULT_SCHEMA = `
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS \`smart_home_energy\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE \`smart_home_energy\`;

-- Create application user with limited privileges
CREATE USER IF NOT EXISTS 'smart_home_app'@'%' IDENTIFIED BY '${process.env.DB_PASSWORD || 'secure_password_123'}';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON \`smart_home_energy\`.* TO 'smart_home_app'@'%';
FLUSH PRIVILEGES;

-- Users table
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100) UNIQUE NOT NULL,
  \`password\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('admin', 'user') DEFAULT 'user',
  \`image\` VARCHAR(255) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_email\` (\`email\`),
  INDEX \`idx_role\` (\`role\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Devices table
CREATE TABLE IF NOT EXISTS \`devices\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`model\` VARCHAR(100) NOT NULL,
  \`location\` VARCHAR(100) NOT NULL,
  \`power\` VARCHAR(20) NOT NULL,
  \`status\` ENUM('ON', 'OFF') DEFAULT 'OFF',
  \`icon\` VARCHAR(50) NOT NULL,
  \`user_id\` INT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_user_id\` (\`user_id\`),
  INDEX \`idx_status\` (\`status\`),
  INDEX \`idx_location\` (\`location\`),
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sensors table
CREATE TABLE IF NOT EXISTS \`sensors\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`type\` ENUM('current', 'temperature', 'humidity', 'light', 'energy') NOT NULL,
  \`location\` VARCHAR(100) NOT NULL,
  \`unit\` VARCHAR(20) NOT NULL,
  \`status\` ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
  \`calibration_factor\` FLOAT DEFAULT 1.0,
  \`last_reading\` TIMESTAMP NULL,
  \`device_id\` INT NULL,
  \`user_id\` INT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_type\` (\`type\`),
  INDEX \`idx_status\` (\`status\`),
  INDEX \`idx_device_id\` (\`device_id\`),
  INDEX \`idx_user_id\` (\`user_id\`),
  FOREIGN KEY (\`device_id\`) REFERENCES \`devices\`(\`id\`) ON DELETE SET NULL,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sensor data table (unified format)
CREATE TABLE IF NOT EXISTS \`sensor_data\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sensor_id\` INT NOT NULL,
  \`type\` ENUM('current', 'temperature', 'humidity', 'light', 'energy') NOT NULL,
  \`value\` FLOAT NOT NULL,
  \`unit\` VARCHAR(20) NOT NULL,
  \`location\` VARCHAR(100) NOT NULL,
  \`timestamp\` BIGINT NOT NULL,
  \`quality\` ENUM('GOOD', 'QUESTIONABLE', 'BAD') DEFAULT 'GOOD',
  \`source\` VARCHAR(50) DEFAULT 'sensor',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_sensor_id\` (\`sensor_id\`),
  INDEX \`idx_type\` (\`type\`),
  INDEX \`idx_timestamp\` (\`timestamp\`),
  INDEX \`idx_sensor_timestamp\` (\`sensor_id\`, \`timestamp\`),
  FOREIGN KEY (\`sensor_id\`) REFERENCES \`sensors\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Energy usage table (optional, for aggregated data)
CREATE TABLE IF NOT EXISTS \`energy_usage\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`device_id\` INT NOT NULL,
  \`user_id\` INT NOT NULL,
  \`energy_kwh\` FLOAT NOT NULL,
  \`cost\` DECIMAL(10,2) NOT NULL,
  \`timestamp\` TIMESTAMP NOT NULL,
  \`duration_minutes\` INT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_device_id\` (\`device_id\`),
  INDEX \`idx_user_id\` (\`user_id\`),
  INDEX \`idx_timestamp\` (\`timestamp\`),
  FOREIGN KEY (\`device_id\`) REFERENCES \`devices\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user
INSERT IGNORE INTO \`users\` (\`name\`, \`email\`, \`password\`, \`role\`) VALUES 
('Administrator', 'admin@smarthome.com', '$2b$12$LQv3c1yqBWVHxkd0L6k0R.LCs.8S.9qmZ3TM7yTMZ2f7Qa7aQ6QaK', 'admin');

-- Insert sample devices
INSERT IGNORE INTO \`devices\` (\`name\`, \`model\`, \`location\`, \`power\`, \`status\`, \`icon\`) VALUES 
('Living Room Light', 'Smart Bulb V2', 'Living Room', '9 W', 'OFF', 'fas fa-lightbulb'),
('Air Conditioner', 'AC-3000', 'Living Room', '1500 W', 'OFF', 'fas fa-snowflake'),
('Refrigerator', 'CoolMaster 500', 'Kitchen', '200 W', 'ON', 'fas fa-refrigerator'),
('TV', 'SmartTV 4K', 'Living Room', '120 W', 'OFF', 'fas fa-tv');

-- Insert sample sensors
INSERT IGNORE INTO \`sensors\` (\`name\`, \`type\`, \`location\`, \`unit\`, \`device_id\`) VALUES 
('Main Current Sensor', 'current', 'Electrical Panel', 'A', NULL),
('Living Room Temp', 'temperature', 'Living Room', '°C', NULL),
('Living Room Humidity', 'humidity', 'Living Room', '%', NULL),
('Ambient Light Sensor', 'light', 'Living Room', 'lux', NULL),
('Energy Monitor', 'energy', 'Main Supply', 'kWh', NULL);
`;

async function initializeDatabase() {
  let connection;
  
  try {
    // Validate required environment variables
    const requiredEnvVars = ['DB_HOST', 'DB_ROOT_USER', 'DB_ROOT_PASSWORD'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    console.log('🚀 Starting database initialization...');
    console.log(`📊 Target database: ${process.env.DB_NAME || 'smart_home_energy'}`);
    console.log(`🔗 Database host: ${process.env.DB_HOST}`);

    // Create connection to MySQL server (without specifying a database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_ROOT_USER || 'root',
      password: process.env.DB_ROOT_PASSWORD || '',
      multipleStatements: true, // Allow multiple SQL statements
      connectTimeout: 10000, // 10 second timeout
      acquireTimeout: 10000,
      timeout: 10000,
    });

    console.log('✅ Connected to MySQL server successfully');

    // Read SQL initialization file or use default schema
    let sqlScript;
    const sqlFilePath = path.join(__dirname, 'init-database.sql');
    
    if (fs.existsSync(sqlFilePath)) {
      console.log('📁 Using SQL file for initialization');
      sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    } else {
      console.log('📝 Using default schema (SQL file not found)');
      sqlScript = DEFAULT_SCHEMA;
      
      // Write the default schema to file for future use
      fs.writeFileSync(sqlFilePath, DEFAULT_SCHEMA);
      console.log('💾 Default schema saved to init-database.sql');
    }

    // Replace environment variables in SQL script
    sqlScript = sqlScript.replace(/\${(.*?)}/g, (match, p1) => {
      return process.env[p1] || match;
    });

    // Split into individual statements and filter out empty lines/comments
    const statements = sqlScript
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => 
        statement.length > 0 && 
        !statement.startsWith('--') && 
        !statement.startsWith('#')
      );

    console.log(`📋 Executing ${statements.length} SQL statements...`);

    // Execute each statement with better error handling
    const results = [];
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        const [result] = await connection.execute(statement);
        results.push({ statement: i + 1, success: true, result });
        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
      } catch (error) {
        // Only ignore specific "already exists" errors
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.code === 'ER_DB_CREATE_EXISTS' ||
            error.code === 'ER_USER_ALREADY_EXISTS' ||
            error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1}: Object already exists (skipping)`);
          results.push({ statement: i + 1, skipped: true, error: error.message });
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          results.push({ statement: i + 1, success: false, error: error.message });
          // Don't throw immediately - continue to see what else can be created
        }
      }
    }

    // Check if we had any critical errors
    const criticalErrors = results.filter(r => !r.success && !r.skipped);
    
    if (criticalErrors.length > 0) {
      console.error('❌ Database initialization completed with errors:');
      criticalErrors.forEach(error => {
        console.error(`   Statement ${error.statement}: ${error.error}`);
      });
      throw new Error(`Failed to execute ${criticalErrors.length} statements`);
    }

    const successful = results.filter(r => r.success).length;
    const skipped = results.filter(r => r.skipped).length;
    
    console.log('🎉 Database initialization completed!');
    console.log(`📊 Results: ${successful} successful, ${skipped} skipped, ${criticalErrors.length} failed`);

    // Test application user connection
    await testApplicationUser();

    return {
      success: true,
      results: {
        successful,
        skipped,
        failed: criticalErrors.length,
        details: results
      }
    };

  } catch (error) {
    console.error('💥 Database initialization failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 Access denied. Please check your root credentials.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused. Please check if MySQL server is running.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('🗄️  Database error. Please check database configuration.');
    }
    
    throw error;
  } finally {
    // Close the connection
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

async function testApplicationUser() {
  try {
    console.log('🔐 Testing application user connection...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'smart_home_app',
      password: process.env.DB_PASSWORD || 'secure_password_123',
      database: process.env.DB_NAME || 'smart_home_energy',
      connectTimeout: 5000,
    });

    const [rows] = await connection.execute('SELECT 1 as test');
    
    if (rows[0].test === 1) {
      console.log('✅ Application user connection test passed');
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Application user connection test failed:', error.message);
    throw error;
  }
}

// Export for use in other modules
module.exports = initializeDatabase;

// Run if this script is called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✨ Database initialization process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Initialization failed:', error.message);
      process.exit(1);
    });
}