const express = require('express');
const router = express.Router();
const {
    createRequest,
    getRequests,
    getRequest,
    updateRequest,
    deleteRequest
} = require('../controllers/serviceRequestController');
const { protect } = require('../middleware/auth');

// Public route for guests to create requests (token validated in controller)
router.post('/', createRequest);

// Public route for guests to view their room's requests
router.get('/room/:roomId', getRequests);

// Protected routes for staff
router.get('/', protect, getRequests);
router.get('/:id', protect, getRequest);
router.put('/:id', protect, updateRequest);
router.delete('/:id', protect, deleteRequest);

module.exports = router;
