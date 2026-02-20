const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Sender address — uses Resend sandbox until you verify a custom domain
const FROM = 'HostHaven <onboarding@resend.dev>';

/**
 * Send booking confirmation email to the primary guest.
 */
const sendBookingConfirmation = async ({ guest, booking, room }) => {
    if (!guest?.email) return;

    const checkIn = new Date(booking.checkInDate).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const checkOut = new Date(booking.checkOutDate).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Booking Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0891b2,#0e7490);padding:40px 40px 32px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">🏨</div>
            <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">HostHaven</h1>
            <p style="margin:8px 0 0;color:#a5f3fc;font-size:14px;">Booking Confirmed ✓</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="font-size:18px;font-weight:600;color:#f1f5f9;margin:0 0 8px;">Hi ${guest.name},</p>
            <p style="color:#94a3b8;margin:0 0 32px;line-height:1.6;">Your booking at HostHaven has been confirmed. We look forward to welcoming you!</p>

            <!-- Booking Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;border:1px solid #334155;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;border-bottom:1px solid #334155;">
                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600;">Booking Reference</p>
                <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#22d3ee;font-family:monospace;">#${booking.id}</p>
              </td></tr>
              <tr><td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" style="vertical-align:top;">
                      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600;">Room</p>
                      <p style="margin:0;font-size:16px;font-weight:600;color:#f1f5f9;">Room ${room.roomNumber}</p>
                      <p style="margin:2px 0 0;font-size:13px;color:#94a3b8;text-transform:capitalize;">${room.type}</p>
                    </td>
                    <td width="50%" style="vertical-align:top;">
                      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600;">Guests</p>
                      <p style="margin:0;font-size:16px;font-weight:600;color:#f1f5f9;">${booking.numberOfGuests} Guest(s)</p>
                    </td>
                  </tr>
                  <tr><td colspan="2" style="padding-top:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="vertical-align:top;padding-right:12px;">
                          <div style="background:#1e293b;border-radius:8px;padding:12px 14px;border-left:3px solid #22d3ee;">
                            <p style="margin:0 0 3px;font-size:11px;color:#64748b;font-weight:600;">CHECK-IN</p>
                            <p style="margin:0;font-size:13px;font-weight:600;color:#f1f5f9;">${checkIn}</p>
                          </div>
                        </td>
                        <td width="50%" style="vertical-align:top;padding-left:12px;">
                          <div style="background:#1e293b;border-radius:8px;padding:12px 14px;border-left:3px solid #0891b2;">
                            <p style="margin:0 0 3px;font-size:11px;color:#64748b;font-weight:600;">CHECK-OUT</p>
                            <p style="margin:0;font-size:13px;font-weight:600;color:#f1f5f9;">${checkOut}</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td></tr>
                </table>
              </td></tr>
            </table>

            <!-- Room Service Note -->
            <div style="background:#164e63;border-radius:10px;padding:16px 20px;border:1px solid #0e7490;margin-bottom:32px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#22d3ee;">📱 Room Service via QR Code</p>
              <p style="margin:0;font-size:13px;color:#a5f3fc;line-height:1.5;">A QR code is available in your room. Scan it to order food or request services directly from your phone — no app needed.</p>
            </div>

            <p style="color:#64748b;font-size:13px;margin:0;">If you have any questions, please contact the front desk. We're happy to help!</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f172a;padding:24px 40px;text-align:center;border-top:1px solid #334155;">
            <p style="margin:0;font-size:12px;color:#475569;">© 2025 HostHaven. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
        await resend.emails.send({
            from: FROM,
            to: guest.email,
            subject: `Booking Confirmed — Room ${room.roomNumber} | HostHaven`,
            html,
        });
        console.log(`✉️  Booking confirmation sent to ${guest.email}`);
    } catch (err) {
        console.error('Failed to send booking confirmation:', err.message);
    }
};

/**
 * Send checkout invoice email to the primary guest.
 */
