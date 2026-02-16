const express = require('express');
const router = express.Router();
const {
    getGuests,
    getGuest,
    createGuest,
    updateGuest,
    deleteGuest
} = require('../controllers/guestController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getGuests)
    .post(protect, createGuest);

router.route('/:id')
    .get(protect, getGuest)
    .put(protect, updateGuest)
    .delete(protect, deleteGuest);

module.exports = router;
