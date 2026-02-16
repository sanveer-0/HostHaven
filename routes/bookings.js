const express = require('express');
const router = express.Router();
const {
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    deleteBooking,
    getBookingsByRoom,
    checkoutBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getBookings)
    .post(protect, createBooking);

// Test route to verify server restart
router.get('/test-route-loaded', (req, res) => {
    res.json({ message: 'New routes loaded successfully!', timestamp: new Date().toISOString() });
});

router.route('/room/:roomId')
    .get(getBookingsByRoom);  // Public - needed for guest interface

// Checkout route
router.post('/:id/checkout', protect, checkoutBooking);

router.route('/:id')
    .get(protect, getBooking)
    .put(protect, updateBooking)
    .delete(protect, deleteBooking);

module.exports = router;
