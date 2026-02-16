const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Reports route is working!' });
});

// Generate booking report (temporarily without auth for testing)
router.get('/bookings', reportController.generateBookingReport);

module.exports = router;
