const QRCode = require('qrcode');

/**
 * Generate QR code for room service access
 * @param {string} roomNumber - Room number
 * @param {string} baseUrl - Base URL for the application (e.g., http://localhost:3000)
 * @returns {Promise<string>} Base64 encoded QR code image
 */
const generateRoomQRCode = async (roomNumber, baseUrl = 'http://localhost:3000') => {
    try {
        const url = `${baseUrl}/room-service?room=${roomNumber}`;

        // Generate QR code as base64 data URL
        const qrCodeDataURL = await QRCode.toDataURL(url, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 300
        });

        return qrCodeDataURL;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
};

/**
 * Generate QR code as buffer for saving to file
 * @param {string} roomNumber - Room number
 * @param {string} baseUrl - Base URL for the application
 * @returns {Promise<Buffer>} QR code image buffer
 */
const generateRoomQRCodeBuffer = async (roomNumber, baseUrl = 'http://localhost:3000') => {
    try {
        const url = `${baseUrl}/room-service?room=${roomNumber}`;

        const buffer = await QRCode.toBuffer(url, {
            errorCorrectionLevel: 'H',
            type: 'png',
            quality: 0.95,
            margin: 2,
            width: 300
        });

        return buffer;
    } catch (error) {
        console.error('Error generating QR code buffer:', error);
        throw error;
    }
};

module.exports = {
    generateRoomQRCode,
    generateRoomQRCodeBuffer
};
