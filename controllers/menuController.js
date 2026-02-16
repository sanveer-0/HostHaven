const { MenuItem } = require('../models');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
const getMenuItems = async (req, res) => {
    try {
        const { category, available } = req.query;

        const where = {};
        if (category) where.category = category;
        if (available !== undefined) where.isAvailable = available === 'true';

        const menuItems = await MenuItem.findAll({
            where,
            order: [['category', 'ASC'], ['name', 'ASC']]
        });

        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
const getMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByPk(req.params.id);

        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.json(menuItem);
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create menu item
// @route   POST /api/menu
// @access  Private
const createMenuItem = async (req, res) => {
    try {
        const { name, description, category, price, isAvailable, image, isVegetarian } = req.body;

        const menuItem = await MenuItem.create({
            name,
            description,
            category,
            price,
            isAvailable: isAvailable !== undefined ? isAvailable : true,
            image,
            isVegetarian: isVegetarian !== undefined ? isVegetarian : true
        });

        res.status(201).json(menuItem);
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private
const updateMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByPk(req.params.id);

        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        const { name, description, category, price, isAvailable, image, isVegetarian } = req.body;

        if (name) menuItem.name = name;
        if (description !== undefined) menuItem.description = description;
        if (category) menuItem.category = category;
        if (price) menuItem.price = price;
        if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;
        if (image !== undefined) menuItem.image = image;
        if (isVegetarian !== undefined) menuItem.isVegetarian = isVegetarian;

        await menuItem.save();

        res.json(menuItem);
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private
const deleteMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByPk(req.params.id);

        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        await menuItem.destroy();

        res.json({ message: 'Menu item deleted' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMenuItems,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem
};
