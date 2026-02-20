const { MenuItem } = require('../models');

const checkMenu = async () => {
    try {
        const count = await MenuItem.count();
        console.log(`Menu items count: ${count}`);
        if (count > 0) {
            const items = await MenuItem.findAll({ limit: 3 });
            console.log('First 3 items:', JSON.stringify(items, null, 2));
        }
    } catch (error) {
        console.error('Error checking menu:', error);
    }
};

checkMenu();
