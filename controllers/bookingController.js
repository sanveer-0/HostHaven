const { Booking, Room, Guest, RoomToken } = require('../models');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            include: [
                {
                    model: Guest,
                    as: 'guest',
                    attributes: ['name', 'email', 'phone']
                },
                {
                    model: Room,
                    as: 'room',
                    attributes: ['roomNumber', 'type', 'pricePerNight']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [
                { model: Guest, as: 'guest' },
                { model: Room, as: 'room' }
            ]
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    try {
        const { roomId, checkInDate, checkOutDate } = req.body;

        // Check if room is available
        const roomData = await Room.findByPk(roomId);
        if (!roomData) {
            return res.status(404).json({ message: 'Room not found' });
        }
        if (roomData.status !== 'available') {
            return res.status(400).json({ message: 'Room is not available' });
        }

        // Create booking
        const booking = await Booking.create(req.body);

        // Update room status
        await roomData.update({ status: 'occupied' });

        const populatedBooking = await Booking.findByPk(booking.id, {
            include: [
                { model: Guest, as: 'guest' },
                { model: Room, as: 'room' }
            ]
        });

        res.status(201).json(populatedBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // If booking is being checked in, generate room token
        if (req.body.bookingStatus === 'checked-in' && booking.bookingStatus !== 'checked-in') {
            // Check if token already exists
            let token = await RoomToken.findOne({ where: { bookingId: booking.id } });

            if (token) {
                // Reactivate existing token
                token.isActive = true;
                token.expiresAt = null;
                await token.save();
            } else {
                // Create new token
                await RoomToken.create({
                    roomId: booking.roomId,
                    bookingId: booking.id,
                    token: uuidv4(),
                    isActive: true
                });
            }
        }

        // If booking is being checked out, expire token and update room status
        if (req.body.bookingStatus === 'checked-out' && booking.bookingStatus !== 'checked-out') {
            // Expire room token
            const token = await RoomToken.findOne({ where: { bookingId: booking.id } });
            if (token) {
                token.isActive = false;
                token.expiresAt = new Date();
                await token.save();
            }

            // Update room status
            await Room.update(
                { status: 'available' },
                { where: { id: booking.roomId } }
            );
        }

        await booking.update(req.body);

        const updatedBooking = await Booking.findByPk(booking.id, {
            include: [
                { model: Guest, as: 'guest' },
                { model: Room, as: 'room' }
            ]
        });

        res.json(updatedBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Make room available again
        await Room.update(
            { status: 'available' },
            { where: { id: booking.roomId } }
        );

        await booking.destroy();

        res.json({ message: 'Booking cancelled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get bookings by room
// @route   GET /api/bookings/room/:roomId
// @access  Private
const getBookingsByRoom = async (req, res) => {
    try {
        console.log('Fetching bookings for room ID:', req.params.roomId);
        const bookings = await Booking.findAll({
            where: { roomId: req.params.roomId },
            include: [
                {
                    model: Guest,
                    as: 'guest',
                    attributes: ['name', 'email', 'phone', 'address', 'idProofType', 'idProofNumber']
                },
                {
                    model: Room,
                    as: 'room',
                    attributes: ['roomNumber', 'type', 'pricePerNight']
                }
            ],
            order: [['checkInDate', 'DESC']]
        });
        console.log('Found bookings:', bookings.length);
        res.json(bookings);
    } catch (error) {
        console.error('Error in getBookingsByRoom:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Checkout booking and generate invoice
// @route   POST /api/bookings/:id/checkout
// @access  Private
const checkoutBooking = async (req, res) => {
    try {
        const { ServiceRequest, Payment } = require('../models');

        const booking = await Booking.findByPk(req.params.id, {
            include: [
                { model: Guest, as: 'guest' },
                { model: Room, as: 'room' }
            ]
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.bookingStatus === 'checked-out') {
            return res.status(400).json({ message: 'Booking already checked out' });
        }

        // Calculate stay duration and room charges
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date();
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const roomCharges = nights * parseFloat(booking.room.pricePerNight);

        // Get all service requests for this booking
        const serviceRequests = await ServiceRequest.findAll({
            where: {
                roomId: booking.roomId,
                status: 'completed' // Only include completed requests
            }
        });

        // Calculate service charges
        const serviceCharges = serviceRequests.reduce((sum, req) => {
            return sum + parseFloat(req.totalAmount || 0);
        }, 0);

        const totalAmount = roomCharges + serviceCharges;

        // Get current time in HH:MM format
        const now = new Date();
        const checkOutTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Update booking
        booking.bookingStatus = 'checked-out';
        booking.totalAmount = totalAmount;
        booking.checkOutDate = checkOut;
        booking.checkOutTime = checkOutTime; // Add checkout time
        booking.paymentStatus = 'pending';
        await booking.save();

        // Update room status
        const room = await Room.findByPk(booking.roomId);
        room.status = 'available';
        await room.save();

        // Create pending payment record
        const payment = await Payment.create({
            bookingId: booking.id,
            amount: totalAmount,
            paymentMethod: 'other',
            status: 'pending',
            paymentDate: new Date(),
            notes: `Checkout invoice - Room ${booking.room.roomNumber}`
        });

        console.log('✅ Payment created:', payment.id, 'Amount:', totalAmount, 'Status:', payment.status);

        // Generate invoice
        const invoice = {
            invoiceNumber: `INV-${booking.id}-${Date.now()}`,
            paymentId: payment.id,
            invoiceDate: new Date(),
            booking: {
                id: booking.id,
                checkInDate: booking.checkInDate,
                checkInTime: booking.checkInTime,
                checkOutDate: checkOut,
                checkOutTime: checkOutTime,
                nights: nights
            },
            guest: {
                name: booking.guest.name,
                email: booking.guest.email,
                phone: booking.guest.phone
            },
            room: {
                roomNumber: booking.room.roomNumber,
                type: booking.room.type,
                pricePerNight: booking.room.pricePerNight
            },
            charges: {
                roomCharges: {
                    description: `Room ${booking.room.roomNumber} - ${nights} night(s) @ ₹${booking.room.pricePerNight}/night`,
                    amount: roomCharges
                },
                serviceCharges: serviceRequests.map(req => ({
                    description: req.description,
                    items: req.items,
                    amount: parseFloat(req.totalAmount || 0),
                    date: req.createdAt
                })),
                totalServiceCharges: serviceCharges
            },
            totalAmount: totalAmount
        };

        res.json({
            message: 'Checkout successful',
            invoice
        });
    } catch (error) {
        console.error('Error in checkoutBooking:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    deleteBooking,
    getBookingsByRoom,
    checkoutBooking
};
