'use client';

import { useEffect, useState } from 'react';
import { bookingsAPI, roomsAPI, Booking, Room } from '@/lib/api';
import InvoiceModal from '@/components/InvoiceModal';

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
            setBookings(bookingsData);
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
            const guestResponse = await fetch('http://localhost:5000/api/guests', {
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
                roomId: formData.roomId,
                checkInDate: formData.checkInDate,
                checkOutDate: formData.checkOutDate,
                checkInTime: currentTime, // Add current time
                numberOfGuests: formData.numberOfGuests,
                totalAmount: totalAmount,
                bookingStatus: formData.bookingStatus,
            });

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
                return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            case 'pending':
                return 'bg-amber-100 text-amber-700 border-amber-300';
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-300';
            case 'checked-out':
                return 'bg-slate-100 text-slate-700 border-slate-300';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    };

    return (
        <>
            <header className="px-8 py-6 border-b border-white/60 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-1">All Bookings</h2>
                        <p className="text-slate-600">Manage and track all reservations 📅</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2"
                    >
                        <i className="fa-solid fa-plus"></i>
                        <span>New Booking</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden shadow-lg animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Guest</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Room</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Check In</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Check Out</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Guests</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <i className="fa-solid fa-spinner fa-spin text-3xl text-cyan-500 mb-3"></i>
                                            <p className="text-slate-600">Loading bookings...</p>
                                        </td>
                                    </tr>
                                ) : bookings.length > 0 ? (
                                    bookings.map((booking) => (
                                        <tr
                                            key={booking.id}
                                            className="hover:bg-cyan-50/30 transition-colors group"
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-semibold shadow-md">
                                                        {booking.guest?.name?.[0] || 'U'}
                                                    </div>
                                                    <span className="text-slate-800 font-medium">{booking.guest?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-700 font-medium">{booking.room?.roomNumber || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-600">
                                                    <div>{new Date(booking.checkInDate).toLocaleDateString()}</div>
                                                    {booking.checkInTime && <div className="text-xs text-blue-600 font-semibold">{booking.checkInTime}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-600">
                                                    <div>{new Date(booking.checkOutDate).toLocaleDateString()}</div>
                                                    {booking.checkOutTime && <div className="text-xs text-blue-600 font-semibold">{booking.checkOutTime}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{booking.numberOfGuests}</td>
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
                                                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold rounded-lg transition-all shadow-md flex items-center gap-2"
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
                                            <i className="fa-solid fa-calendar-xmark text-4xl text-slate-300 mb-3"></i>
                                            <p className="text-slate-500">No bookings found</p>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 my-8 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">New Booking</h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Room & Booking Details - FIRST */}
                            <div className="bg-cyan-50 p-4 rounded-xl">
                                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-door-open text-cyan-600"></i>
                                    Room & Booking Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Select Room *</label>
                                        <select
                                            value={formData.roomId}
                                            onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                                            required
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                        >
                                            <option value="">Select a room</option>
                                            {rooms.map(room => (
                                                <option key={room.id} value={room.id}>{room.roomNumber} - {room.type} (${room.pricePerNight}/night)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Check In Date *</label>
                                        <input
                                            type="date"
                                            value={formData.checkInDate}
                                            onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                                            required
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Check Out Date *</label>
                                        <input
                                            type="date"
                                            value={formData.checkOutDate}
                                            onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                                            required
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                        />
                                        {!formData.roomId && (
                                            <p className="text-xs text-amber-600 mt-1">Please select a room first</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Primary Guest Information - SECOND */}
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-user-tie text-blue-600"></i>
                                    Primary Guest Information
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                                        <input
                                            type="text"
                                            value={formData.primaryGuest.name}
                                            onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, name: e.target.value } })}
                                            required
                                            placeholder="John Doe"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                                        <input
                                            type="email"
                                            value={formData.primaryGuest.email}
                                            onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, email: e.target.value } })}
                                            required
                                            placeholder="john@example.com"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone *</label>
                                        <input
                                            type="tel"
                                            value={formData.primaryGuest.phone}
                                            onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, phone: e.target.value } })}
                                            required
                                            placeholder="+91 98765 43210"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">ID Proof Type *</label>
                                        <select
                                            value={formData.primaryGuest.idProofType}
                                            onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, idProofType: e.target.value } })}
                                            required
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                        >
                                            <option value="national_id">National ID / Aadhar</option>
                                            <option value="passport">Passport</option>
                                            <option value="driving_license">Driving License</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">ID Proof Number *</label>
                                        <input
                                            type="text"
                                            value={formData.primaryGuest.idProofNumber}
                                            onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, idProofNumber: e.target.value } })}
                                            required
                                            placeholder="1234 5678 9012"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Address *</label>
                                        <input
                                            type="text"
                                            value={formData.primaryGuest.address}
                                            onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, address: e.target.value } })}
                                            required
                                            placeholder="123 Beach Street, Mumbai"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Guests - THIRD */}
                            {formData.numberOfGuests > 1 && (
                                <div className="bg-teal-50 p-4 rounded-xl">
                                    <div className="mb-4">
                                        <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <i className="fa-solid fa-users text-teal-600"></i>
                                            Secondary Guests ({formData.secondaryGuests.length})
                                        </h4>
                                        <p className="text-xs text-slate-600 mt-1">
                                            Forms auto-generated based on total guest count
                                        </p>
                                    </div>
                                    {formData.secondaryGuests.length > 0 ? (
                                        <div className="space-y-3">
                                            {formData.secondaryGuests.map((guest, index) => (
                                                <div key={index} className="bg-white p-4 rounded-lg border border-teal-200">
                                                    <p className="text-sm font-semibold text-slate-700 mb-3">Guest #{index + 2}</p>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="col-span-2">
                                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                                                            <input
                                                                type="text"
                                                                value={guest.name}
                                                                onChange={(e) => updateSecondaryGuest(index, 'name', e.target.value)}
                                                                placeholder="Guest name"
                                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={guest.age}
                                                                onChange={(e) => updateSecondaryGuest(index, 'age', parseInt(e.target.value))}
                                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200"
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

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg"
                                >
                                    Create Booking
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Booking Details Modal */}
            {showDetailsModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">Booking Details</h3>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Guest Information */}
                            <div className="bg-blue-50 p-5 rounded-xl">
                                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-user text-blue-600"></i>
                                    Guest Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Name</p>
                                        <p className="text-sm font-semibold text-slate-800">{selectedBooking.guest?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Email</p>
                                        <p className="text-sm font-semibold text-slate-800">{selectedBooking.guest?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Phone</p>
                                        <p className="text-sm font-semibold text-slate-800">{selectedBooking.guest?.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Address</p>
                                        <p className="text-sm font-semibold text-slate-800">{selectedBooking.guest?.address || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">ID Proof Type</p>
                                        <p className="text-sm font-semibold text-slate-800 capitalize">{selectedBooking.guest?.idProofType?.replace('_', ' ') || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">ID Proof Number</p>
                                        <p className="text-sm font-semibold text-slate-800">{selectedBooking.guest?.idProofNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Room Information */}
                            <div className="bg-teal-50 p-5 rounded-xl">
                                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-door-open text-teal-600"></i>
                                    Room Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Room Number</p>
                                        <p className="text-sm font-semibold text-slate-800">{selectedBooking.room?.roomNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Room Type</p>
                                        <p className="text-sm font-semibold text-slate-800 capitalize">{selectedBooking.room?.type || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Price per Night</p>
                                        <p className="text-sm font-semibold text-slate-800">${selectedBooking.room?.pricePerNight || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Capacity</p>
                                        <p className="text-sm font-semibold text-slate-800">{selectedBooking.room?.capacity || 'N/A'} guests</p>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Information */}
                            <div className="bg-purple-50 p-5 rounded-xl">
                                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-calendar-check text-purple-600"></i>
                                    Booking Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Check-In Date</p>
                                        <p className="text-sm font-semibold text-slate-800">{new Date(selectedBooking.checkInDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                        {selectedBooking.checkInTime && <p className="text-xs text-blue-600 font-semibold mt-1">@ {selectedBooking.checkInTime}</p>}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Check-Out Date</p>
                                        <p className="text-sm font-semibold text-slate-800">{new Date(selectedBooking.checkOutDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                        {selectedBooking.checkOutTime && <p className="text-xs text-blue-600 font-semibold mt-1">@ {selectedBooking.checkOutTime}</p>}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Number of Guests</p>
                                        <p className="text-sm font-semibold text-slate-800">{selectedBooking.numberOfGuests}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Total Amount</p>
                                        <p className="text-sm font-semibold text-slate-800">${selectedBooking.totalAmount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Payment Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${selectedBooking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                            selectedBooking.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {selectedBooking.paymentStatus}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 mb-1">Booking Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(selectedBooking.bookingStatus)}`}>
                                            {selectedBooking.bookingStatus}
                                        </span>
                                    </div>
                                </div>
                                {selectedBooking.specialRequests && (
                                    <div className="mt-4">
                                        <p className="text-xs text-slate-600 mb-1">Special Requests</p>
                                        <p className="text-sm text-slate-800">{selectedBooking.specialRequests}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg"
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
