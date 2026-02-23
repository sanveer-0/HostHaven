'use client';

import { useEffect, useState } from 'react';
import { bookingsAPI, roomsAPI, Booking, Room, API_URL } from '@/lib/api';
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
    const [today, setToday] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [formError, setFormError] = useState<string>('');
    const [guestHistoryGuest, setGuestHistoryGuest] = useState<{ name: string; phone: string; email: string; guestId: number } | null>(null);

    // Filter bookings by guest name, phone or email
    const filteredBookings = bookings.filter(b => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            b.guest?.name?.toLowerCase().includes(q) ||
            (b.guest as any)?.phone?.toLowerCase().includes(q) ||
            b.guest?.email?.toLowerCase().includes(q)
        );
    });

    // Get all bookings for a specific guest (for history modal)
    const guestHistory = guestHistoryGuest
        ? bookings.filter(b => b.guestId === guestHistoryGuest.guestId)
        : [];
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
        // Compute today's date on the client to avoid stale build-time values
        setToday(new Date().toISOString().split('T')[0]);
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
        setFormError('');
        try {
            // Client-side pre-validation
            if (!formData.primaryGuest.name.trim()) { setFormError('Guest name is required.'); return; }
            if (!formData.primaryGuest.phone.trim()) { setFormError('Phone number is required.'); return; }
            if (!formData.primaryGuest.address.trim()) { setFormError('Address is required.'); return; }
            if (!formData.primaryGuest.idProofNumber.trim()) { setFormError('ID proof number is required.'); return; }

            // Calculate total amount
            const room = rooms.find(r => String(r.id) === String(formData.roomId));
            if (!room) {
                setFormError('Please select a valid room.');
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
                    email: formData.primaryGuest.email.trim() || null,
                    phone: formData.primaryGuest.phone,
                    address: formData.primaryGuest.address,
                    idProofType: formData.primaryGuest.idProofType,
                    idProofNumber: formData.primaryGuest.idProofNumber,
                }),
            });

            if (!guestResponse.ok) {
                const errorData = await guestResponse.json();
                // Use specific field messages if available (new backend format)
                if (errorData.fields && errorData.fields.length > 0) {
                    const fieldMessages = errorData.fields.map((f: any) => f.message).join('\n');
                    throw new Error(fieldMessages);
                }
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
            setFormError(err.message || 'Failed to create booking. Please check all fields.');
            // Reload rooms so the dropdown reflects current availability
            loadData();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
            case 'checked-in':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'pending':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'cancelled':
                return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'checked-out':
                return 'bg-slate-100 text-slate-600 border-slate-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <>
            <header className="px-8 py-6 bg-transparent" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-1" style={{ color: 'var(--nm-text)' }}>All Bookings</h2>
                        <p style={{ color: 'var(--nm-text-2)' }}>Manage and track all reservations 📅</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2"
                        style={{ boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)' }}
                    >
                        <i className="fa-solid fa-plus"></i>
                        <span>New Booking</span>
                    </button>
                </div>
            </header>

            {/* Guest Search Bar */}
            <div className="px-8 py-3 flex items-center gap-4" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                <div className="relative flex-1 max-w-md">
                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--nm-text-3)' }}></i>
                    <input
                        type="text"
                        placeholder="Search guest by name, phone or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 text-sm transition-all"
                        style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--nm-text-3)' }}>
                            <i className="fa-solid fa-times text-xs"></i>
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <p className="text-sm" style={{ color: 'var(--nm-text-2)' }}>
                        <span className="text-teal-600 font-semibold">{filteredBookings.length}</span> result{filteredBookings.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                    </p>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="rounded-2xl overflow-hidden animate-fade-in" style={{ background: 'var(--nm-bg)', boxShadow: '8px 8px 18px var(--nm-sd), -8px -8px 18px var(--nm-sl)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--nm-border)' }}>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Guest</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Room</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Check In</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Check Out</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Guests</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <i className="fa-solid fa-spinner fa-spin text-3xl text-teal-400 mb-3"></i>
                                            <p style={{ color: 'var(--nm-text-2)' }}>Loading bookings...</p>
                                        </td>
                                    </tr>
                                ) : filteredBookings.length > 0 ? (
                                    filteredBookings.map((booking) => (
                                        <tr
                                            key={booking.id}
                                            className="transition-colors cursor-pointer"
                                            style={{ borderBottom: '1px solid var(--nm-border)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--nm-surface)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-md">
                                                        {booking.guest?.name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setGuestHistoryGuest({ name: booking.guest?.name || 'Unknown', phone: (booking.guest as any)?.phone || '', email: booking.guest?.email || '', guestId: booking.guestId }); }}
                                                            className="font-medium hover:text-teal-600 transition-colors hover:underline text-left"
                                                            style={{ color: 'var(--nm-text)' }}
                                                        >
                                                            {booking.guest?.name || 'Unknown'}
                                                        </button>
                                                        {(booking.guest as any)?.phone && <p className="text-xs" style={{ color: 'var(--nm-text-3)' }}>{(booking.guest as any).phone}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium" style={{ color: 'var(--nm-text)' }}>{booking.room?.roomNumber || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div style={{ color: 'var(--nm-text-2)' }}>
                                                    <div>{new Date(booking.checkInDate).toLocaleDateString()}</div>
                                                    {booking.checkInTime && <div className="text-xs text-teal-600 font-semibold">{booking.checkInTime}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div style={{ color: 'var(--nm-text-2)' }}>
                                                    <div>{new Date(booking.checkOutDate).toLocaleDateString()}</div>
                                                    {booking.checkOutTime && <div className="text-xs text-teal-600 font-semibold">{booking.checkOutTime}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4" style={{ color: 'var(--nm-text-2)' }}>{booking.numberOfGuests}</td>
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
                                                        className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-lg transition-all shadow-md flex items-center gap-2"
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
                                            <i className="fa-solid fa-calendar-xmark text-4xl text-teal-300 mb-3"></i>
                                            <p style={{ color: 'var(--nm-text-3)' }}>No bookings found</p>
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
                <div className="fixed inset-0 bg-[rgba(150,160,175,0.4)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-scale-in" style={{ background: 'var(--nm-bg)', boxShadow: '12px 12px 28px var(--nm-sd), -12px -12px 28px var(--nm-sl)' }}>
                        <div className="flex-none flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--nm-text)' }}>New Booking</h3>
                            <button onClick={() => { setShowModal(false); setFormError(''); }} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'var(--nm-bg)', boxShadow: '3px 3px 7px var(--nm-sd), -3px -3px 7px var(--nm-sl)', color: 'var(--nm-text-2)' }}>
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-slate-800/50 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Error Banner */}
                                {formError && (
                                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.35)' }}>
                                        <i className="fa-solid fa-circle-exclamation text-rose-400 mt-0.5 flex-shrink-0"></i>
                                        <div className="text-sm font-medium text-rose-400">
                                            {formError.split('\n').map((msg, i) => (
                                                <p key={i}>{msg}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Room & Booking Details - FIRST */}
                                <div className="rounded-xl p-4" style={{ background: 'var(--nm-surface)', border: '1px solid var(--nm-border)' }}>
                                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--nm-text)' }}>
                                        <i className="fa-solid fa-door-open text-cyan-400"></i>
                                        Room & Booking Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Select Room *</label>
                                            <select
                                                value={formData.roomId}
                                                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                                                required
                                                className="w-full px-4 py-3"
                                                style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                            >
                                                <option value="" className="bg-slate-800">Select a room</option>
                                                {rooms.map(room => (
                                                    <option key={room.id} value={room.id} className="bg-slate-800 text-slate-100">{room.roomNumber} - {room.type} (${room.pricePerNight}/night)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Check In Date *</label>
                                            <input
                                                type="date"
                                                value={formData.checkInDate}
                                                min={today}
                                                onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value, checkOutDate: '' })}
                                                required
                                                className="w-full px-4 py-3"
                                                style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Check Out Date *</label>
                                            <input
                                                type="date"
                                                value={formData.checkOutDate}
                                                min={formData.checkInDate
                                                    ? new Date(new Date(formData.checkInDate).getTime() + 86400000).toISOString().split('T')[0]
                                                    : today}
                                                onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                                                required
                                                className="w-full px-4 py-3"
                                                style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>
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
                                                className="w-full px-4 py-3"
                                                style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none', opacity: !formData.roomId ? 0.5 : 1 }}
                                            />
                                            {!formData.roomId && (
                                                <p className="text-xs text-amber-500/80 mt-1">Please select a room first</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Primary Guest Information - SECOND */}
                                <div className="rounded-xl p-4" style={{ background: 'var(--nm-surface)', border: '1px solid var(--nm-border)' }}>
                                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--nm-text)' }}>
                                        <i className="fa-solid fa-user-tie text-blue-400"></i>
                                        Primary Guest Information
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Full Name *</label>
                                            <input
                                                type="text"
                                                value={formData.primaryGuest.name}
                                                onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, name: e.target.value } })}
                                                required
                                                placeholder="John Doe"
                                                className="w-full px-4 py-3"
                                                style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Email <span className="text-slate-500 font-normal">(optional)</span></label>
                                            <input
                                                type="email"
                                                value={formData.primaryGuest.email}
                                                onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, email: e.target.value } })}
                                                placeholder="john@example.com"
                                                className="w-full px-4 py-3"
                                                style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Phone *</label>
                                            <input
                                                type="tel"
                                                value={formData.primaryGuest.phone}
                                                onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, phone: e.target.value } })}
                                                required
                                                placeholder="+91 98765 43210"
                                                className="w-full px-4 py-3"
                                                style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>ID Proof Type *</label>
                                            <select
                                                value={formData.primaryGuest.idProofType}
                                                onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, idProofType: e.target.value } })}
                                                required
                                                className="w-full px-4 py-3"
                                                style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                            >
                                                <option value="national_id">National ID / Aadhar</option>
                                                <option value="passport">Passport</option>
                                                <option value="driving_license">Driving License</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>ID Proof Number *</label>
                                            <input
                                                type="text"
                                                value={formData.primaryGuest.idProofNumber}
                                                onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, idProofNumber: e.target.value } })}
                                                required
                                                placeholder="1234 5678 9012"
                                                className="w-full px-4 py-3"
                                                style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Address *</label>
                                            <input
                                                type="text"
                                                value={formData.primaryGuest.address}
                                                onChange={(e) => setFormData({ ...formData, primaryGuest: { ...formData.primaryGuest, address: e.target.value } })}
                                                required
                                                placeholder="123 Beach Street, Mumbai"
                                                className="w-full px-4 py-3"
                                                style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Guests - THIRD */}
                                {formData.numberOfGuests > 1 && (
                                    <div className="rounded-xl p-4" style={{ background: 'var(--nm-surface)', border: '1px solid var(--nm-border)' }}>
                                        <div className="mb-4">
                                            <h4 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--nm-text)' }}>
                                                <i className="fa-solid fa-users text-teal-400"></i>
                                                Secondary Guests ({formData.secondaryGuests.length})
                                            </h4>
                                            <p className="text-xs mt-1" style={{ color: 'var(--nm-text-3)' }}>
                                                Forms auto-generated based on total guest count
                                            </p>
                                        </div>
                                        {formData.secondaryGuests.length > 0 ? (
                                            <div className="space-y-3">
                                                {formData.secondaryGuests.map((guest, index) => (
                                                    <div key={index} className="p-4 rounded-xl" style={{ background: 'var(--nm-bg)', boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)' }}>
                                                        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--nm-text-2)' }}>Guest #{index + 2}</p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="col-span-2">
                                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nm-text-3)' }}>Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={guest.name}
                                                                    onChange={(e) => updateSecondaryGuest(index, 'name', e.target.value)}
                                                                    placeholder="Guest name"
                                                                    className="w-full px-3 py-2"
                                                                    style={{ boxShadow: 'inset 3px 3px 7px var(--nm-sd), inset -3px -3px 7px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '10px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nm-text-3)' }}>Age</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={guest.age}
                                                                    onChange={(e) => updateSecondaryGuest(index, 'age', parseInt(e.target.value))}
                                                                    className="w-full px-3 py-2"
                                                                    style={{ boxShadow: 'inset 3px 3px 7px var(--nm-sd), inset -3px -3px 7px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '10px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm italic" style={{ color: 'var(--nm-text-3)' }}>Increase guest count to add secondary guests</p>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--nm-border)' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); setFormError(''); }}
                                        className="flex-1 px-4 py-3 font-semibold rounded-xl transition-all"
                                        style={{ background: 'var(--nm-bg)', boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)', color: 'var(--nm-text-2)' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg"
                                    >
                                        Create Booking
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Booking Details Modal */}
            {
                showDetailsModal && selectedBooking && (
                    <div className="fixed inset-0 bg-[rgba(150,160,175,0.4)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in" style={{ background: 'var(--nm-bg)', boxShadow: '12px 12px 28px var(--nm-sd), -12px -12px 28px var(--nm-sl)' }}>
                            <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                                <h3 className="text-2xl font-bold" style={{ color: 'var(--nm-text)' }}>Booking Details</h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                    style={{ background: 'var(--nm-bg)', boxShadow: '3px 3px 7px var(--nm-sd), -3px -3px 7px var(--nm-sl)', color: 'var(--nm-text-2)' }}
                                >
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Guest Information */}
                                <div className="rounded-xl p-5" style={{ background: 'var(--nm-surface)', border: '1px solid var(--nm-border)' }}>
                                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--nm-text)' }}>
                                        <i className="fa-solid fa-user text-blue-400"></i>
                                        Guest Information
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Name</p>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{selectedBooking.guest?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Email</p>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{selectedBooking.guest?.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Phone</p>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{selectedBooking.guest?.phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Address</p>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{selectedBooking.guest?.address || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>ID Proof Type</p>
                                            <p className="text-sm font-semibold text-slate-100 capitalize">{selectedBooking.guest?.idProofType?.replace('_', ' ') || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>ID Proof Number</p>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{selectedBooking.guest?.idProofNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Guests */}
                                {(selectedBooking.guest as any)?.secondaryGuests?.length > 0 && (
                                    <div className="rounded-xl p-5" style={{ background: 'var(--nm-surface)', border: '1px solid var(--nm-border)' }}>
                                        <h4 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--nm-text)' }}>
                                            <i className="fa-solid fa-users text-purple-400"></i>
                                            Additional Guests
                                        </h4>
                                        <div className="space-y-3">
                                            {(selectedBooking.guest as any).secondaryGuests.map((guest: any, index: number) => (
                                                <div key={index} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'var(--nm-border)', border: '1px solid var(--nm-border)' }}>
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xs">
                                                        {guest.name?.[0] || 'G'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{guest.name || 'Unknown'}</p>
                                                        <p className="text-xs" style={{ color: 'var(--nm-text-3)' }}>Age: {guest.age || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Room Information */}
                                <div className="rounded-xl p-5" style={{ background: 'var(--nm-surface)', border: '1px solid var(--nm-border)' }}>
                                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--nm-text)' }}>
                                        <i className="fa-solid fa-door-open text-teal-400"></i>
                                        Room Information
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Room Number</p>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{selectedBooking.room?.roomNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Room Type</p>
                                            <p className="text-sm font-semibold text-slate-100 capitalize">{selectedBooking.room?.type || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Price per Night</p>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>${selectedBooking.room?.pricePerNight || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Capacity</p>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{selectedBooking.room?.capacity || 'N/A'} guests</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Information */}
                                <div className="rounded-xl p-5" style={{ background: 'var(--nm-surface)', border: '1px solid var(--nm-border)' }}>
                                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--nm-text)' }}>
                                        <i className="fa-solid fa-calendar-check text-purple-400"></i>
                                        Booking Information
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Check-In Date</p>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{new Date(selectedBooking.checkInDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
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
                )
            }

            {/* Invoice Modal */}
            {
                showInvoiceModal && invoice && (
                    <InvoiceModal
                        invoice={invoice}
                        onClose={() => setShowInvoiceModal(false)}
                    />
                )
            }

            {/* Guest History Modal */}
            {
                guestHistoryGuest && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-dark border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-cyan-900/30">
                                        {guestHistoryGuest.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-100">{guestHistoryGuest.name}</h3>
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            {guestHistoryGuest.email && <p className="text-xs text-slate-400"><i className="fa-solid fa-envelope mr-1.5"></i>{guestHistoryGuest.email}</p>}
                                            {guestHistoryGuest.phone && <p className="text-xs text-slate-400"><i className="fa-solid fa-phone mr-1.5"></i>{guestHistoryGuest.phone}</p>}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setGuestHistoryGuest(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center transition-colors">
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-white/5">
                                    <p className="text-2xl font-bold text-cyan-400">{guestHistory.length}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Total Stays</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-white/5">
                                    <p className="text-2xl font-bold text-emerald-400">
                                        ₹{guestHistory.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">Total Spent</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-white/5">
                                    <p className="text-2xl font-bold text-purple-400">
                                        {guestHistory.filter(b => b.bookingStatus === 'checked-in').length > 0 ? 'Active' : 'Inactive'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">Status</p>
                                </div>
                            </div>

                            {/* Booking History */}
                            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Booking History</h4>
                            {guestHistory.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-6">No bookings found</p>
                            ) : (
                                <div className="space-y-3">
                                    {guestHistory.sort((a, b) => b.id - a.id).map(b => (
                                        <div
                                            key={b.id}
                                            className="bg-slate-800/40 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-800/60 transition-colors cursor-pointer"
                                            onClick={() => { setSelectedBooking(b); setShowDetailsModal(true); setGuestHistoryGuest(null); }}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                {b.room?.roomNumber || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-200">Room {b.room?.roomNumber} — {b.room?.type}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(b.checkInDate).toLocaleDateString()} → {new Date(b.checkOutDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-bold text-slate-200">₹{Number(b.totalAmount).toLocaleString()}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${getStatusColor(b.bookingStatus)}`}>
                                                    {b.bookingStatus}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </>
    );
}
