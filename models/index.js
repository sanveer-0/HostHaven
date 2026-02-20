const { sequelize } = require('../config/database');
const User = require('./User');
const Guest = require('./Guest');
const Room = require('./Room');
const Booking = require('./Booking');
const Payment = require('./Payment');
const RoomToken = require('./RoomToken');
const MenuItem = require('./MenuItem');
const ServiceRequest = require('./ServiceRequest');
const SecondaryGuest = require('./SecondaryGuest');

// Define associations
Booking.belongsTo(Guest, { foreignKey: 'guestId', as: 'guest' });
Booking.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

Guest.hasMany(Booking, { foreignKey: 'guestId', as: 'bookings' });
Room.hasMany(Booking, { foreignKey: 'roomId', as: 'bookings' });

Payment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Booking.hasMany(Payment, { foreignKey: 'bookingId', as: 'payments' });

// Room Token associations
RoomToken.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
RoomToken.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Room.hasMany(RoomToken, { foreignKey: 'roomId', as: 'tokens' });
Booking.hasOne(RoomToken, { foreignKey: 'bookingId', as: 'token' });

// Service Request associations
ServiceRequest.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
ServiceRequest.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
Booking.hasMany(ServiceRequest, { foreignKey: 'bookingId', as: 'serviceRequests' });
Room.hasMany(ServiceRequest, { foreignKey: 'roomId', as: 'serviceRequests' });

// Secondary Guest associations
Guest.hasMany(SecondaryGuest, { foreignKey: 'guestId', as: 'secondaryGuests' });
SecondaryGuest.belongsTo(Guest, { foreignKey: 'guestId', as: 'primaryGuest' });

module.exports = {
    sequelize,
    User,
    Guest,
    Room,
    Booking,
    Payment,
    RoomToken,
    MenuItem,
    ServiceRequest,
    SecondaryGuest
};
