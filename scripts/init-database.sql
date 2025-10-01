-- scripts/init-database.sql
-- Smart Home Energy Monitoring System Database Initialization

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `smart_home_energy` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE `smart_home_energy`;

-- Create application user with limited privileges
CREATE USER IF NOT EXISTS 'smart_home_app'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON `smart_home_energy`.* TO 'smart_home_app'@'%';
FLUSH PRIVILEGES;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') DEFAULT 'user',
  `image` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Devices table
CREATE TABLE IF NOT EXISTS `devices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `power` VARCHAR(20) NOT NULL,
  `status` ENUM('ON', 'OFF') DEFAULT 'OFF',
  `icon` VARCHAR(50) NOT NULL,
  `user_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_location` (`location`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sensors table
CREATE TABLE IF NOT EXISTS `sensors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('current', 'temperature', 'humidity', 'light', 'energy') NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `unit` VARCHAR(20) NOT NULL,
  `status` ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
  `calibration_factor` FLOAT DEFAULT 1.0,
  `last_reading` TIMESTAMP NULL,
  `device_id` INT NULL,
  `user_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_device_id` (`device_id`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sensor data table (unified format)
CREATE TABLE IF NOT EXISTS `sensor_data` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sensor_id` INT NOT NULL,
  `type` ENUM('current', 'temperature', 'humidity', 'light', 'energy') NOT NULL,
  `value` FLOAT NOT NULL,
  `unit` VARCHAR(20) NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `timestamp` BIGINT NOT NULL,
  `quality` ENUM('GOOD', 'QUESTIONABLE', 'BAD') DEFAULT 'GOOD',
  `source` VARCHAR(50) DEFAULT 'sensor',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sensor_id` (`sensor_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_timestamp` (`timestamp`),
  INDEX `idx_sensor_timestamp` (`sensor_id`, `timestamp`),
  FOREIGN KEY (`sensor_id`) REFERENCES `sensors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Energy usage table
CREATE TABLE IF NOT EXISTS `energy_usage` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `device_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `energy_kwh` FLOAT NOT NULL,
  `cost` DECIMAL(10,2) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL,
  `duration_minutes` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_device_id` (`device_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_timestamp` (`timestamp`),
  FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO `users` (`name`, `email`, `password`, `role`) VALUES 
('Administrator', 'admin@smarthome.com', '$2b$12$LQv3c1yqBWVHxkd0L6k0R.LCs.8S.9qmZ3TM7yTMZ2f7Qa7aQ6QaK', 'admin');

-- Insert sample devices
INSERT IGNORE INTO `devices` (`name`, `model`, `location`, `power`, `status`, `icon`) VALUES 
('Living Room Light', 'Smart Bulb V2', 'Living Room', '9 W', 'OFF', 'fas fa-lightbulb'),
('Air Conditioner', 'AC-3000', 'Living Room', '1500 W', 'OFF', 'fas fa-snowflake'),
('Refrigerator', 'CoolMaster 500', 'Kitchen', '200 W', 'ON', 'fas fa-refrigerator'),
('TV', 'SmartTV 4K', 'Living Room', '120 W', 'OFF', 'fas fa-tv'),
('Router', 'NetWave X1', 'Living Room', '15 W', 'ON', 'fas fa-wifi');

-- Insert sample sensors
INSERT IGNORE INTO `sensors` (`name`, `type`, `location`, `unit`, `device_id`) VALUES 
('Main Current Sensor', 'current', 'Electrical Panel', 'A', NULL),
('Living Room Temp', 'temperature', 'Living Room', '°C', NULL),
('Living Room Humidity', 'humidity', 'Living Room', '%', NULL),
('Ambient Light Sensor', 'light', 'Living Room', 'lux', NULL),
('Energy Monitor', 'energy', 'Main Supply', 'kWh', NULL),
('Kitchen Temperature', 'temperature', 'Kitchen', '°C', NULL);

-- Insert sample sensor data for testing
INSERT IGNORE INTO `sensor_data` (`sensor_id`, `type`, `value`, `unit`, `location`, `timestamp`) VALUES 
(1, 'current', 2.5, 'A', 'Electrical Panel', UNIX_TIMESTAMP(NOW() - INTERVAL 1 HOUR)),
(2, 'temperature', 22.5, '°C', 'Living Room', UNIX_TIMESTAMP(NOW() - INTERVAL 30 MINUTE)),
(3, 'humidity', 45.0, '%', 'Living Room', UNIX_TIMESTAMP(NOW() - INTERVAL 30 MINUTE)),
(4, 'light', 650.0, 'lux', 'Living Room', UNIX_TIMESTAMP(NOW() - INTERVAL 15 MINUTE)),
(5, 'energy', 1.2, 'kWh', 'Main Supply', UNIX_TIMESTAMP(NOW() - INTERVAL 1 HOUR));