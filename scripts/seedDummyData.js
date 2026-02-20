const { Guest, Booking, Room, Payment, ServiceRequest } = require('../models');

const seedDummyData = async () => {
    try {
        // Skip if bookings already exist
        const existingBookings = await Booking.count();
        if (existingBookings > 0) {
            console.log('Dummy data already seeded');
            return;
        }

        const rooms = await Room.findAll({ order: [['roomNumber', 'ASC']] });
        if (rooms.length === 0) {
            console.log('No rooms found, skipping dummy data seed');
            return;
        }

        // ── Helpers ──────────────────────────────────────────────────────────────
        const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(12, 0, 0, 0); return d; };
        const daysFrom = (base, n) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };

        // ── Guests ────────────────────────────────────────────────────────────────
        const guests = await Guest.bulkCreate([
            {
                name: 'Arjun Mehta',
                email: 'arjun.mehta@gmail.com',
                phone: '9876543210',
                address: '14 Marine Lines, Mumbai, Maharashtra',
                idProofType: 'aadhaar',
                idProofNumber: '1234 5678 9012',
                status: 'checked-out',
            },
            {
                name: 'Priya Iyer',
                email: 'priya.iyer@outlook.com',
                phone: '8765432109',
                address: '27 Anna Nagar, Chennai, Tamil Nadu',
                idProofType: 'passport',
                idProofNumber: 'N8524136',
                status: 'checked-out',
            },
            {
                name: 'Rahul Sharma',
                email: 'rahul.sharma@yahoo.com',
                phone: '7654321098',
                address: '5 Connaught Place, New Delhi',
                idProofType: 'driving_license',
                idProofNumber: 'DL0520100112345',
                status: 'checked-in',
            },
            {
                name: 'Sneha Patel',
                email: 'sneha.patel@gmail.com',
                phone: '9543216780',
                address: '88 CG Road, Ahmedabad, Gujarat',
                idProofType: 'aadhaar',
                idProofNumber: '9876 5432 1098',
                status: 'checked-out',
            },
            {
                name: 'Vikram Nair',
                email: 'vikram.nair@gmail.com',
                phone: '9321456780',
                address: '3 MG Road, Kochi, Kerala',
                idProofType: 'passport',
                idProofNumber: 'K3716249',
                status: 'checked-out',
            },
            {
                name: 'Divya Reddy',
                email: 'divya.reddy@gmail.com',
                phone: '8891234560',
                address: '12 Banjara Hills, Hyderabad, Telangana',
                idProofType: 'national_id',
                idProofNumber: 'TS2023456789',
                status: 'checked-out',
            },
        ]);

        // ── Bookings ──────────────────────────────────────────────────────────────
        // Use available rooms safely
        const r = (i) => rooms[i % rooms.length];

        //  1. Past booking — 45 days ago  (3 nights, single, paid, checked-out)
        const ci1 = daysAgo(45);
        const co1 = daysFrom(ci1, 3);
        const nights1 = 3;
        const amount1 = nights1 * r(0).pricePerNight;
        const b1 = await Booking.create({
            guestId: guests[0].id,
            roomId: r(0).id,
            checkInDate: ci1,
            checkOutDate: co1,
            numberOfGuests: 1,
            totalAmount: amount1,
            paymentStatus: 'paid',
            bookingStatus: 'checked-out',
        });

        //  2. Past booking — 38 days ago  (5 nights, double, paid, checked-out)
        const ci2 = daysAgo(38);
        const co2 = daysFrom(ci2, 5);
        const nights2 = 5;
        const amount2 = nights2 * r(1).pricePerNight;
        const b2 = await Booking.create({
            guestId: guests[1].id,
            roomId: r(1).id,
            checkInDate: ci2,
            checkOutDate: co2,
            numberOfGuests: 2,
            totalAmount: amount2,
            paymentStatus: 'paid',
            bookingStatus: 'checked-out',
        });

        //  3. Past booking — 30 days ago  (7 nights, deluxe, paid)
        const ci3 = daysAgo(30);
        const co3 = daysFrom(ci3, 7);
        const nights3 = 7;
        const amount3 = nights3 * r(2).pricePerNight;
        const b3 = await Booking.create({
            guestId: guests[3].id,
            roomId: r(2).id,
            checkInDate: ci3,
            checkOutDate: co3,
            numberOfGuests: 3,
            totalAmount: amount3,
            paymentStatus: 'paid',
            bookingStatus: 'checked-out',
        });

        //  4. Past booking — 20 days ago  (4 nights, suite, paid)
        const ci4 = daysAgo(20);
        const co4 = daysFrom(ci4, 4);
        const nights4 = 4;
        const amount4 = nights4 * r(3 % rooms.length).pricePerNight;
        const b4 = await Booking.create({
            guestId: guests[4].id,
            roomId: r(3 % rooms.length).id,
            checkInDate: ci4,
            checkOutDate: co4,
            numberOfGuests: 2,
            totalAmount: amount4,
            paymentStatus: 'paid',
            bookingStatus: 'checked-out',
        });

        //  5. Past booking — 12 days ago  (2 nights, single, paid)
        const ci5 = daysAgo(12);
        const co5 = daysFrom(ci5, 2);
        const nights5 = 2;
        const amount5 = nights5 * r(0).pricePerNight;
        const b5 = await Booking.create({
            guestId: guests[5].id,
            roomId: r(0).id,
            checkInDate: ci5,
            checkOutDate: co5,
            numberOfGuests: 1,
            totalAmount: amount5,
            paymentStatus: 'paid',
            bookingStatus: 'checked-out',
        });

        //  6. Past booking — 8 days ago  (3 nights, family, paid)
        const ci6 = daysAgo(8);
        const co6 = daysFrom(ci6, 3);
        const nights6 = 3;
        const lastRoomIdx = rooms.length > 4 ? 4 : rooms.length - 1;
        const amount6 = nights6 * r(lastRoomIdx).pricePerNight;
        const b6 = await Booking.create({
            guestId: guests[0].id,
            roomId: r(lastRoomIdx).id,
            checkInDate: ci6,
            checkOutDate: co6,
            numberOfGuests: 4,
            totalAmount: amount6,
            paymentStatus: 'paid',
            bookingStatus: 'checked-out',
        });

        //  7. ACTIVE check-in — checked in 2 days ago, checking out in 3 days
        //     Uses room index 1 (double) and marks it occupied
        const activeRoom = r(1);
        const ci7 = daysAgo(2);
        const co7 = daysFrom(new Date(), 3);
        const nights7 = 5;
        const amount7 = nights7 * activeRoom.pricePerNight;
        const b7 = await Booking.create({
            guestId: guests[2].id,       // Rahul Sharma
            roomId: activeRoom.id,
            checkInDate: ci7,
            checkOutDate: co7,
            numberOfGuests: 2,
            totalAmount: amount7,
            paymentStatus: 'pending',
            bookingStatus: 'checked-in',
            secondaryGuests: JSON.stringify([{ name: 'Meera Sharma', age: 29 }]),
        });

        // Mark that room as occupied
        await activeRoom.update({ status: 'occupied' });

        // ── Payments for completed bookings ────────────────────────────────────
        const completedBookings = [b1, b2, b3, b4, b5, b6];
        const invoiceData = (b, room, guest, nights) => ({
            invoiceNumber: `INV-SEED-${b.id}`,
            booking: {
                id: b.id, checkInDate: b.checkInDate, checkOutDate: b.checkOutDate,
                nights, numberOfGuests: b.numberOfGuests, paymentStatus: 'completed',
            },
            room: { roomNumber: room.roomNumber, type: room.type, pricePerNight: room.pricePerNight },
            guest: { name: guest.name, email: guest.email, phone: guest.phone },
            charges: {
                roomCharges: { description: `${nights} nights × ₹${room.pricePerNight}`, amount: b.totalAmount },
                serviceCharges: [],
            },
            totalAmount: b.totalAmount,
            paymentStatus: 'completed',
        });

        await Payment.create({ bookingId: b1.id, amount: amount1, paymentMethod: 'upi', paymentStatus: 'completed', notes: JSON.stringify(invoiceData(b1, r(0), guests[0], nights1)) });
        await Payment.create({ bookingId: b2.id, amount: amount2, paymentMethod: 'card', paymentStatus: 'completed', notes: JSON.stringify(invoiceData(b2, r(1), guests[1], nights2)) });
        await Payment.create({ bookingId: b3.id, amount: amount3, paymentMethod: 'cash', paymentStatus: 'completed', notes: JSON.stringify(invoiceData(b3, r(2), guests[3], nights3)) });
        await Payment.create({ bookingId: b4.id, amount: amount4, paymentMethod: 'upi', paymentStatus: 'completed', notes: JSON.stringify(invoiceData(b4, r(3 % rooms.length), guests[4], nights4)) });
        await Payment.create({ bookingId: b5.id, amount: amount5, paymentMethod: 'cash', paymentStatus: 'completed', notes: JSON.stringify(invoiceData(b5, r(0), guests[5], nights5)) });
        await Payment.create({ bookingId: b6.id, amount: amount6, paymentMethod: 'card', paymentStatus: 'completed', notes: JSON.stringify(invoiceData(b6, r(lastRoomIdx), guests[0], nights6)) });

        // ── Service requests for the active booking ───────────────────────────
        await ServiceRequest.bulkCreate([
            {
                bookingId: b7.id,
                roomId: activeRoom.id,
                description: 'Extra Towels',
                items: JSON.stringify([{ name: 'Extra Towels', price: 0, quantity: 2 }]),
                totalAmount: 0,
                status: 'completed',
            },
            {
                bookingId: b7.id,
                roomId: activeRoom.id,
                description: 'Food order — Lunch',
                items: JSON.stringify([
                    { name: 'Veg Biryani', price: 280, quantity: 2 },
                    { name: 'Masala Chai', price: 60, quantity: 2 },
                ]),
                totalAmount: 680,
                status: 'in-progress',
            },
        ]);

        console.log(`✅ Dummy data seeded: ${guests.length} guests, 7 bookings (1 active), 6 payments, 2 service requests`);
    } catch (error) {
        console.error('❌ Error seeding dummy data:', error);
    }
};

module.exports = seedDummyData;
