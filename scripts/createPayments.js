const { sequelize, Booking, Payment } = require('../models');

const createMissingPayments = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Find all paid bookings
        const paidBookings = await Booking.findAll({
            where: {
                paymentStatus: 'paid'
            }
        });

        console.log(`Found ${paidBookings.length} paid bookings.`);

        let createdCount = 0;

        for (const booking of paidBookings) {
            // Check if payment already exists for this booking
            const existingPayment = await Payment.findOne({
                where: { bookingId: booking.id }
            });

            if (!existingPayment) {
                // Create payment
                // Use check-out date as payment date, or current date if not set
                // For the dummy data which are past bookings, checkOutDate is appropriate
                const paymentDate = booking.checkOutDate || new Date();

                await Payment.create({
                    bookingId: booking.id,
                    amount: booking.totalAmount,
                    paymentMethod: 'credit_card', // Dummy method
                    status: 'completed', // Matches the query in dashboardController
                    paymentDate: paymentDate,
                    notes: 'Auto-generated payment for existing booking'
                });
                createdCount++;
            }
        }

        console.log(`Created ${createdCount} missing payment records.`);

    } catch (error) {
        console.error('Error creating payments:', error);
    } finally {
        await sequelize.close();
    }
};

createMissingPayments();
