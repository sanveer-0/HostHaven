const express = require('express');
const router = express.Router();
const {
    getMenuItems,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem
} = require('../controllers/menuController');
const { protect } = require('../middleware/auth');

// Public routes for guests
router.get('/', getMenuItems);
router.get('/:id', getMenuItem);

// Protected routes for staff/admin
router.post('/', protect, createMenuItem);
router.put('/:id', protect, updateMenuItem);
router.delete('/:id', protect, deleteMenuItem);

module.exports = router;
