const io = require('socket.io-client');
const axios = require('axios');

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

console.log('🚀 Starting verification script...');
console.log('   Target Socket URL:', SOCKET_URL);
console.log('   Target API URL:', API_URL);

// 1. Connect to Socket
console.log('🔌 Connecting to socket...');
const socket = io(SOCKET_URL, {
    reconnection: false,
    timeout: 5000
});

let eventReceived = false;

socket.on('connect', async () => {
    console.log('✅ Connected to socket server with ID:', socket.id);

    // 2. Setup Listener
    socket.on('new_service_request', (data) => {
        console.log('📩 RECEIVED EVENT: new_service_request');
        console.log('   Data:', JSON.stringify(data, null, 2));
        eventReceived = true;

        if (data.description === 'TEST_NOTIFICATION') {
            console.log('✅ VERIFICATION SUCCESS: Notification received!');
            cleanup();
        }
    });

    socket.on('connect_error', (err) => {
        console.error('❌ Socket Connection Error:', err.message);
        cleanup();
    });

    // 3. Create Test Request
    try {
        console.log('📝 Creating test service request via API...');
        const response = await axios.post(`${API_URL}/service-requests`, {
            roomId: 1,
            bookingId: 1,
            type: 'room_service',
            description: 'TEST_NOTIFICATION',
            items: [],
            totalAmount: 0
        });
        console.log('✅ API Request Success. Status:', response.status);
        console.log('   Request ID:', response.data.id);

        console.log('⏳ Waiting for socket event (10s timeout)...');

        // Wait for socket event
        setTimeout(() => {
            if (!eventReceived) {
                console.error('❌ VERIFICATION FAILED: Timeout waiting for socket event.');
                console.log('   This means the backend did NOT emit the event, or the client didn\'t receive it.');
                cleanup();
                process.exit(1);
            }
        }, 10000);

    } catch (error) {
        console.error('❌ API Error creating request:', error.message);
        if (error.response) {
            console.error('   Response Status:', error.response.status);
            console.error('   Response Data:', JSON.stringify(error.response.data));
        }
        cleanup();
        process.exit(1);
    }
});

function cleanup() {
    socket.disconnect();
    // Allow time for logs to flush if needed
    setTimeout(() => process.exit(0), 500);
}

// Global timeout
setTimeout(() => {
    console.error('❌ Script execution timeout.');
    cleanup();
}, 15000);
