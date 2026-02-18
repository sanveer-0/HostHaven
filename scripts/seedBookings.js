const { sequelize, Room, Guest, Booking } = require('../models');

const seedBookings = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Get or Create Rooms
        let rooms = await Room.findAll();
        if (rooms.length === 0) {
            console.log('No rooms found. Creating dummy rooms...');
            rooms = await Room.bulkCreate([
                { roomNumber: '101', type: 'single', capacity: 1, pricePerNight: 100, status: 'available' },
                { roomNumber: '102', type: 'double', capacity: 2, pricePerNight: 150, status: 'available' },
                { roomNumber: '201', type: 'suite', capacity: 4, pricePerNight: 300, status: 'available' },
            ]);
        }
        console.log(`Found ${rooms.length} rooms.`);

        // 2. Create Dummy Guests
        const guests = await Guest.bulkCreate([
            {
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '1234567890',
                address: '123 Main St, New York, NY',
                idProofType: 'passport',
                idProofNumber: 'A12345678',
                status: 'checked-out'
            },
            {
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                phone: '0987654321',
                address: '456 Elm St, Los Angeles, CA',
                idProofType: 'driving_license',
                idProofNumber: 'D87654321',
                status: 'checked-out'
            },
            {
                name: 'Alice Johnson',
                email: 'alice.j@example.com',
                phone: '1122334455',
                address: '789 Oak St, Chicago, IL',
                idProofType: 'national_id',
                idProofNumber: 'N112233',
                status: 'checked-out'
            }
        ]);
        console.log(`Created ${guests.length} guests.`);

        // 3. Create Bookings for Dec 2025 and Jan 2026
        const bookingsData = [
            // December 2025 Bookings
            {
                guestId: guests[0].id,
                roomId: rooms[0].id,
                checkInDate: new Date('2025-12-01'),
                checkOutDate: new Date('2025-12-05'),
                numberOfGuests: 1,
                totalAmount: 400.00, // 4 nights * 100
                paymentStatus: 'paid',
                bookingStatus: 'checked-out'
            },
            {
                guestId: guests[1].id,
                roomId: rooms[1].id,
                checkInDate: new Date('2025-12-10'),
                checkOutDate: new Date('2025-12-15'),
                numberOfGuests: 2,
                totalAmount: 750.00, // 5 nights * 150
                paymentStatus: 'paid',
                bookingStatus: 'checked-out'
            },
            {
                guestId: guests[2].id,
                roomId: rooms[2].id, // Suite (300/night)
                checkInDate: new Date('2025-12-20'),
                checkOutDate: new Date('2025-12-27'),
                numberOfGuests: 3,
                totalAmount: 2100.00, // 7 nights * 300
                paymentStatus: 'paid',
                bookingStatus: 'checked-out'
            },
            // January 2026 Bookings
            {
                guestId: guests[0].id,
                roomId: rooms[1].id, // Double (150/night)
                checkInDate: new Date('2026-01-02'),
                checkOutDate: new Date('2026-01-05'),
                numberOfGuests: 2,
                totalAmount: 450.00, // 3 nights * 150
                paymentStatus: 'paid',
                bookingStatus: 'checked-out'
            },
            {
                guestId: guests[1].id,
                roomId: rooms[0].id, // Single (100/night)
                checkInDate: new Date('2026-01-10'),
                checkOutDate: new Date('2026-01-12'),
                numberOfGuests: 1,
                totalAmount: 200.00, // 2 nights * 100
                paymentStatus: 'paid',
                bookingStatus: 'checked-out'
            },
            {
                guestId: guests[2].id,
                roomId: rooms[2].id, // Suite (300/night)
                checkInDate: new Date('2026-01-15'),
                checkOutDate: new Date('2026-01-20'),
                numberOfGuests: 4,
                totalAmount: 1500.00, // 5 nights * 300
                paymentStatus: 'paid',
                bookingStatus: 'checked-out'
            },
            {
                guestId: guests[0].id,
                roomId: rooms[0].id,
                checkInDate: new Date('2026-01-25'),
                checkOutDate: new Date('2026-01-28'),
                numberOfGuests: 1,
                totalAmount: 300.00,
                paymentStatus: 'paid',
                bookingStatus: 'checked-out'
            }
        ];

        await Booking.bulkCreate(bookingsData);
        console.log(`Created ${bookingsData.length} bookings for Dec 2025 & Jan 2026.`);

    } catch (error) {
        console.error('Error seeding bookings:', error);
    } finally {
        await sequelize.close();
    }
};

seedBookings();
