const { User } = require('../models');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ where: { email: 'admin@hosthaven.com' } });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            username: 'admin',
            email: 'admin@hosthaven.com',
            password: hashedPassword,
            role: 'admin'
        });

        console.log('✅ Admin user created:');
        console.log('   Email: admin@hosthaven.com');
        console.log('   Password: admin123');
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    }
};

module.exports = seedAdmin;
