const express = require('express');
const router = express.Router();
const {
    getRooms,
    getAvailableRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(getRooms)  // Public - needed for guest interface
    .post(protect, createRoom);

router.get('/available', protect, getAvailableRooms);

router.route('/:id')
    .get(getRoom)  // Public - needed for guest interface
    .put(protect, updateRoom)
    .delete(protect, deleteRoom);

module.exports = router;
