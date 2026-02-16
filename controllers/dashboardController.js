const { Booking, Room, Guest, Payment } = require('../models');
const { fn, col } = require('sequelize');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
    try {
        // Total counts
        const totalGuests = await Guest.count();
        const totalRooms = await Room.count();
        const totalBookings = await Booking.count();

        // Active guests - count bookings with checked-in status
        const activeGuests = await Booking.count({
            where: { bookingStatus: 'checked-in' }
        });

        // Room statistics
        const availableRooms = await Room.count({ where: { status: 'available' } });
        const occupiedRooms = await Room.count({ where: { status: 'occupied' } });
        const maintenanceRooms = await Room.count({ where: { status: 'maintenance' } });

        // Revenue calculation - use 'completed' status instead of 'success'
        const revenueResult = await Payment.findOne({
            where: { status: 'completed' },
            attributes: [[fn('SUM', col('amount')), 'total']]
        });
        const totalRevenue = parseFloat(revenueResult?.dataValues?.total || 0);

        // Recent bookings
        const recentBookings = await Booking.findAll({
            include: [
                {
                    model: Guest,
                    as: 'guest',
                    attributes: ['name', 'email']
                },
                {
                    model: Room,
                    as: 'room',
                    attributes: ['roomNumber', 'type']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        res.json({
            totalGuests,
            totalRooms,
            totalBookings,
            activeGuests,
            availableRooms,
            occupiedRooms,
            maintenanceRooms,
            totalRevenue,
            recentBookings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get revenue analytics
// @route   GET /api/dashboard/revenue
// @access  Private
const getRevenue = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            where: { status: 'completed' },
            order: [['paymentDate', 'ASC']]
        });

        // Group by month
        const revenueByMonth = {};
        payments.forEach(payment => {
            const month = new Date(payment.paymentDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
            });
            revenueByMonth[month] = (revenueByMonth[month] || 0) + parseFloat(payment.amount);
        });

        res.json(revenueByMonth);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get occupancy analytics
// @route   GET /api/dashboard/occupancy
// @access  Private
const getOccupancy = async (req, res) => {
    try {
        const totalRooms = await Room.count();
        const occupiedRooms = await Room.count({ where: { status: 'occupied' } });
        const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0;

        res.json({
            totalRooms,
            occupiedRooms,
            occupancyRate: parseFloat(occupancyRate)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStats,
    getRevenue,
    getOccupancy
};
