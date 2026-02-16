const { Sequelize } = require('sequelize');

// SQLite configuration - no installation required!
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite', // Database file location
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ SQLite Connected: database.sqlite');

        // Sync all models - preserve existing data
        await sequelize.sync({ force: false });
        console.log('✅ Database synced');

        // Seed menu items
        const seedMenu = require('../scripts/seedMenu');
        await seedMenu();

        // Seed admin user
        const seedAdmin = require('../scripts/seedAdmin');
        await seedAdmin();

        // Seed rooms
        const seedRooms = require('../scripts/seedRooms');
        await seedRooms();
    } catch (error) {
        console.error('❌ Error: ' + error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };

