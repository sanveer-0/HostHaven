const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Room = sequelize.define('Room', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    roomNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'Please add room number' }
        }
    },
    type: {
        type: DataTypes.ENUM('single', 'double', 'suite', 'deluxe', 'family'),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add room type' }
        }
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add room capacity' },
            min: {
                args: [1],
                msg: 'Capacity must be at least 1'
            }
        }
    },
    pricePerNight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add price per night' },
            min: {
                args: [0],
                msg: 'Price must be positive'
            }
        }
    },
    amenities: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM('available', 'occupied', 'maintenance'),
        defaultValue: 'available'
    },
    images: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: ''
    }
}, {
    timestamps: true,
    tableName: 'rooms'
});

module.exports = Room;
