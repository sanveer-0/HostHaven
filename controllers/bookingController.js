const { Booking, Room, Guest, RoomToken, SecondaryGuest } = require('../models');
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
                    attributes: ['name', 'email', 'phone'],
                    include: [{ model: SecondaryGuest, as: 'secondaryGuests' }]
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
                {
                    model: Guest,
                    as: 'guest',
                    include: [{ model: SecondaryGuest, as: 'secondaryGuests' }]
                },
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
        const { roomId, checkInDate, checkOutDate, secondaryGuests: secondaryGuestData } = req.body;

        // Validate dates
        if (new Date(checkOutDate) <= new Date(checkInDate)) {
            return res.status(400).json({ message: 'Check-out date must be after check-in date' });
        }

        // Check if room is available
        const roomData = await Room.findByPk(roomId);
        if (!roomData) {
            return res.status(404).json({ message: 'Room not found' });
        }
        if (roomData.status !== 'available') {
            return res.status(400).json({ message: 'Room is not available' });
        }

        // Create booking (without secondaryGuests field)
        const bookingBody = { ...req.body };
        delete bookingBody.secondaryGuests;
        const booking = await Booking.create(bookingBody);

        // Create secondary guest rows linked to the primary guest
        if (Array.isArray(secondaryGuestData) && secondaryGuestData.length > 0) {
            await Promise.all(
                secondaryGuestData.map(sg =>
                    SecondaryGuest.create({
                        guestId: booking.guestId,
                        name: sg.name,
                        age: sg.age || null,
                        idProofURL: sg.idProofURL || null
                    })
                )
            );
        }

        // Update room status
        await roomData.update({ status: 'occupied' });

        const populatedBooking = await Booking.findByPk(booking.id, {
            include: [
                {
                    model: Guest,
                    as: 'guest',
                    include: [{ model: SecondaryGuest, as: 'secondaryGuests' }]
                },
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
        const bookings = await Booking.findAll({
            where: { roomId: req.params.roomId },
            include: [
                {
                    model: Guest,
                    as: 'guest',
                    attributes: ['name', 'email', 'phone', 'address', 'idProofType', 'idProofNumber'],
                    include: [{ model: SecondaryGuest, as: 'secondaryGuests' }]
                },
                {
                    model: Room,
                    as: 'room',
                    attributes: ['roomNumber', 'type', 'pricePerNight']
                }
            ],
            order: [['checkInDate', 'DESC']]
        });

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
        // Calculate nights, forcing at least 1 night charge even for same-day checkout
        const diffDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const nights = Math.max(1, diffDays);

        const pricePerNight = parseFloat(booking.room.pricePerNight) || 0;
        const roomCharges = nights * pricePerNight;

        console.log(`Checkout calculation: CheckIn=${checkIn.toISOString()}, CheckOut=${checkOut.toISOString()}, Nights=${nights} (diff=${diffDays}), Price=${pricePerNight}, RoomCharges=${roomCharges}`);

        // Get all service requests for this booking only (not past guests)
        const serviceRequests = await ServiceRequest.findAll({
            where: {
                bookingId: booking.id,
                roomId: booking.roomId,
                status: 'completed'
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
                serviceCharges: serviceRequests.flatMap(req => {
                    const reqItems = Array.isArray(req.items) ? req.items : [];
                    // Each item in the request becomes its own invoice line
                    return reqItems.length > 0
                        ? reqItems.map(item => ({
                            description: item.name,
                            quantity: item.quantity,
                            unitPrice: item.price,
                            amount: parseFloat(item.price || 0) * parseInt(item.quantity || 1),
                            date: req.createdAt
                        }))
                        : [{
                            description: req.description || 'Room Service',
                            quantity: 1,
                            unitPrice: parseFloat(req.totalAmount || 0),
                            amount: parseFloat(req.totalAmount || 0),
                            date: req.createdAt
                        }];
                }),
                totalServiceCharges: serviceCharges
            },
            totalAmount: totalAmount
        };

        // Store invoice snapshot in payment record so it can be retrieved later
        await payment.update({ notes: JSON.stringify(invoice) });


        res.json({
            message: 'Checkout successful',
            invoice
        });
        console.log(`🧹 Wiped service requests for room ${booking.room.roomNumber} after checkout`);

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
