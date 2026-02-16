const { Room } = require('./models');

const seedRooms = async () => {
    try {
        // Check if rooms already exist
        const count = await Room.count();
        if (count > 0) {
            console.log('Rooms already seeded');
            return;
        }

        const rooms = [
            {
                roomNumber: '101',
                type: 'single',
                capacity: 1,
                pricePerNight: 1500,
                amenities: 'AC, WiFi, TV, Attached Bathroom',
                status: 'available',
                description: 'Cozy single room with all basic amenities'
            },
            {
                roomNumber: '102',
                type: 'double',
                capacity: 2,
                pricePerNight: 2500,
                amenities: 'AC, WiFi, TV, Mini Fridge, Attached Bathroom',
                status: 'available',
                description: 'Comfortable double room perfect for couples'
            },
            {
                roomNumber: '201',
                type: 'deluxe',
                capacity: 3,
                pricePerNight: 3500,
                amenities: 'AC, WiFi, Smart TV, Mini Fridge, Balcony, Premium Bathroom',
                status: 'available',
                description: 'Spacious deluxe room with premium amenities'
            },
            {
                roomNumber: '202',
                type: 'suite',
                capacity: 4,
                pricePerNight: 5000,
                amenities: 'AC, WiFi, Smart TV, Mini Fridge, Living Area, Balcony, Jacuzzi',
                status: 'available',
                description: 'Luxurious suite with separate living area'
            },
            {
                roomNumber: '301',
                type: 'family',
                capacity: 5,
                pricePerNight: 6000,
                amenities: 'AC, WiFi, Smart TV, Kitchen, Dining Area, 2 Bedrooms, 2 Bathrooms',
                status: 'available',
                description: 'Large family room with kitchen and multiple bedrooms'
            }
        ];

        await Room.bulkCreate(rooms);
        console.log('✅ Rooms seeded successfully with', rooms.length, 'rooms');
    } catch (error) {
        console.error('❌ Error seeding rooms:', error);
    }
};

module.exports = seedRooms;
