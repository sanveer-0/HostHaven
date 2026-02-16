const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Menu item name is required' }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category: {
        type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snacks', 'beverages'),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Category is required' }
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Price is required' },
            min: {
                args: [0],
                msg: 'Price must be positive'
            }
        }
    },
    isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    isVegetarian: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    tableName: 'menu_items',
    timestamps: true
});

module.exports = MenuItem;
