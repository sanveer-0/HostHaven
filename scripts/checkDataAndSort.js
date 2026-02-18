const { sequelize, Payment, Booking, Guest } = require('../models');

async function run() {
    try {
        await sequelize.authenticate();
        console.log('DB Connection OK');

        const payments = await Payment.findAll({ where: { status: 'completed' } });
        console.log(`Completed Payments Count: ${payments.length}`);

        // Revenue calc check
        const revenueByMonth = {};
        payments.forEach(p => {
            const month = new Date(p.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            revenueByMonth[month] = (revenueByMonth[month] || 0) + parseFloat(p.amount);
        });
        console.log('Revenue Buckets:', JSON.stringify(revenueByMonth));

        // Booking sort check
        const bookings = await Booking.findAll({
            attributes: ['id', 'checkInDate', 'createdAt'],
            include: [{ model: Guest, as: 'guest', attributes: ['name'] }],
            order: [['checkInDate', 'DESC']],
            limit: 5
        });

        console.log('--- Top 5 Bookings (Sorted by checkInDate DESC) ---');
        bookings.forEach(b => {
            console.log(`ID: ${b.id}, CheckIn: ${new Date(b.checkInDate).toISOString().split('T')[0]}, Guest: ${b.guest ? b.guest.name : '?'}`);
        });

    } catch (e) { console.error(e); }
    finally { await sequelize.close(); }
}

run();
