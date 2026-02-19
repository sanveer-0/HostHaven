'use client';

import { useEffect, useState } from 'react';
import { bookingsAPI, roomsAPI, Booking, Room } from '@/lib/api';
import InvoiceModal from '@/components/InvoiceModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hosthaven-backend.onrender.com/api';

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [invoice, setInvoice] = useState<any>(null);
    const [formData, setFormData] = useState({
        primaryGuest: {
            name: '',
            email: '',
            phone: '',
            address: '',
            idProofType: 'national_id',
            idProofNumber: '',
        },
        secondaryGuests: [] as { name: string; age: number }[],
        roomId: '',
        checkInDate: '',
        checkOutDate: '',
        numberOfGuests: 1,
        bookingStatus: 'checked-in',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [bookingsData, roomsData] = await Promise.all([
                bookingsAPI.getAll(),
                roomsAPI.getAll(),
            ]);
            setBookings(bookingsData.sort((a: Booking, b: Booking) => b.id - a.id));
            setRooms(roomsData.filter((r: Room) => r.status === 'available'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async (bookingId: number) => {
        if (!confirm('Are you sure you want to checkout this guest? This will generate the final invoice.')) {
            return;
        }

        try {
            const data = await bookingsAPI.checkout(bookingId);
            setInvoice(data.invoice);
            setShowInvoiceModal(true);
            loadData();
        } catch (error: any) {
            console.error('Checkout error:', error);
            alert(`Checkout failed: ${error.message}`);
        }
    };

    // Get selected room details
    const selectedRoom = rooms.find(r => String(r.id) === String(formData.roomId));
    const maxGuests = selectedRoom?.capacity || 10;

    // Handle number of guests change - automatically adjust secondary guests
    const handleGuestCountChange = (count: number) => {
        const secondaryCount = Math.max(0, count - 1); // -1 for primary guest
        const currentSecondary = formData.secondaryGuests.length;

        let newSecondaryGuests = [...formData.secondaryGuests];

        if (secondaryCount > currentSecondary) {
            // Add more secondary guests
            for (let i = currentSecondary; i < secondaryCount; i++) {
                newSecondaryGuests.push({ name: '', age: 18 });
            }
        } else if (secondaryCount < currentSecondary) {
            // Remove excess secondary guests
            newSecondaryGuests = newSecondaryGuests.slice(0, secondaryCount);
        }

        setFormData({
            ...formData,
            numberOfGuests: count,
            secondaryGuests: newSecondaryGuests,
        });
    };

    const updateSecondaryGuest = (index: number, field: 'name' | 'age', value: string | number) => {
        const updated = [...formData.secondaryGuests];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, secondaryGuests: updated });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Calculate total amount
            const room = rooms.find(r => String(r.id) === String(formData.roomId));
            if (!room) {
                alert('Please select a valid room');
                return;
            }

            const checkIn = new Date(formData.checkInDate);
            const checkOut = new Date(formData.checkOutDate);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            const totalAmount = nights * room.pricePerNight;

            // Get current time in HH:MM format
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            // First create the primary guest
            const guestResponse = await fetch(`${API_URL}/guests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    name: formData.primaryGuest.name,
                    email: formData.primaryGuest.email,
                    phone: formData.primaryGuest.phone,
                    address: formData.primaryGuest.address,
                    idProofType: formData.primaryGuest.idProofType,
                    idProofNumber: formData.primaryGuest.idProofNumber,
                }),
            });

            if (!guestResponse.ok) {
                const errorData = await guestResponse.json();
                throw new Error(errorData.message || 'Failed to create guest');
            }
            const guest = await guestResponse.json();

            // Then create the booking with check-in time
            await bookingsAPI.create({
                guestId: guest.id,
                roomId: parseInt(formData.roomId),
                checkInDate: formData.checkInDate,
                checkOutDate: formData.checkOutDate,
                checkInTime: currentTime, // Add current time
                numberOfGuests: formData.numberOfGuests,
                totalAmount: totalAmount,
                bookingStatus: formData.bookingStatus as any,
                secondaryGuests: formData.secondaryGuests,
            } as any);

            setShowModal(false);
            setFormData({
                primaryGuest: { name: '', email: '', phone: '', address: '', idProofType: 'national_id', idProofNumber: '' },
                secondaryGuests: [],
                roomId: '',
                checkInDate: '',
                checkOutDate: '',
                numberOfGuests: 1,
                bookingStatus: 'checked-in',
            });
            loadData();
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to create booking');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
            case 'checked-in':
                return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'pending':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'cancelled':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'checked-out':
                return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
            default:
                return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    return (
        <>
            <header className="px-8 py-6 border-b border-white/5 bg-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100 mb-1 drop-shadow-lg">All Bookings</h2>
                        <p className="text-slate-300">Manage and track all reservations 📅</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg shadow-cyan-900/30 flex items-center gap-2 border border-white/10"
                    >
                        <i className="fa-solid fa-plus"></i>
                        <span>New Booking</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="glass-card-dark rounded-2xl overflow-hidden shadow-lg animate-fade-in border border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-white/5">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Guest</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Room</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Check In</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Check Out</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Guests</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <i className="fa-solid fa-spinner fa-spin text-3xl text-cyan-400 mb-3"></i>
                                            <p className="text-slate-400">Loading bookings...</p>
                                        </td>
                                    </tr>
                                ) : bookings.length > 0 ? (
                                    bookings.map((booking) => (
                                        <tr
                                            key={booking.id}
                                            className="hover:bg-white/5 transition-colors group cursor-pointer"
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-cyan-900/30">
                                                        {booking.guest?.name?.[0] || 'U'}
                                                    </div>
                                                    <span className="text-slate-200 font-medium group-hover:text-cyan-300 transition-colors">{booking.guest?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-300 font-medium">{booking.room?.roomNumber || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-400">
                                                    <div>{new Date(booking.checkInDate).toLocaleDateString()}</div>
                                                    {booking.checkInTime && <div className="text-xs text-cyan-400 font-semibold">{booking.checkInTime}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-400">
                                                    <div>{new Date(booking.checkOutDate).toLocaleDateString()}</div>
                                                    {booking.checkOutTime && <div className="text-xs text-cyan-400 font-semibold">{booking.checkOutTime}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">{booking.numberOfGuests}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${getStatusColor(booking.bookingStatus)}`}>
                                                    {booking.bookingStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {booking.bookingStatus === 'checked-in' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCheckout(booking.id);
                                                        }}
                                                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-lg transition-all shadow-md border border-white/10 flex items-center gap-2"
                                                    >
                                                        <i className="fa-solid fa-right-from-bracket"></i>
                                                        Checkout
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <i className="fa-solid fa-calendar-xmark text-4xl text-slate-600 mb-3 animate-pulse"></i>
                                            <p className="text-slate-400">No bookings found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Booking Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card-dark rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-scale-in border border-white/10">
                        <div className="flex-none flex items-center justify-between p-6 border-b border-white/10">
                            <h3 className="text-2xl font-bold text-slate-100">New Booking</h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-slate-800/50 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Room & Booking Details - FIRST */}
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-door-open text-cyan-400"></i>
                                        Room & Booking Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">Select Room *</label>
                                            <select
                                                value={formData.roomId}
                                                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                                            >
                                                <option value="" className="bg-slate-800">Select a room</option>
                                                {rooms.map(room => (
                                                    <option key={room.id} value={room.id} className="bg-slate-800 text-slate-100">{room.roomNumber} - {room.type} (${room.pricePerNight}/night)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">Check In Date *</label>
                                            <input
                                                type="date"
                                                value={formData.checkInDate}
                                                min={new Date().toLocaleDateString('en-CA')}
                                                onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value, checkOutDate: '' })}
                                                required
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">Check Out Date *</label>
                                            <input
                                                type="date"
                                                value={formData.checkOutDate}
                                                min={formData.checkInDate
                                                    ? new Date(new Date(formData.checkInDate).getTime() + 86400000).toLocaleDateString('en-CA')
                                                    : new Date().toLocaleDateString('en-CA')}
                                                onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">
                                                Total Number of Guests *
                                                {selectedRoom && <span className="text-xs text-slate-500 ml-2">(Max: {maxGuests})</span>}
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={maxGuests}
                                                value={formData.numberOfGuests}
                                                onChange={(e) => handleGuestCountChange(parseInt(e.target.value) || 1)}
                                                required
                                                disabled={!formData.roomId}
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            {!formData.roomId && (
                                                <p className="text-xs text-amber-500/80 mt-1">Please select a room first</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Primary Guest Information - SECOND */}
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-user-tie text-blue-400"></i>
                                        Primary Guest Information
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">Full Name *</label>
                                            <input
                                                type="text"
                                                value={formData.primaryGuest.name}
                                                onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, name: e.target.value } })}
                                                required
                                                placeholder="John Doe"
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">Email *</label>
                                            <input
                                                type="email"
                                                value={formData.primaryGuest.email}
                                                onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, email: e.target.value } })}
                                                required
                                                placeholder="john@example.com"
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">Phone *</label>
                                            <input
                                                type="tel"
                                                value={formData.primaryGuest.phone}
                                                onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, phone: e.target.value } })}
                                                required
                                                placeholder="+91 98765 43210"
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">ID Proof Type *</label>
                                            <select
                                                value={formData.primaryGuest.idProofType}
                                                onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, idProofType: e.target.value } })}
                                                required
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                                            >
                                                <option value="national_id">National ID / Aadhar</option>
                                                <option value="passport">Passport</option>
                                                <option value="driving_license">Driving License</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">ID Proof Number *</label>
                                            <input
                                                type="text"
                                                value={formData.primaryGuest.idProofNumber}
                                                onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, idProofNumber: e.target.value } })}
                                                required
                                                placeholder="1234 5678 9012"
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-400 mb-2">Address *</label>
                                            <input
                                                type="text"
                                                value={formData.primaryGuest.address}
                                                onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, address: e.target.value } })}
                                                required
                                                placeholder="123 Beach Street, Mumbai"
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Guests - THIRD */}
                                {formData.numberOfGuests > 1 && (
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                        <div className="mb-4">
                                            <h4 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                                                <i className="fa-solid fa-users text-teal-400"></i>
                                                Secondary Guests ({formData.secondaryGuests.length})
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Forms auto-generated based on total guest count
                                            </p>
                                        </div>
                                        {formData.secondaryGuests.length > 0 ? (
                                            <div className="space-y-3">
                                                {formData.secondaryGuests.map((guest, index) => (
                                                    <div key={index} className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                                                        <p className="text-sm font-semibold text-slate-300 mb-3">Guest #{index + 2}</p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="col-span-2">
                                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={guest.name}
                                                                    onChange={(e) => updateSecondaryGuest(index, 'name', e.target.value)}
                                                                    placeholder="Guest name"
                                                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Age</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={guest.age}
                                                                    onChange={(e) => updateSecondaryGuest(index, 'age', parseInt(e.target.value))}
                                                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">Increase guest count to add secondary guests</p>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-all border border-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-900/20"
                                    >
                                        Create Booking
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Details Modal */}
            {showDetailsModal && selectedBooking && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card-dark rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in border border-white/10">
                        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                            <h3 className="text-2xl font-bold text-slate-100">Booking Details</h3>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Guest Information */}
                            <div className="bg-slate-800/50 p-5 rounded-xl border border-white/5">
                                <h4 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-user text-blue-400"></i>
                                    Guest Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Name</p>
                                        <p className="text-sm font-semibold text-slate-100">{selectedBooking.guest?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Email</p>
                                        <p className="text-sm font-semibold text-slate-100">{selectedBooking.guest?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Phone</p>
                                        <p className="text-sm font-semibold text-slate-100">{selectedBooking.guest?.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Address</p>
                                        <p className="text-sm font-semibold text-slate-100">{selectedBooking.guest?.address || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">ID Proof Type</p>
                                        <p className="text-sm font-semibold text-slate-100 capitalize">{selectedBooking.guest?.idProofType?.replace('_', ' ') || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">ID Proof Number</p>
                                        <p className="text-sm font-semibold text-slate-100">{selectedBooking.guest?.idProofNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Guests */}
                            {selectedBooking.secondaryGuests && selectedBooking.secondaryGuests.length > 0 && (
                                <div className="bg-slate-800/50 p-5 rounded-xl border border-white/5">
                                    <h4 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-users text-purple-400"></i>
                                        Additional Guests
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedBooking.secondaryGuests.map((guest: any, index: number) => (
                                            <div key={index} className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                                                    {guest.name?.[0] || 'G'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-200">{guest.name || 'Unknown'}</p>
                                                    <p className="text-xs text-slate-400">Age: {guest.age || 'N/A'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Room Information */}
                            <div className="bg-slate-800/50 p-5 rounded-xl border border-white/5">
                                <h4 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-door-open text-teal-400"></i>
                                    Room Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Room Number</p>
                                        <p className="text-sm font-semibold text-slate-100">{selectedBooking.room?.roomNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Room Type</p>
                                        <p className="text-sm font-semibold text-slate-100 capitalize">{selectedBooking.room?.type || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Price per Night</p>
                                        <p className="text-sm font-semibold text-slate-100">${selectedBooking.room?.pricePerNight || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Capacity</p>
                                        <p className="text-sm font-semibold text-slate-100">{selectedBooking.room?.capacity || 'N/A'} guests</p>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Information */}
                            <div className="bg-slate-800/50 p-5 rounded-xl border border-white/5">
                                <h4 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-calendar-check text-purple-400"></i>
                                    Booking Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Check-In Date</p>
                                        <p className="text-sm font-semibold text-slate-100">{new Date(selectedBooking.checkInDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                        {selectedBooking.checkInTime && <p className="text-xs text-cyan-400 font-semibold mt-1">@ {selectedBooking.checkInTime}</p>}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Check-Out Date</p>
                                        <p className="text-sm font-semibold text-slate-100">{new Date(selectedBooking.checkOutDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                        {selectedBooking.checkOutTime && <p className="text-xs text-cyan-400 font-semibold mt-1">@ {selectedBooking.checkOutTime}</p>}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Number of Guests</p>
                                        <p className="text-sm font-semibold text-slate-100">{selectedBooking.numberOfGuests}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Total Amount</p>
                                        <p className="text-sm font-semibold text-slate-100">${selectedBooking.totalAmount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Payment Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${selectedBooking.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' :
                                            selectedBooking.paymentStatus === 'partial' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            {selectedBooking.paymentStatus}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Booking Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(selectedBooking.bookingStatus)}`}>
                                            {selectedBooking.bookingStatus}
                                        </span>
                                    </div>
                                </div>
                                {selectedBooking.specialRequests && (
                                    <div className="mt-4">
                                        <p className="text-xs text-slate-400 mb-1">Special Requests</p>
                                        <p className="text-sm text-slate-100">{selectedBooking.specialRequests}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-900/20"
                            >
                                Close
                            </button>
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
