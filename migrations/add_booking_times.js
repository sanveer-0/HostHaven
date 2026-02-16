const { sequelize } = require('../config/database');

async function addBookingTimeColumns() {
    try {
        console.log('Adding checkInTime and checkOutTime columns to bookings table...');

        // Add checkInTime column
        await sequelize.query(`
            ALTER TABLE bookings 
            ADD COLUMN checkInTime VARCHAR(255);
        `);
        console.log('✅ checkInTime column added');

        // Add checkOutTime column
        await sequelize.query(`
            ALTER TABLE bookings 
            ADD COLUMN checkOutTime VARCHAR(255);
        `);
        console.log('✅ checkOutTime column added');

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

addBookingTimeColumns();
