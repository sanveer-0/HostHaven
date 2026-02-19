const { sequelize, User, Room, Guest, Booking, Payment, ServiceRequest, MenuItem } = require('../models');
const bcrypt = require('bcryptjs');

// Constants
// Start from Dec 1, 2025
const START_DATE = new Date('2025-12-01');
// End at Feb 19, 2026 (or today/future)
const END_DATE = new Date('2026-02-19');

// Helper to get random date
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to get random item from array
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random number
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const seedDummyData = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Wipe existing data to ensure clean slate for dummy data - FORCE: TRUE wipes tables
        // Disable foreign key checks to allow dropping tables
        await sequelize.query('PRAGMA foreign_keys = OFF;');
        await sequelize.sync({ force: true });
        await sequelize.query('PRAGMA foreign_keys = ON;');
        console.log('Database synced (all tables cleared).');

        // 1. Create Layout/Menu Items (Needed for Service Requests)
        const menuItems = await MenuItem.bulkCreate([
            { name: 'Breakfast', description: 'Standard Breakfast', price: 15, category: 'food', available: true },
            { name: 'Lunch', description: 'Standard Lunch', price: 20, category: 'food', available: true },
            { name: 'Dinner', description: 'Standard Dinner', price: 25, category: 'food', available: true },
            { name: 'Extra Towels', description: 'Set of 2 towels', price: 5, category: 'amenity', available: true },
            { name: 'Cleaning', description: 'Room cleaning service', price: 0, category: 'service', available: true },
        ]);
        console.log('Menu items created.');

        // 2. Create Admin User
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            username: 'admin',
            email: 'admin@hosthaven.com',
            password: hashedPassword,
            role: 'admin'
        });
        console.log('Admin user created (admin@hosthaven.com / admin123).');

        // 3. Create Rooms
        const rooms = await Room.bulkCreate([
            { roomNumber: '101', type: 'single', capacity: 1, pricePerNight: 100, status: 'available', description: 'Cozy single room' },
            { roomNumber: '102', type: 'single', capacity: 1, pricePerNight: 100, status: 'available', description: 'Cozy single room' },
            { roomNumber: '103', type: 'double', capacity: 2, pricePerNight: 150, status: 'available', description: 'Spacious double room' },
            { roomNumber: '104', type: 'double', capacity: 2, pricePerNight: 150, status: 'available', description: 'Spacious double room' },
            { roomNumber: '201', type: 'suite', capacity: 4, pricePerNight: 300, status: 'available', description: 'Luxury suite' },
            { roomNumber: '202', type: 'suite', capacity: 4, pricePerNight: 300, status: 'available', description: 'Luxury suite' },
            { roomNumber: '203', type: 'family', capacity: 5, pricePerNight: 350, status: 'available', description: 'Family room' },
            { roomNumber: '301', type: 'deluxe', capacity: 2, pricePerNight: 200, status: 'available', description: 'Deluxe room with view' },
        ]);
        console.log(`Created ${rooms.length} rooms.`);

        // 4. Create Guests
        const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy', 'Jack', 'Kelly', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Ryan'];
        const lastNames = ['Doe', 'Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'];

        const guestsData = [];
        // Generate 20 guests
        for (let i = 0; i < 20; i++) {
            const firstName = randomItem(firstNames);
            const lastName = randomItem(lastNames);
            guestsData.push({
                name: `${firstName} ${lastName}`,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
                phone: `555-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
                address: `${randomInt(1, 999)} Random St, Cityville, ST`,
                idProofType: randomItem(['passport', 'driving_license', 'national_id']),
                idProofNumber: `ID${randomInt(100000, 999999)}`,
                status: 'active'
            });
        }
        const guests = await Guest.bulkCreate(guestsData);
        console.log(`Created ${guests.length} guests.`);

        // 5. Create Bookings & Payments
        let bookingCount = 0;
        let paymentCount = 0;
        let requestCount = 0;

        // Iterate through guests to create bookings
        for (const guest of guests) {
            // Each guest has 1-3 bookings
            const numBookings = randomInt(1, 3);

            for (let b = 0; b < numBookings; b++) {
                const room = randomItem(rooms);

                // Random check-in date between Dec 1, 2025 and Feb 15, 2026
                const maxCheckIn = new Date(END_DATE.getTime() - (5 * 24 * 60 * 60 * 1000));
                const checkInDate = randomDate(START_DATE, maxCheckIn);

                // Duration 1-7 nights
                const nights = randomInt(1, 7);
                const checkOutDate = new Date(checkInDate.getTime() + (nights * 24 * 60 * 60 * 1000));

                const today = new Date();
                let bookingStatus = 'checked-out';
                if (checkInDate > today) {
                    bookingStatus = 'confirmed'; // Future booking
                } else if (checkOutDate > today && checkInDate <= today) {
                    bookingStatus = 'checked-in'; // Currently staying
                } else {
                    bookingStatus = 'checked-out'; // Past booking
                }

                // Skip if we randomly picked the same room for overlapping dates (simple collision check skip for now, let's just create)

                const totalAmount = room.pricePerNight * nights;

                const booking = await Booking.create({
                    guestId: guest.id,
                    roomId: room.id,
                    checkInDate: checkInDate,
                    checkOutDate: checkOutDate,
                    numberOfGuests: randomInt(1, room.capacity),
                    totalAmount: totalAmount,
                    paymentStatus: bookingStatus === 'confirmed' ? 'pending' : 'paid',
                    bookingStatus: bookingStatus,
                    specialRequests: Math.random() > 0.7 ? 'Late check-in requested' : null
                });
                bookingCount++;

                // If paid (past or current), create payment
                if (booking.paymentStatus === 'paid') {
                    // Payment date is checkout date
                    await Payment.create({
                        bookingId: booking.id,
                        amount: totalAmount,
                        paymentMethod: randomItem(['card', 'cash', 'upi', 'bank_transfer']),
                        transactionId: `TXN${randomInt(10000, 99999)}`,
                        status: 'completed',
                        paymentDate: checkOutDate,
                        notes: 'Payment for booking #' + booking.id
                    });
                    paymentCount++;
                }

                // Create Service Requests for past/current bookings
                if (bookingStatus !== 'confirmed') {
                    const numRequests = randomInt(0, 3);
                    for (let r = 0; r < numRequests; r++) {
                        const item = randomItem(menuItems);
                        // Request date during stay
                        const requestDate = randomDate(checkInDate, checkOutDate > today ? today : checkOutDate);

                        await ServiceRequest.create({
                            guestId: guest.id,
                            roomId: room.id,
                            type: item.category,
                            description: item.name,
                            status: requestDate < today ? 'completed' : 'pending',
                            requestDate: requestDate
                        });
                        requestCount++;
                    }
                }
            }
        }

        console.log(`Created ${bookingCount} bookings.`);
        console.log(`Created ${paymentCount} payments.`);
        console.log(`Created ${requestCount} service requests.`);
        console.log('Seeding complete!');
        console.log('IMPORTANT: Admin account is admin@hosthaven.com / admin123');

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await sequelize.close();
    }
};

seedDummyData();
