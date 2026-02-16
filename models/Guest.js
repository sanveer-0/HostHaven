const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Guest = sequelize.define('Guest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add guest name' }
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            isEmail: { msg: 'Please add a valid email' },
            notEmpty: { msg: 'Please add guest email' }
        }
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add phone number' }
        }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add address' }
        }
    },
    idProofType: {
        type: DataTypes.ENUM('passport', 'driving_license', 'national_id', 'other'),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add ID proof type' }
        }
    },
    idProofNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Please add ID proof number' }
        }
    },
    checkInDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    checkOutDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'checked-out'),
        defaultValue: 'active'
    }
}, {
    timestamps: true,
    tableName: 'guests'
});

module.exports = Guest;
