const { ServiceRequest, Booking, Room, Guest } = require('../models');

// @desc    Create new service request
// @route   POST /api/service-requests
// @access  Public (with token)
const createRequest = async (req, res) => {
    try {
        const { bookingId, roomId, type, items, description, specialInstructions, totalAmount } = req.body;

        console.log('📝 Creating service request:', { bookingId, roomId, type, description, totalAmount });

        const request = await ServiceRequest.create({
            bookingId,
            roomId,
            type,
            items,
            description,
            specialInstructions,
            totalAmount: totalAmount || 0,
            status: 'pending'
        });

        console.log('✅ Service request created:', request.id, 'Type:', type);

        // If there's a charge, add it to the booking's total amount
        if (totalAmount && totalAmount > 0) {
            const booking = await Booking.findByPk(bookingId);
            if (booking) {
                booking.totalAmount = parseFloat(booking.totalAmount) + parseFloat(totalAmount);
                await booking.save();
            }
        }

        res.status(201).json(request);
    } catch (error) {
        console.error('❌ Error creating service request:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all service requests
// @route   GET /api/service-requests
// @access  Private
const getRequests = async (req, res) => {
    try {
        const { status, type, roomId: queryRoomId } = req.query;
        const { roomId: paramRoomId } = req.params;

        const where = {};
        if (status) where.status = status;
        if (type) where.type = type;
        // Use roomId from params if available (for public guest route), otherwise from query
        if (paramRoomId || queryRoomId) where.roomId = paramRoomId || queryRoomId;

        const requests = await ServiceRequest.findAll({
            where,
            include: [
                {
                    model: Room,
                    as: 'room',
                    attributes: ['id', 'roomNumber', 'type']
                },
                {
                    model: Booking,
                    as: 'booking',
                    include: [{
                        model: Guest,
                        as: 'guest',
                        attributes: ['name', 'email', 'phone']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(requests);
    } catch (error) {
        console.error('Error fetching service requests:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single service request
// @route   GET /api/service-requests/:id
// @access  Private
const getRequest = async (req, res) => {
    try {
        const request = await ServiceRequest.findByPk(req.params.id, {
            include: [
                { model: Room, as: 'room' },
                {
                    model: Booking,
                    as: 'booking',
                    include: [{ model: Guest, as: 'guest' }]
                }
            ]
        });

        if (!request) {
            return res.status(404).json({ message: 'Service request not found' });
        }

        res.json(request);
    } catch (error) {
        console.error('Error fetching service request:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update service request status
// @route   PUT /api/service-requests/:id
// @access  Private
const updateRequest = async (req, res) => {
    try {
        const { status, staffNotes } = req.body;

        const request = await ServiceRequest.findByPk(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Service request not found' });
        }

        if (status) request.status = status;
        if (staffNotes !== undefined) request.staffNotes = staffNotes;

        if (status === 'completed') {
            request.completedAt = new Date();
        }

        await request.save();

        res.json(request);
    } catch (error) {
        console.error('Error updating service request:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete service request
// @route   DELETE /api/service-requests/:id
// @access  Private
const deleteRequest = async (req, res) => {
    try {
        const request = await ServiceRequest.findByPk(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Service request not found' });
        }

        await request.destroy();

        res.json({ message: 'Service request deleted' });
    } catch (error) {
        console.error('Error deleting service request:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Clear all requests for a room
// @route   DELETE /api/service-requests/room/:roomId
// @access  Private
const clearRoomRequests = async (req, res) => {
    try {
        const { roomId } = req.params;
        const deleted = await ServiceRequest.destroy({ where: { roomId } });
        res.json({ message: `Cleared ${deleted} request(s) for room ${roomId}` });
    } catch (error) {
        console.error('Error clearing room requests:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRequest,
    getRequests,
    getRequest,
    updateRequest,
    deleteRequest,
    clearRoomRequests
};
