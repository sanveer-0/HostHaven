const { MenuItem } = require('../models');

const clearMenu = async () => {
    try {
        await MenuItem.destroy({ where: {}, truncate: true });
        console.log('Menu cleared');
    } catch (error) {
        console.error('Error clearing menu:', error);
    }
};

clearMenu();
