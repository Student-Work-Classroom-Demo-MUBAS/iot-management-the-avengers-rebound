const { sequelize } = require('./models'); // Adjust the path as necessary

async function initDatabase() {
    try {
        await sequelize.sync({ force: true }); // Use force: true only for development
        console.log('Database synced successfully');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
}

initDatabase();