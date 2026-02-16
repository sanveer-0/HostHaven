const { RoomToken, Booking, Room } = require('../models');
const { v4: uuidv4 } = require('uuid');

// @desc    Generate room token for a booking
// @route   POST /api/room-tokens/generate
// @access  Private
const generateToken = async (req, res) => {
    try {
        const { bookingId } = req.body;

        // Get booking details
        const booking = await Booking.findByPk(bookingId, {
            include: [{ model: Room, as: 'room' }]
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if token already exists for this booking
        let token = await RoomToken.findOne({ where: { bookingId } });

        if (token) {
            // Reactivate existing token
            token.isActive = true;
            token.expiresAt = null;
            await token.save();
        } else {
            // Create new token
            token = await RoomToken.create({
                roomId: booking.roomId,
                bookingId: booking.id,
                token: uuidv4(),
                isActive: true
            });
        }

        res.status(201).json(token);
    } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Validate room token
// @route   GET /api/room-tokens/validate/:token
// @access  Public
const validateToken = async (req, res) => {
    try {
        const { token } = req.params;

        const roomToken = await RoomToken.findOne({
            where: { token, isActive: true },
            include: [
                { model: Room, as: 'room' },
                { model: Booking, as: 'booking', include: [{ model: require('../models').Guest, as: 'guest' }] }
            ]
        });

        if (!roomToken) {
            return res.status(404).json({ message: 'Invalid or expired token' });
        }

        // Check if token has expired
        if (roomToken.expiresAt && new Date() > new Date(roomToken.expiresAt)) {
            return res.status(401).json({ message: 'Token has expired' });
        }

        res.json({
            valid: true,
            room: roomToken.room,
            booking: roomToken.booking
        });
    } catch (error) {
        console.error('Error validating token:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Expire/deactivate room token
// @route   PUT /api/room-tokens/expire/:bookingId
// @access  Private
const expireToken = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const token = await RoomToken.findOne({ where: { bookingId } });

        if (!token) {
            return res.status(404).json({ message: 'Token not found' });
        }

        token.isActive = false;
        token.expiresAt = new Date();
        await token.save();

        res.json({ message: 'Token expired successfully' });
    } catch (error) {
        console.error('Error expiring token:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    generateToken,
    validateToken,
    expireToken
};
