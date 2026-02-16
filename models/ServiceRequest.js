const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ServiceRequest = sequelize.define('ServiceRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    bookingId: {
        type: DataTypes.INTEGER,
        allowNull: true,  // Optional - guests may not have an active booking
        references: {
            model: 'bookings',
            key: 'id'
        }
    },
    roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'rooms',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('food', 'room_service'),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Request type is required' }
        }
    },
    items: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of items for food orders or room service requests'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    specialInstructions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
    },
    staffNotes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    requestedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'service_requests',
    timestamps: true
});

module.exports = ServiceRequest;
