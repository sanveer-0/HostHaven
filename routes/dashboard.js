const express = require('express');
const router = express.Router();
const {
    getStats,
    getRevenue,
    getOccupancy
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, getStats);
router.get('/revenue', protect, getRevenue);
router.get('/occupancy', protect, getOccupancy);

module.exports = router;
