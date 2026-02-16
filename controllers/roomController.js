const { Room } = require('../models');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res) => {
    try {
        const rooms = await Room.findAll({
            order: [['roomNumber', 'ASC']]
        });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get available rooms
// @route   GET /api/rooms/available
// @access  Private
const getAvailableRooms = async (req, res) => {
    try {
        const rooms = await Room.findAll({
            where: { status: 'available' },
            order: [['roomNumber', 'ASC']]
        });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
const getRoom = async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res) => {
    try {
        const room = await Room.create(req.body);
        res.status(201).json(room);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private
const updateRoom = async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        await room.update(req.body);
        res.json(room);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private
const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        await room.destroy();
        res.json({ message: 'Room removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRooms,
    getAvailableRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom
};
