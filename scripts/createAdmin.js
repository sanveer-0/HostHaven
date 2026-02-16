const { User } = require('../models');

async function createAdmin() {
    try {
        // Delete existing users
        await User.destroy({ where: {} });
        console.log('✓ Cleared existing users\n');

        // Create new admin - password will be auto-hashed by beforeSave hook
        const admin = await User.create({
            username: 'admin',
            email: 'admin@hosthaven.com',
            password: 'admin123',  // Will be hashed automatically
            role: 'admin'
        });

        console.log('✅ Admin user created successfully!\n');
        console.log('==========================================');
        console.log('  Email:    admin@hosthaven.com');
        console.log('  Password: admin123');
        console.log('==========================================\n');

        // Test login
        const testUser = await User.scope('withPassword').findOne({
            where: { email: 'admin@hosthaven.com' }
        });

        const isMatch = await testUser.matchPassword('admin123');
        console.log('Password test:', isMatch ? '✓ WORKS!' : '✗ FAILED');

        if (isMatch) {
            console.log('\n✅ You can now login with these credentials!\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createAdmin();
