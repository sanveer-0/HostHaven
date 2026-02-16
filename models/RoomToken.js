const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RoomToken = sequelize.define('RoomToken', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'rooms',
            key: 'id'
        }
    },
    bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'bookings',
            key: 'id'
        }
    },
    token: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'room_tokens',
    timestamps: true
});

module.exports = RoomToken;
