const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SecondaryGuest = sequelize.define('SecondaryGuest', {
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
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Secondary guest name is required' }
        }
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    idProofURL: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'secondary_guests'
});

module.exports = SecondaryGuest;