const sendInvoiceEmail = async ({ guest, invoice }) => {
    if (!guest?.email) return;

    const { booking, room, charges, totalAmount, invoiceNumber, paymentStatus } = invoice;

    const serviceRows = (charges.serviceCharges || []).map(sc => `
      <tr>
        <td style="padding:10px 14px;color:#cbd5e1;font-size:13px;">${sc.description}${sc.quantity > 1 ? ` × ${sc.quantity}` : ''}</td>
        <td style="padding:10px 14px;color:#cbd5e1;font-size:13px;text-align:right;">₹${sc.amount.toFixed(2)}</td>
      </tr>`).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice — HostHaven</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0891b2,#0e7490);padding:40px 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:28px;margin-bottom:4px;">🏨</div>
                  <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">HostHaven</h1>
                  <p style="margin:4px 0 0;color:#a5f3fc;font-size:13px;">Tax Invoice</p>
                </td>
                <td style="text-align:right;vertical-align:top;">
                  <p style="margin:0;font-size:11px;color:#a5f3fc;text-transform:uppercase;letter-spacing:1px;">Invoice No.</p>
                  <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#fff;font-family:monospace;">${invoiceNumber}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px 0;">
          <p style="font-size:16px;font-weight:600;color:#f1f5f9;margin:0 0 4px;">Hi ${guest.name},</p>
          <p style="color:#94a3b8;margin:0 0 28px;font-size:14px;line-height:1.6;">Thank you for staying with us! Here is your invoice summary.</p>

          <!-- Stay Details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:10px;margin-bottom:24px;overflow:hidden;border:1px solid #334155;">
            <tr style="background:#1e293b;">
              <td style="padding:12px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;" colspan="2">Stay Details</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#94a3b8;font-size:13px;">Room</td>
              <td style="padding:10px 14px;color:#f1f5f9;font-size:13px;font-weight:600;text-align:right;">Room ${room.roomNumber} (${room.type})</td>
            </tr>
            <tr style="background:#0a1628;">
              <td style="padding:10px 14px;color:#94a3b8;font-size:13px;">Check-in</td>
              <td style="padding:10px 14px;color:#f1f5f9;font-size:13px;font-weight:600;text-align:right;">${new Date(booking.checkInDate).toLocaleDateString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#94a3b8;font-size:13px;">Check-out</td>
              <td style="padding:10px 14px;color:#f1f5f9;font-size:13px;font-weight:600;text-align:right;">${new Date(booking.checkOutDate).toLocaleDateString('en-IN')}</td>
            </tr>
            <tr style="background:#0a1628;">
              <td style="padding:10px 14px;color:#94a3b8;font-size:13px;">Nights</td>
              <td style="padding:10px 14px;color:#f1f5f9;font-size:13px;font-weight:600;text-align:right;">${booking.nights}</td>
            </tr>
          </table>

          <!-- Charges -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:10px;margin-bottom:24px;overflow:hidden;border:1px solid #334155;">
            <tr style="background:#1e293b;">
              <td style="padding:12px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;" colspan="2">Charges</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#cbd5e1;font-size:13px;">${charges.roomCharges.description}</td>
              <td style="padding:10px 14px;color:#cbd5e1;font-size:13px;text-align:right;">₹${Number(charges.roomCharges.amount).toFixed(2)}</td>
            </tr>
            ${serviceRows}
            <tr style="background:#1e293b;border-top:2px solid #334155;">
              <td style="padding:14px;font-size:15px;font-weight:700;color:#22d3ee;">Total</td>
              <td style="padding:14px;font-size:18px;font-weight:800;color:#22d3ee;text-align:right;">₹${Number(totalAmount).toFixed(2)}</td>
            </tr>
          </table>

          <!-- Payment Status -->
          <div style="background:${paymentStatus === 'completed' ? '#064e3b' : '#78350f'};border-radius:10px;padding:14px 18px;margin-bottom:32px;border:1px solid ${paymentStatus === 'completed' ? '#059669' : '#d97706'};">
            <p style="margin:0;font-size:13px;font-weight:700;color:${paymentStatus === 'completed' ? '#34d399' : '#fbbf24'};">
              ${paymentStatus === 'completed' ? '✓ Payment Received' : '⏳ Payment Pending — Please settle at the front desk'}
            </p>
          </div>

          <p style="color:#64748b;font-size:13px;margin:0 0 8px;">We hope you had a wonderful stay. Please reach out if you have any concerns about this invoice.</p>
          <p style="color:#64748b;font-size:13px;margin:0;">We hope to see you again!</p>
        </td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f172a;padding:24px 40px;text-align:center;border-top:1px solid #334155;margin-top:32px;">
            <p style="margin:0;font-size:12px;color:#475569;">© 2025 HostHaven. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
        await resend.emails.send({
            from: FROM,
            to: guest.email,
            subject: `Your Invoice — HostHaven Stay | ${invoiceNumber}`,
            html,
        });
        console.log(`✉️  Invoice email sent to ${guest.email}`);
    } catch (err) {
        console.error('Failed to send invoice email:', err.message);
    }
};

module.exports = { sendBookingConfirmation, sendInvoiceEmail };
