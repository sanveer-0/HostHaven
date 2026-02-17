'use client';

import { useEffect, useState } from 'react';
import { paymentsAPI, bookingsAPI, Payment, Booking } from '@/lib/api';
import InvoiceModal from '@/components/InvoiceModal';

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
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
            const booking = payment.booking;

            console.log('Payment data:', payment);
            console.log('Booking data:', booking);
            console.log('Room data:', booking.room);
            console.log('Guest data:', booking.guest);

            // Fetch service requests for this booking
            const serviceRequestsResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/service-requests?roomId=${booking.roomId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            const serviceRequests = await serviceRequestsResponse.json();

            // Filter completed service requests for this booking
            const completedServices = Array.isArray(serviceRequests)
                ? serviceRequests.filter((req: any) => req.status === 'completed')
                : [];

            // Calculate service charges
            const serviceCharges = completedServices.map((req: any) => ({
                description: req.description,
                items: req.items,
                amount: parseFloat(req.totalAmount || 0),
                date: req.createdAt
            }));

            const totalServiceCharges = serviceCharges.reduce((sum, charge) => sum + charge.amount, 0);

            // Calculate room charges
            const checkInDate = new Date(booking.checkInDate);
            const checkOutDate = new Date(booking.checkOutDate);
            const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
            const pricePerNight = booking.room?.pricePerNight || 0;
            const roomCharges = nights * pricePerNight;

            console.log('Nights:', nights);
            console.log('Price per night:', pricePerNight);
            console.log('Room charges:', roomCharges);
            console.log('Service charges:', totalServiceCharges);
            console.log('Payment amount:', payment.amount);

            // If room charges are 0, use payment amount minus service charges
            const finalRoomCharges = roomCharges > 0 ? roomCharges : (payment.amount - totalServiceCharges);

            // Reconstruct invoice from payment and booking data
            const invoiceData = {
                invoiceNumber: `INV-${payment.id}-${Date.now()}`,
                paymentId: payment.id,
                invoiceDate: payment.paymentDate,
                booking: {
                    id: booking.id,
                    checkInDate: booking.checkInDate,
                    checkOutDate: booking.checkOutDate,
                    nights: nights
                },
                guest: booking.guest || {
                    name: 'Guest',
                    email: 'N/A',
                    phone: 'N/A'
                },
                room: booking.room || {
                    roomNumber: 'N/A',
                    type: 'N/A',
                    pricePerNight: 0
                },
                charges: {
                    roomCharges: {
                        description: `Room ${booking.room?.roomNumber || 'N/A'} - ${nights} night(s) @ ₹${pricePerNight}/night`,
                        amount: finalRoomCharges
                    },
                    serviceCharges: serviceCharges,
                    totalServiceCharges: totalServiceCharges
                },
                totalAmount: payment.amount,
                paymentStatus: payment.status
            };

            console.log('Invoice data:', invoiceData);
            setInvoice(invoiceData);
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
            <header className="px-8 py-6 border-b border-white/60 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-1">Payment Records</h2>
                        <p className="text-slate-600">Track all financial transactions 💳 Click on pending payments to complete them</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden shadow-lg animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Booking Ref</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <i className="fa-solid fa-spinner fa-spin text-3xl text-cyan-500 mb-3"></i>
                                            <p className="text-slate-600">Loading payments...</p>
                                        </td>
                                    </tr>
                                ) : payments.length > 0 ? (
                                    payments.map((payment) => (
                                        <tr
                                            key={payment.id}
                                            className="hover:bg-emerald-50/30 transition-colors group"
                                        >
                                            <td className="px-6 py-4 text-slate-700">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-mono">
                                                    #{payment.bookingId}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-emerald-600 font-bold text-lg">₹{payment.amount}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                        <i className={`fa-solid ${getPaymentMethodIcon(payment.paymentMethod)} text-slate-600 text-sm`}></i>
                                                    </div>
                                                    <span className="text-slate-700 capitalize">{payment.paymentMethod === 'pending' ? 'Not Set' : payment.paymentMethod.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${payment.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                                    : 'bg-emerald-100 text-emerald-700 border-emerald-300'
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
                                                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-semibold rounded-lg transition-all shadow-md"
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
                                                        className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-semibold rounded-lg transition-all shadow-md disabled:opacity-50"
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
                                            <i className="fa-solid fa-receipt text-4xl text-slate-300 mb-3"></i>
                                            <p className="text-slate-500">No payments found</p>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">Complete Payment</h3>
                            <button onClick={() => { setShowModal(false); setSelectedPayment(null); }} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <p className="text-sm text-slate-600 mb-1">Booking Reference</p>
                                <p className="text-lg font-bold text-slate-800">#{selectedPayment.bookingId}</p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-xl">
                                <p className="text-sm text-slate-600 mb-1">Amount to Pay</p>
                                <p className="text-2xl font-bold text-emerald-600">₹{selectedPayment.amount}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Credit/Debit Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setSelectedPayment(null); }}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCompletePayment}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg"
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
