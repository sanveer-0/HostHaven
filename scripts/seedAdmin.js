const { User } = require('../models');

const seedAdmin = async () => {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ where: { email: 'admin@hosthaven.com' } });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Create admin user - pass plain password, model's beforeSave hook will hash it
        await User.create({
            username: 'admin',
            email: 'admin@hosthaven.com',
            password: 'admin123',
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
