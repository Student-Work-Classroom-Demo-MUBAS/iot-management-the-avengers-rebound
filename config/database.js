const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'smart_home_app',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'smart_home_energy',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00', // Use UTC timezone
  charset: 'utf8mb4'
});

// Get a promise-based interface to the pool
const promisePool = pool.promise();

// Test the connection
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('Connected to MySQL database successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to MySQL database:', error.message);
    return false;
  }
};

// Helper function for queries
const query = async (sql, params = []) => {
  try {
    const [rows, fields] = await promisePool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

// Helper function for single row queries
const queryOne = async (sql, params = []) => {
  try {
    const [rows] = await promisePool.execute(sql, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

// Helper function for inserts
const insert = async (table, data) => {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const [result] = await promisePool.execute(sql, values);
    
    return result.insertId;
  } catch (error) {
    console.error('Database insert error:', error.message);
    throw error;
  }
};

// Helper function for updates
const update = async (table, data, where) => {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);
    const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const [result] = await promisePool.execute(sql, [...values, ...whereValues]);
    
    return result.affectedRows;
  } catch (error) {
    console.error('Database update error:', error.message);
    throw error;
  }
};

// Helper function for deletes
const remove = async (table, where) => {
  try {
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);
    const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
    
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const [result] = await promisePool.execute(sql, whereValues);
    
    return result.affectedRows;
  } catch (error) {
    console.error('Database delete error:', error.message);
    throw error;
  }
};

// Export the pool and helper functions
module.exports = {
  pool: promisePool,
  testConnection,
  query,
  queryOne,
  insert,
  update,
  remove
};