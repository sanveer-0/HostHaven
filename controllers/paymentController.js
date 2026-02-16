const { Payment, Booking, Guest, Room } = require('../models');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            include: [{
                model: Booking,
                as: 'booking',
                include: [
                    { model: Guest, as: 'guest' },
                    { model: Room, as: 'room' }
                ]
            }],
            order: [['paymentDate', 'DESC']]
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id, {
            include: [{
                model: Booking,
                as: 'booking',
                include: [
                    { model: Guest, as: 'guest' },
                    { model: Room, as: 'room' }
                ]
            }]
        });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new payment (Manual Record)
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
    try {
        const { booking, amount, paymentMethod, notes } = req.body;

        // Check if booking exists
        const bookingExists = await Booking.findByPk(booking);
        if (!bookingExists) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const payment = await Payment.create({
            bookingId: booking,
            amount,
            paymentMethod,
            notes,
            status: 'completed' // Default to completed for manual entry
        });

        res.status(201).json(payment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        await payment.update(req.body);

        const updatedPayment = await Payment.findByPk(payment.id, {
            include: [{ model: Booking, as: 'booking' }]
        });

        res.json(updatedPayment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        await payment.destroy();

        res.json({ message: 'Payment removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPayments,
    getPayment,
    createPayment,
    updatePayment,
    deletePayment
};
