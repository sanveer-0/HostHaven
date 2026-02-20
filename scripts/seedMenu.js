const { MenuItem } = require('../models');

const seedMenu = async () => {
    try {
        console.log('Starting seedMenu...');
        // Check if menu already has items
        const count = await MenuItem.count();
        console.log('Current menu count:', count);

        if (count > 0) {
            console.log('Menu already seeded');
            return;
        }

        const menuItems = [
            // Breakfast
            { name: 'Idli Sambar', description: 'Steamed rice cakes with lentil soup', category: 'breakfast', price: 80, isVegetarian: true },
            { name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling', category: 'breakfast', price: 100, isVegetarian: true },
            { name: 'Poha', description: 'Flattened rice with peanuts and spices', category: 'breakfast', price: 60, isVegetarian: true },
            { name: 'Upma', description: 'Semolina porridge with vegetables', category: 'breakfast', price: 70, isVegetarian: true },
            { name: 'Paratha with Curd', description: 'Stuffed flatbread with yogurt', category: 'breakfast', price: 90, isVegetarian: true },

            // Lunch/Dinner
            { name: 'Veg Biryani', description: 'Aromatic rice with mixed vegetables', category: 'lunch', price: 150, isVegetarian: true },
            { name: 'Chicken Biryani', description: 'Fragrant rice with tender chicken', category: 'lunch', price: 200, isVegetarian: false },
            { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato gravy', category: 'dinner', price: 180, isVegetarian: true },
            { name: 'Dal Tadka', description: 'Tempered yellow lentils', category: 'lunch', price: 120, isVegetarian: true },
            { name: 'Roti (2 pcs)', description: 'Whole wheat flatbread', category: 'lunch', price: 15, isVegetarian: true },
            { name: 'Steamed Rice', description: 'Plain basmati rice', category: 'lunch', price: 50, isVegetarian: true },
            { name: 'Butter Chicken', description: 'Chicken in creamy tomato sauce', category: 'dinner', price: 220, isVegetarian: false },
            { name: 'Chole Bhature', description: 'Spiced chickpeas with fried bread', category: 'lunch', price: 130, isVegetarian: true },

            // Snacks
            { name: 'Samosa (2 pcs)', description: 'Crispy pastry with potato filling', category: 'snacks', price: 30, isVegetarian: true },
            { name: 'Pakora', description: 'Mixed vegetable fritters', category: 'snacks', price: 50, isVegetarian: true },
            { name: 'Vada Pav', description: 'Spiced potato fritter in bun', category: 'snacks', price: 40, isVegetarian: true },
            { name: 'Pav Bhaji', description: 'Spiced mashed vegetables with bread', category: 'snacks', price: 100, isVegetarian: true },
            { name: 'Aloo Tikki', description: 'Crispy potato patties', category: 'snacks', price: 60, isVegetarian: true },

            // Beverages
            { name: 'Masala Chai', description: 'Spiced Indian tea', category: 'beverages', price: 30, isVegetarian: true },
            { name: 'Filter Coffee', description: 'South Indian style coffee', category: 'beverages', price: 40, isVegetarian: true },
            { name: 'Sweet Lassi', description: 'Sweetened yogurt drink', category: 'beverages', price: 60, isVegetarian: true },
            { name: 'Mango Lassi', description: 'Mango flavored yogurt drink', category: 'beverages', price: 70, isVegetarian: true },
            { name: 'Fresh Juice', description: 'Seasonal fruit juice', category: 'beverages', price: 80, isVegetarian: true },
            { name: 'Buttermilk', description: 'Spiced yogurt drink', category: 'beverages', price: 40, isVegetarian: true }
        ];

        await MenuItem.bulkCreate(menuItems);
        console.log('✅ Menu seeded successfully with', menuItems.length, 'items');
    } catch (error) {
        console.error('❌ Error seeding menu:', error);
    }
};

module.exports = seedMenu;

if (require.main === module) {
    seedMenu();
}
