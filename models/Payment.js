const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'bookings',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add payment amount' },
            min: {
                args: [0],
                msg: 'Amount must be positive'
            }
        }
    },
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'card', 'upi', 'bank_transfer', 'other'),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add payment method' }
        }
    },
    transactionId: {
        type: DataTypes.STRING(255),
        defaultValue: ''
    },
    paymentDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('completed', 'pending', 'failed'),
        defaultValue: 'pending'
    },
    notes: {
        type: DataTypes.TEXT,
        defaultValue: ''
    }
}, {
    timestamps: true,
    tableName: 'payments'
});

module.exports = Payment;
