const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
  // Create a connection to MySQL server (without specifying a database)
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_ROOT_USER || 'root',
    password: process.env.DB_ROOT_PASSWORD || ''
  });

  // Wrap connection in a promise
  const promiseConnection = connection.promise();

  try {
    console.log('Connecting to MySQL server...');
    
    // Read SQL initialization file
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'init-database.sql'), 
      'utf8'
    );
    
    // Split into individual statements
    const statements = sqlScript
      .split(';')
      .filter(statement => statement.trim().length > 0);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      try {
        await promiseConnection.execute(statement);
        console.log(`Executed statement ${i + 1}/${statements.length}`);
      } catch (error) {
        // Ignore errors for existing objects
        if (!error.message.includes('already exists')) {
          console.error(`Error executing statement ${i + 1}:`, error.message);
        }
      }
    }
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error.message);
  } finally {
    // Close the connection
    await promiseConnection.end();
  }
}

// Run if this script is called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;