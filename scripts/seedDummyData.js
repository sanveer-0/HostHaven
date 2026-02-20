const { Guest, Booking, Room, Payment, ServiceRequest, SecondaryGuest } = require('../models');

const d = (str) => new Date(str + 'T12:00:00.000Z');
const nights = (ci, co) => Math.round((new Date(co) - new Date(ci)) / 86400000);

const seedDummyData = async () => {
    try {
        const existingBookings = await Booking.count();
        if (existingBookings > 0) {
            console.log('Dummy data already seeded');
            return;
        }

        const rooms = await Room.findAll({ order: [['roomNumber', 'ASC']] });
        if (rooms.length < 5) {
            console.log('Not enough rooms for dummy seed, skipping');
            return;
        }

        // rooms[0]=101 Single ₹1500  rooms[1]=102 Double ₹2500
        // rooms[2]=201 Deluxe ₹3500  rooms[3]=202 Suite ₹5000
        // rooms[4]=301 Family ₹6000

        // ── Guests ────────────────────────────────────────────────────────────
        const guestData = [
            { name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', phone: '9876543210', address: '14 Marine Lines, Mumbai, MH', idProofType: 'aadhaar', idProofNumber: '1234 5678 9012', status: 'checked-out' },
            { name: 'Priya Iyer', email: 'priya.iyer@outlook.com', phone: '8765432109', address: '27 Anna Nagar, Chennai, TN', idProofType: 'passport', idProofNumber: 'N8524136', status: 'checked-out' },
            { name: 'Rahul Sharma', email: 'rahul.sharma@yahoo.com', phone: '7654321098', address: '5 Connaught Place, New Delhi', idProofType: 'driving_license', idProofNumber: 'DL0520100112345', status: 'checked-in' },
            { name: 'Sneha Patel', email: 'sneha.patel@gmail.com', phone: '9543216780', address: '88 CG Road, Ahmedabad, GJ', idProofType: 'aadhaar', idProofNumber: '9876 5432 1098', status: 'checked-out' },
            { name: 'Vikram Nair', email: 'vikram.nair@gmail.com', phone: '9321456780', address: '3 MG Road, Kochi, KL', idProofType: 'passport', idProofNumber: 'K3716249', status: 'checked-out' },
            { name: 'Divya Reddy', email: 'divya.reddy@gmail.com', phone: '8891234560', address: '12 Banjara Hills, Hyderabad, TS', idProofType: 'national_id', idProofNumber: 'TS2023456789', status: 'checked-out' },
            { name: 'Rohan Kapoor', email: 'rohan.kapoor@gmail.com', phone: '9012345678', address: '64 Indiranagar, Bengaluru, KA', idProofType: 'aadhaar', idProofNumber: '3456 7890 1234', status: 'checked-out' },
            { name: 'Ananya Singh', email: 'ananya.singh@gmail.com', phone: '8123456790', address: '19 Park Street, Kolkata, WB', idProofType: 'passport', idProofNumber: 'B4127839', status: 'checked-out' },
        ];
        const guests = await Guest.bulkCreate(guestData);
        const g = (i) => guests[i];

        // ── Booking definitions ───────────────────────────────────────────────
        // Each: [guestIdx, roomIdx, checkIn, checkOut, numGuests, payMethod, svcCharges]
        // svcCharges = array of {description, amount} or []
        const defs = [
            // ───── ROOM 101 — Single ₹1500 ─────────────────────────────────
            [0, 0, '2025-12-01', '2025-12-04', 1, 'upi', []],
            [1, 0, '2025-12-08', '2025-12-12', 1, 'cash', [{ description: 'Extra Towels', amount: 0 }]],
            [2, 0, '2025-12-16', '2025-12-19', 1, 'card', []],
            [3, 0, '2025-12-23', '2025-12-28', 1, 'upi', []],
            [4, 0, '2026-01-03', '2026-01-06', 1, 'cash', []],
            [5, 0, '2026-01-10', '2026-01-14', 1, 'card', [{ description: 'Room Cleaning', amount: 200 }]],
            [0, 0, '2026-01-18', '2026-01-21', 1, 'upi', []],
            [1, 0, '2026-01-25', '2026-01-28', 1, 'cash', []],
            [6, 0, '2026-02-02', '2026-02-05', 1, 'card', []],
            [7, 0, '2026-02-10', '2026-02-13', 1, 'upi', [{ description: 'Toiletries Pack', amount: 150 }]],

            // ───── ROOM 102 — Double ₹2500 ─────────────────────────────────
            [1, 1, '2025-12-02', '2025-12-07', 2, 'card', []],
            [2, 1, '2025-12-11', '2025-12-15', 2, 'upi', [{ description: 'Breakfast ×2', amount: 480 }]],
            [4, 1, '2025-12-19', '2025-12-23', 2, 'cash', []],
            [5, 1, '2025-12-27', '2025-12-31', 2, 'upi', []],
            [6, 1, '2026-01-04', '2026-01-08', 2, 'card', []],
            [7, 1, '2026-01-12', '2026-01-16', 2, 'cash', [{ description: 'Dinner ×2', amount: 620 }]],
            [0, 1, '2026-01-20', '2026-01-24', 2, 'upi', []],
            [3, 1, '2026-01-28', '2026-02-01', 2, 'card', []],
            [1, 1, '2026-02-05', '2026-02-09', 2, 'upi', [{ description: 'Veg Biryani ×2', amount: 560 }]],
            [5, 1, '2026-02-13', '2026-02-17', 2, 'cash', []],

            // ───── ROOM 201 — Deluxe ₹3500 ─────────────────────────────────
            [2, 2, '2025-12-03', '2025-12-08', 2, 'upi', []],
            [3, 2, '2025-12-12', '2025-12-16', 2, 'card', [{ description: 'Spa Service', amount: 1200 }]],
            [0, 2, '2025-12-20', '2025-12-25', 3, 'cash', []],
            [5, 2, '2025-12-28', '2026-01-02', 2, 'upi', []],
            [1, 2, '2026-01-06', '2026-01-11', 2, 'card', [{ description: 'Breakfast ×2 ×5d', amount: 1200 }]],
            [4, 2, '2026-01-15', '2026-01-20', 3, 'upi', []],
            [7, 2, '2026-01-24', '2026-01-28', 2, 'cash', []],
            [3, 2, '2026-02-01', '2026-02-06', 2, 'card', [{ description: 'Laundry Service', amount: 400 }]],
            [6, 2, '2026-02-10', '2026-02-14', 2, 'upi', []],
            [0, 2, '2026-02-17', '2026-02-20', 2, 'cash', []],

            // ───── ROOM 202 — Suite ₹5000 ──────────────────────────────────
            [3, 3, '2025-12-01', '2025-12-06', 3, 'card', [{ description: 'Flowers & Welcome Kit', amount: 800 }]],
            [4, 3, '2025-12-10', '2025-12-15', 4, 'upi', []],
            [5, 3, '2025-12-19', '2025-12-24', 3, 'cash', [{ description: 'Dinner Buffet ×2', amount: 950 }]],
            [6, 3, '2025-12-28', '2026-01-02', 2, 'card', []],
            [7, 3, '2026-01-06', '2026-01-11', 4, 'upi', [{ description: 'Extra Mattress', amount: 500 }]],
            [0, 3, '2026-01-15', '2026-01-20', 3, 'card', []],
            [1, 3, '2026-01-24', '2026-01-29', 2, 'upi', [{ description: 'Spa for 2', amount: 2200 }]],
            [2, 3, '2026-02-02', '2026-02-07', 3, 'cash', []],
            [4, 3, '2026-02-11', '2026-02-16', 4, 'card', [{ description: 'Anniversary Package', amount: 1500 }]],

            // ───── ROOM 301 — Family ₹6000 ─────────────────────────────────
            [5, 4, '2025-12-02', '2025-12-08', 5, 'upi', []],
            [6, 4, '2025-12-13', '2025-12-18', 4, 'card', [{ description: 'Kids Meal Package', amount: 1200 }]],
            [7, 4, '2025-12-22', '2025-12-28', 5, 'cash', []],
            [3, 4, '2026-01-02', '2026-01-07', 4, 'upi', [{ description: 'Breakfast ×4 ×5d', amount: 2000 }]],
            [4, 4, '2026-01-11', '2026-01-17', 5, 'card', []],
            [0, 4, '2026-01-22', '2026-01-27', 4, 'upi', [{ description: 'Dinner ×4', amount: 1800 }]],
            [5, 4, '2026-02-01', '2026-02-07', 5, 'cash', []],
            [7, 4, '2026-02-12', '2026-02-17', 4, 'card', [{ description: 'Family Activity Package', amount: 2500 }]],
        ];

        let invoiceCounter = 1000;
        const bookingObjs = [];

        for (const [gi, ri, ci, co, numG, payMethod, svcCharges] of defs) {
            const n = nights(ci, co);
            const roomCharge = n * rooms[ri].pricePerNight;
            const svcTotal = svcCharges.reduce((s, c) => s + c.amount, 0);
            const total = roomCharge + svcTotal;

            const booking = await Booking.create({
                guestId: g(gi).id,
                roomId: rooms[ri].id,
                checkInDate: d(ci),
                checkOutDate: d(co),
                numberOfGuests: numG,
                totalAmount: total,
                paymentStatus: 'paid',
                bookingStatus: 'checked-out',
            });

            invoiceCounter++;
            const invoice = {
                invoiceNumber: `INV-${invoiceCounter}`,
                booking: {
                    id: booking.id,
                    checkInDate: ci,
                    checkOutDate: co,
                    nights: n,
                    numberOfGuests: numG,
                    paymentStatus: 'completed',
                },
                room: {
                    roomNumber: rooms[ri].roomNumber,
                    type: rooms[ri].type,
                    pricePerNight: rooms[ri].pricePerNight,
                },
                guest: {
                    name: g(gi).name,
                    email: g(gi).email,
                    phone: g(gi).phone,
                },
                charges: {
                    roomCharges: { description: `${n} nights × ₹${rooms[ri].pricePerNight}`, amount: roomCharge },
                    serviceCharges: svcCharges,
                },
                totalAmount: total,
                paymentStatus: 'completed',
            };

            await Payment.create({
                bookingId: booking.id,
                amount: total,
                paymentMethod: payMethod,
                status: 'completed',
                paymentDate: d(co),
                notes: JSON.stringify(invoice),
            });

            // Add service request records for bookings with service charges
            if (svcCharges.length > 0) {
                for (const svc of svcCharges) {
                    await ServiceRequest.create({
                        bookingId: booking.id,
                        roomId: rooms[ri].id,
                        type: 'room_service',
                        description: svc.description,
                        items: JSON.stringify([{ name: svc.description, price: svc.amount, quantity: 1 }]),
                        totalAmount: svc.amount,
                        status: 'completed',
                    });
                }
            }

            bookingObjs.push(booking);
        }

        // ── Active Check-in: Rahul Sharma in Room 102, Feb 18–23 ─────────────
        const activeRoom = rooms[1]; // 102 Double
        const activeBooking = await Booking.create({
            guestId: g(2).id, // Rahul Sharma
            roomId: activeRoom.id,
            checkInDate: d('2026-02-18'),
            checkOutDate: d('2026-02-23'),
            numberOfGuests: 2,
            totalAmount: 5 * activeRoom.pricePerNight,
            paymentStatus: 'pending',
            bookingStatus: 'checked-in',
        });
        // Add secondary guest linked to Rahul Sharma's guest record
        await SecondaryGuest.create({
            guestId: g(2).id,
            name: 'Meera Sharma',
            age: 29
        });
        await activeRoom.update({ status: 'occupied' });

        // Active service requests on the current booking
        await ServiceRequest.bulkCreate([
            {
                bookingId: activeBooking.id,
                roomId: activeRoom.id,
                type: 'room_service',
                description: 'Extra Towels',
                items: JSON.stringify([{ name: 'Extra Towels', price: 0, quantity: 2 }]),
                totalAmount: 0,
                status: 'completed',
            },
            {
                bookingId: activeBooking.id,
                roomId: activeRoom.id,
                type: 'food',
                description: 'Lunch order',
                items: JSON.stringify([
                    { name: 'Veg Biryani', price: 280, quantity: 2 },
                    { name: 'Masala Chai', price: 60, quantity: 2 },
                ]),
                totalAmount: 680,
                status: 'in-progress',
            },
            {
                bookingId: activeBooking.id,
                roomId: activeRoom.id,
                type: 'room_service',
                description: 'Pillow request',
                items: JSON.stringify([{ name: 'Pillows', price: 0, quantity: 1 }]),
                totalAmount: 0,
                status: 'pending',
            },
        ]);

        console.log(`✅ Dummy data seeded: 8 guests, ${defs.length + 1} bookings (1 active), ${defs.length} payments, service requests across 3 months`);
    } catch (error) {
        console.error('❌ Error seeding dummy data:', error);
    }
};

module.exports = seedDummyData;
