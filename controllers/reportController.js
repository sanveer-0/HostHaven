const { Booking, Guest, Room, Payment } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

// Generate booking report
exports.generateBookingReport = async (req, res) => {
    try {
        const { startDate, endDate, format } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        console.log('Fetching bookings from', startDate, 'to', endDate);

        // Fetch bookings within date range
        const bookings = await Booking.findAll({
            where: {
                checkInDate: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                }
            },
            order: [['checkInDate', 'ASC']]
        });

        console.log(`Found ${bookings.length} bookings`);

        // Manually fetch related data for each booking
        for (let booking of bookings) {
            try {
                booking.guest = await Guest.findByPk(booking.guestId);
                booking.room = await Room.findByPk(booking.roomId);
                booking.payments = await Payment.findAll({ where: { bookingId: booking.id } });
            } catch (err) {
                console.error(`Error fetching related data for booking ${booking.id}:`, err);
            }
        }

        // Generate Excel file with proper column widths
        await generateExcelReport(bookings, startDate, endDate, res);

    } catch (error) {
        console.error('Error generating report:', error);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Error generating report', error: error.message });
        }
    }
};

// Generate Excel Report with proper formatting
async function generateExcelReport(bookings, startDate, endDate, res) {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bookings Report');

        // Set column widths and headers
        worksheet.columns = [
            { header: 'Booking ID', key: 'bookingId', width: 12 },
            { header: 'Room Number', key: 'roomNumber', width: 15 },
            { header: 'Room Type', key: 'roomType', width: 15 },
            { header: 'Check-In Date', key: 'checkInDate', width: 18 },
            { header: 'Check-In Time', key: 'checkInTime', width: 15 },
            { header: 'Check-Out Date', key: 'checkOutDate', width: 18 },
            { header: 'Check-Out Time', key: 'checkOutTime', width: 15 },
            { header: 'Number of Guests', key: 'numberOfGuests', width: 18 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Total Amount (Rs)', key: 'totalAmount', width: 18 },
            { header: 'Guest Name', key: 'guestName', width: 25 },
            { header: 'Guest Email', key: 'guestEmail', width: 30 },
            { header: 'Guest Phone', key: 'guestPhone', width: 18 },
            { header: 'Guest Address', key: 'guestAddress', width: 40 },
            { header: 'ID Proof Type', key: 'idProofType', width: 18 },
            { header: 'ID Proof Number', key: 'idProofNumber', width: 20 },
            { header: 'Payment Method', key: 'paymentMethod', width: 18 },
            { header: 'Payment Status', key: 'paymentStatus', width: 18 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0891B2' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 25;

        // Format dates as DD/MM/YYYY
        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        // Add data rows
        bookings.forEach((booking, index) => {
            const guest = booking.guest;
            const payment = booking.payments && booking.payments.length > 0 ? booking.payments[0] : null;

            const row = worksheet.addRow({
                bookingId: booking.id,
                roomNumber: booking.room?.roomNumber || 'N/A',
                roomType: booking.room?.type || 'N/A',
                checkInDate: formatDate(booking.checkInDate),
                checkInTime: booking.checkInTime || 'N/A',
                checkOutDate: formatDate(booking.checkOutDate),
                checkOutTime: booking.checkOutTime || 'N/A',
                numberOfGuests: booking.numberOfGuests,
                status: booking.bookingStatus.toUpperCase(),
                totalAmount: booking.totalAmount,
                guestName: guest?.name || 'N/A',
                guestEmail: guest?.email || 'N/A',
                guestPhone: guest?.phone || 'N/A',
                guestAddress: guest?.address || 'N/A',
                idProofType: guest?.idProofType || 'N/A',
                idProofNumber: guest?.idProofNumber || 'N/A',
                paymentMethod: payment?.paymentMethod || 'N/A',
                paymentStatus: payment?.paymentStatus || 'N/A',
            });

            // Alternate row colors for better readability
            if (index % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF0F9FF' }
                };
            }
        });

        // Add summary at the bottom
        worksheet.addRow([]);
        const summaryStartRow = worksheet.lastRow.number + 1;

        worksheet.getCell(`A${summaryStartRow}`).value = 'SUMMARY';
        worksheet.getCell(`A${summaryStartRow}`).font = { bold: true, size: 14 };

        worksheet.getCell(`A${summaryStartRow + 1}`).value = 'Total Bookings:';
        worksheet.getCell(`B${summaryStartRow + 1}`).value = bookings.length;

        worksheet.getCell(`A${summaryStartRow + 2}`).value = 'Total Revenue:';
        worksheet.getCell(`B${summaryStartRow + 2}`).value = `Rs.${bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0).toFixed(2)}`;

        worksheet.getCell(`A${summaryStartRow + 3}`).value = 'Report Period:';
        worksheet.getCell(`B${summaryStartRow + 3}`).value = `${formatDate(startDate)} to ${formatDate(endDate)}`;

        worksheet.getCell(`A${summaryStartRow + 4}`).value = 'Generated On:';
        worksheet.getCell(`B${summaryStartRow + 4}`).value = new Date().toLocaleString('en-IN');

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Set response headers and send
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=bookings_report_${startDate}_to_${endDate}.xlsx`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error) {
        console.error('Excel generation error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating Excel', error: error.message });
        }
    }
}
