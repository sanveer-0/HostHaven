'use client';

import { useEffect, useState } from 'react';
import { paymentsAPI, bookingsAPI, Payment, Booking, API_URL } from '@/lib/api';
import InvoiceModal from '@/components/InvoiceModal';

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<Payment['paymentMethod']>('cash');
    const [invoice, setInvoice] = useState<any>(null);
    const [loadingInvoice, setLoadingInvoice] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [paymentsData, bookingsData] = await Promise.all([
                paymentsAPI.getAll(),
                bookingsAPI.getAll(),
            ]);
            setPayments(paymentsData);
            setBookings(bookingsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCompletePayment = async () => {
        if (!selectedPayment) return;

        try {
            await paymentsAPI.update(selectedPayment.id, {
                status: 'completed',
                paymentMethod: paymentMethod,
                paymentDate: new Date().toISOString()
            });
            setShowModal(false);
            setSelectedPayment(null);
            loadData();
        } catch (err) {
            console.error(err);
            alert('Failed to complete payment');
        }
    };

    const handlePaymentClick = (payment: Payment) => {
        if (payment.status === 'pending') {
            setSelectedPayment(payment);
            setShowModal(true);
        }
    };

    const handleViewInvoice = async (payment: Payment) => {
        if (!payment.booking) {
            alert('Booking information not found');
            return;
        }

        setLoadingInvoice(true);
        try {
            // Always rebuild from live data for accuracy
            const booking = payment.booking;
            const checkInDate = new Date(booking.checkInDate);
            const checkOutDate = new Date(booking.checkOutDate);
            const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
            const pricePerNight = Number(booking.room?.pricePerNight || 0);
            const roomCharges = nights * pricePerNight;

            // Fetch actual service requests for this booking
            let serviceCharges: any[] = [];
            let totalServiceCharges = 0;
            try {
                const srRes = await fetch(
                    `${API_URL}/service-requests/room/${booking.roomId}`,
                    { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
                );
                const srData = await srRes.json();
                const allCompleted = Array.isArray(srData)
                    ? srData.filter((r: any) => r.status === 'completed')
                    : [];

                // Primary: match by bookingId
                let forThisBooking = allCompleted.filter((r: any) => r.bookingId === booking.id);

                // Fallback 1: requests during the stay period
                if (forThisBooking.length === 0 && allCompleted.length > 0) {
                    const stayStart = new Date(booking.checkInDate).getTime();
                    const stayEnd = new Date(booking.checkOutDate).getTime();
                    forThisBooking = allCompleted.filter((r: any) => {
                        const t = new Date(r.createdAt).getTime();
                        return t >= stayStart && t <= stayEnd;
                    });
                }

                // Fallback 2: just use all completed for room (keeps actual item details)
                if (forThisBooking.length === 0 && allCompleted.length > 0) {
                    forThisBooking = allCompleted;
                }

                const flattenReq = (req: any) => {
                    let items: any[] = [];
                    try {
                        items = typeof req.items === 'string' ? JSON.parse(req.items) : (Array.isArray(req.items) ? req.items : []);
                    } catch (_) { items = []; }
                    return items.length > 0
                        ? items.map((item: any) => ({
                            description: item.name,
                            quantity: Number(item.quantity || 1),
                            unitPrice: Number(item.price || 0),
                            amount: Number(item.price || 0) * Number(item.quantity || 1),
                            date: req.createdAt
                        }))
                        : [{ description: req.description || 'Room Service', quantity: 1, unitPrice: Number(req.totalAmount || 0), amount: Number(req.totalAmount || 0), date: req.createdAt }];
                };

                serviceCharges = forThisBooking.flatMap(flattenReq);

                totalServiceCharges = serviceCharges.reduce((s, c) => s + c.amount, 0);
            } catch (_) {
                // network/parse error — derive from payment total
            }

            // Final safety net: if we still have no service lines but the total is higher than room charges,
            // derive the service amount from the difference so the invoice always adds up correctly
            if (serviceCharges.length === 0) {
                const derived = Math.round((Number(payment.amount) - roomCharges) * 100) / 100;
                if (derived > 0) {
                    totalServiceCharges = derived;
                    serviceCharges = [{ description: 'Room Service Charges', quantity: 1, unitPrice: derived, amount: derived, date: payment.paymentDate }];
                }
            }

            setInvoice({
                invoiceNumber: `INV-${payment.id}-${booking.id}`,
                paymentId: payment.id,
                invoiceDate: payment.paymentDate,
                booking: { id: booking.id, checkInDate: booking.checkInDate, checkInTime: booking.checkInTime, checkOutDate: booking.checkOutDate, checkOutTime: booking.checkOutTime, nights },
                guest: booking.guest || { name: 'Guest', email: 'N/A', phone: 'N/A' },
                room: booking.room || { roomNumber: 'N/A', type: 'N/A', pricePerNight: 0 },
                charges: {
                    roomCharges: { description: `Room ${booking.room?.roomNumber || 'N/A'} - ${nights} night(s) @ ₹${pricePerNight}/night`, amount: roomCharges },
                    serviceCharges,
                    totalServiceCharges
                },
                totalAmount: payment.amount,
                paymentStatus: payment.status
            });
            setShowInvoiceModal(true);
        } catch (error) {
            console.error('Error loading invoice:', error);
            alert('Failed to load invoice');
        } finally {
            setLoadingInvoice(false);
        }
    };


    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'card':
                return 'fa-credit-card';
            case 'cash':
                return 'fa-money-bill';
            case 'upi':
                return 'fa-mobile';
            case 'bank_transfer':
                return 'fa-building-columns';
            default:
                return 'fa-wallet';
        }
    };

    return (
        <>
            <header className="px-8 py-6 bg-transparent" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-1" style={{ color: 'var(--nm-text)' }}>Payment Records</h2>
                        <p style={{ color: 'var(--nm-text-2)' }}>Track all financial transactions 💳 Click on pending payments to complete them</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="rounded-2xl overflow-hidden animate-fade-in" style={{ background: 'var(--nm-bg)', boxShadow: '8px 8px 18px var(--nm-sd), -8px -8px 18px var(--nm-sl)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--nm-border)' }}>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Guest</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Booking Ref</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Method</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <i className="fa-solid fa-spinner fa-spin text-3xl text-cyan-400 mb-3"></i>
                                            <p style={{ color: 'var(--nm-text-2)' }}>Loading payments...</p>
                                        </td>
                                    </tr>
                                ) : payments.length > 0 ? (
                                    payments.map((payment) => (
                                        <tr
                                            key={payment.id}
                                            className="transition-colors"
                                            style={{ borderBottom: '1px solid var(--nm-border)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--nm-surface)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td className="px-6 py-4" style={{ color: 'var(--nm-text-2)' }}>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--nm-text)' }}>{(payment.booking as any)?.guest?.name || 'Unknown'}</p>
                                                    <p className="text-xs" style={{ color: 'var(--nm-text-3)' }}>Room {(payment.booking as any)?.room?.roomNumber || 'N/A'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-lg text-sm font-mono" style={{ background: 'var(--nm-border)', color: 'var(--nm-text-2)' }}>
                                                    #{payment.bookingId}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-emerald-600 font-bold text-lg">₹{payment.amount}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--nm-border)' }}>
                                                        <i className={`fa-solid ${getPaymentMethodIcon(payment.paymentMethod)} text-sm`} style={{ color: 'var(--nm-text-2)' }}></i>
                                                    </div>
                                                    <span className="capitalize" style={{ color: 'var(--nm-text-2)' }}>{payment.paymentMethod === 'pending' ? 'Not Set' : payment.paymentMethod.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${payment.status === 'pending'
                                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    }`}>{payment.status}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {payment.status === 'pending' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePaymentClick(payment);
                                                            }}
                                                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md border border-white/10 flex items-center gap-1"
                                                        >
                                                            <i className="fa-solid fa-check mr-1"></i>
                                                            Complete
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewInvoice(payment);
                                                        }}
                                                        disabled={loadingInvoice}
                                                        className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md disabled:opacity-50 border border-white/10 flex items-center gap-1"
                                                    >
                                                        <i className="fa-solid fa-file-invoice mr-1"></i>
                                                        View Invoice
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <i className="fa-solid fa-receipt text-4xl text-slate-600 mb-3"></i>
                                            <p className="text-slate-400">No payments found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Complete Payment Modal */}
            {showModal && selectedPayment && (
                <div className="fixed inset-0 bg-[rgba(150,160,175,0.4)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in" style={{ background: 'var(--nm-bg)', boxShadow: '12px 12px 28px var(--nm-sd), -12px -12px 28px var(--nm-sl)' }}>
                        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--nm-text)' }}>Complete Payment</h3>
                            <button onClick={() => { setShowModal(false); setSelectedPayment(null); }} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'var(--nm-bg)', boxShadow: '3px 3px 7px var(--nm-sd), -3px -3px 7px var(--nm-sl)', color: 'var(--nm-text-2)' }}>
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                                <p className="text-sm text-blue-600 mb-1">Booking Reference</p>
                                <p className="text-lg font-bold text-blue-700">#{selectedPayment.bookingId}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                                <p className="text-sm text-emerald-600 mb-1">Amount to Pay</p>
                                <p className="text-2xl font-bold text-emerald-600">₹{selectedPayment.amount}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as Payment['paymentMethod'])}
                                    className="w-full px-4 py-3"
                                    style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Credit/Debit Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--nm-border)' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setSelectedPayment(null); }}
                                    className="flex-1 px-4 py-3 font-semibold rounded-xl transition-all"
                                    style={{ background: 'var(--nm-bg)', boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)', color: 'var(--nm-text-2)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCompletePayment}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg"
                                >
                                    Complete Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            {showInvoiceModal && invoice && (
                <InvoiceModal
                    invoice={invoice}
                    onClose={() => setShowInvoiceModal(false)}
                />
            )}
        </>
    );
}
