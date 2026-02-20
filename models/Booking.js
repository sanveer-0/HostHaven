const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    guestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'guests',
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
    checkInDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add check-in date' },
            isDate: true
        }
    },
    checkOutDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add check-out date' },
            isDate: true
        }
    },
    checkInTime: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    checkOutTime: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    numberOfGuests: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add number of guests' },
            min: {
                args: [1],
                msg: 'Number of guests must be at least 1'
            }
        }
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add total amount' },
            min: {
                args: [0],
                msg: 'Total amount must be positive'
            }
        }
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'partial', 'paid'),
        defaultValue: 'pending'
    },
    bookingStatus: {
        type: DataTypes.ENUM('confirmed', 'checked-in', 'checked-out', 'cancelled'),
        defaultValue: 'confirmed'
    },
    specialRequests: {
        type: DataTypes.TEXT,
        defaultValue: ''
    }
}, {
    timestamps: true,
    tableName: 'bookings'
});

// Validate check-out date is after check-in date
// This is enforced explicitly in createBooking, not here,
// so that checkout (which overwrites checkOutDate with now) is never blocked.

module.exports = Booking;

