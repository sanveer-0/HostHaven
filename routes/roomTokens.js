const express = require('express');
const router = express.Router();
const {
    generateToken,
    validateToken,
    expireToken
} = require('../controllers/roomTokenController');
const { protect } = require('../middleware/auth');

router.post('/generate', protect, generateToken);
router.get('/validate/:token', validateToken);
router.put('/expire/:bookingId', protect, expireToken);

module.exports = router;
