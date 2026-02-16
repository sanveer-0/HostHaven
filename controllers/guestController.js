const { Guest } = require('../models');

// @desc    Get all guests
// @route   GET /api/guests
// @access  Private
const getGuests = async (req, res) => {
    try {
        const guests = await Guest.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(guests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single guest
// @route   GET /api/guests/:id
// @access  Private
const getGuest = async (req, res) => {
    try {
        const guest = await Guest.findByPk(req.params.id);
        if (!guest) {
            return res.status(404).json({ message: 'Guest not found' });
        }
        res.json(guest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new guest
// @route   POST /api/guests
// @access  Private
const createGuest = async (req, res) => {
    try {
        const guest = await Guest.create(req.body);
        res.status(201).json(guest);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update guest
// @route   PUT /api/guests/:id
// @access  Private
const updateGuest = async (req, res) => {
    try {
        const guest = await Guest.findByPk(req.params.id);
        if (!guest) {
            return res.status(404).json({ message: 'Guest not found' });
        }

        await guest.update(req.body);
        res.json(guest);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete guest
// @route   DELETE /api/guests/:id
// @access  Private
const deleteGuest = async (req, res) => {
    try {
        const guest = await Guest.findByPk(req.params.id);
        if (!guest) {
            return res.status(404).json({ message: 'Guest not found' });
        }

        await guest.destroy();
        res.json({ message: 'Guest removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getGuests,
    getGuest,
    createGuest,
    updateGuest,
    deleteGuest
};
