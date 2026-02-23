'use client';

import { useEffect, useState, useRef } from 'react';
import { roomsAPI, bookingsAPI, Room, Booking } from '@/lib/api';
import { QRCodeCanvas } from 'qrcode.react';
import InvoiceModal from '@/components/InvoiceModal';

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showGuestListModal, setShowGuestListModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoice, setInvoice] = useState<any>(null);
    const [qrCodeData, setQrCodeData] = useState('');
    const [selectedRoomForQR, setSelectedRoomForQR] = useState<Room | null>(null);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [roomBookings, setRoomBookings] = useState<Booking[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [formData, setFormData] = useState<{
        roomNumber: string;
        type: Room['type'];
        pricePerNight: string | number;
        capacity: string | number;
        status: Room['status'];
    }>({
        roomNumber: '',
        type: 'single',
        pricePerNight: '',
        capacity: '',
        status: 'available',
    });

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            const data = await roomsAPI.getAll();
            setRooms(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingRoom(null);
        setFormData({ roomNumber: '', type: 'single', pricePerNight: '', capacity: '', status: 'available' });
        setShowModal(true);
    };

    const openEditModal = (room: Room) => {
        setEditingRoom(room);
        setFormData({
            roomNumber: room.roomNumber,
            type: room.type,
            pricePerNight: room.pricePerNight,
            capacity: room.capacity,
            status: room.status,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submitData = {
                roomNumber: formData.roomNumber,
                type: formData.type,
                pricePerNight: Number(formData.pricePerNight),
                capacity: Number(formData.capacity),
                status: formData.status,
            };

            if (editingRoom) {
                await roomsAPI.update(editingRoom.id, submitData);
            } else {
                await roomsAPI.create(submitData);
            }

            setShowModal(false);
            setEditingRoom(null);
            setFormData({ roomNumber: '', type: 'single', pricePerNight: '', capacity: '', status: 'available' });
            loadRooms();
        } catch (err: any) {
            console.error('Room creation/update error:', err.message);

            // Extract the actual error message
            const errorMessage = err.message || 'Unknown error';

            alert(`Failed to ${editingRoom ? 'update' : 'create'} room: ${errorMessage}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this room?')) return;

        try {
            await roomsAPI.delete(id);
            loadRooms();
        } catch (err) {
            console.error(err);
            alert('Failed to delete room');
        }
    };

    const handleRoomClick = async (room: Room) => {
        if (room.status === 'occupied') {
            setSelectedRoom(room);
            setLoadingBookings(true);
            setShowGuestListModal(true);
            try {
                const data = await bookingsAPI.getByRoom(room.id);
                console.log('Bookings data:', data);
                setRoomBookings(data.filter((b: Booking) => b.bookingStatus === 'checked-in' || b.bookingStatus === 'confirmed'));
            } catch (err: any) {
                console.error('Error fetching room bookings:', err);
                alert(`Failed to load guest information: ${err.message || 'Please try again.'}`);
            } finally {
                setLoadingBookings(false);
            }
        }
    };

    const handleViewQR = async (room: Room) => {
        setSelectedRoomForQR(room);
        const qrUrl = `${window.location.origin}/room-service?room=${room.roomNumber}`;
        setQrCodeData(qrUrl);
        setShowQRModal(true);
    };

    const handleDownloadQR = () => {
        if (!qrCanvasRef.current || !selectedRoomForQR) return;
        const canvas = qrCanvasRef.current;
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `room-${selectedRoomForQR.roomNumber}-qr.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleOpenGuestInterface = (room: Room) => {
        const guestUrl = `${window.location.origin}/room-service?room=${room.roomNumber}`;
        window.open(guestUrl, '_blank');
    };

    const handleCheckout = async (bookingId: number) => {
        if (!confirm('Are you sure you want to checkout this guest? This will generate the final invoice.')) {
            return;
        }

        try {
            const data = await bookingsAPI.checkout(bookingId);
            setInvoice(data.invoice);
            setShowInvoiceModal(true);
            setShowGuestListModal(false);

            // Reload rooms to update status
            loadRooms();
        } catch (error: any) {
            console.error('Checkout error:', error);
            alert(`Checkout failed: ${error.message}`);
        }
    };

    const getRoomStatusColor = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'occupied':
                return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'maintenance':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getRoomIcon = (type: string) => {
        switch (type) {
            case 'suite':
            case 'deluxe':
                return 'fa-crown';
            case 'family':
                return 'fa-people-roof';
            default:
                return 'fa-bed';
        }
    };

    return (
        <>
            <header className="px-8 py-6 bg-transparent" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-1" style={{ color: 'var(--nm-text)' }}>Room Management</h2>
                        <p style={{ color: 'var(--nm-text-2)' }}>Manage all your rooms and their availability 🏨</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="px-5 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2"
                        style={{ boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)' }}
                    >
                        <i className="fa-solid fa-plus"></i>
                        <span>Add Room</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <i className="fa-solid fa-spinner fa-spin text-4xl text-teal-400 mb-4"></i>
                            <p style={{ color: 'var(--nm-text-2)' }}>Loading rooms...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {rooms.map((room, index) => (
                            <div
                                key={room.id}
                                className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 animate-slide-up relative overflow-hidden group"
                                style={{ background: 'var(--nm-bg)', boxShadow: '8px 8px 18px var(--nm-sd), -8px -8px 18px var(--nm-sl)', animationDelay: `${index * 50}ms` }}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 pointer-events-none" style={{ background: 'var(--nm-surface)' }}></div>

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md">
                                            <i className={`fa-solid ${getRoomIcon(room.type)} text-white text-lg`}></i>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold" style={{ color: 'var(--nm-text)' }}>{room.roomNumber}</h3>
                                            <p className="text-sm capitalize" style={{ color: 'var(--nm-text-3)' }}>{room.type}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${getRoomStatusColor(room.status)}`}>
                                        {room.status}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-4 relative z-10">
                                    <div className="flex items-center justify-between text-sm">
                                        <span style={{ color: 'var(--nm-text-3)' }}>Price/Night</span>
                                        <span className="font-semibold" style={{ color: 'var(--nm-text)' }}>₹{room.pricePerNight}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span style={{ color: 'var(--nm-text-3)' }}>Capacity</span>
                                        <span className="font-semibold" style={{ color: 'var(--nm-text)' }}>{room.capacity} guests</span>
                                    </div>
                                </div>

                                <div className="h-1.5 w-full rounded-full mb-5 overflow-hidden" style={{ background: 'var(--nm-border)' }}>
                                    <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 w-full"></div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 relative z-10 opacity-80 group-hover:opacity-100 transition-opacity">
                                    {room.status === 'occupied' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRoomClick(room);
                                            }}
                                            className="col-span-2 px-4 py-2.5 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                                            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#9333ea' }}
                                        >
                                            <i className="fa-solid fa-users"></i>
                                            View Guests
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewQR(room);
                                        }}
                                        className="px-4 py-2.5 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                                        style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#0891b2' }}
                                    >
                                        <i className="fa-solid fa-qrcode"></i>
                                        QR
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenGuestInterface(room);
                                        }}
                                        className="px-4 py-2.5 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                                        style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', color: '#0d9488' }}
                                    >
                                        <i className="fa-solid fa-external-link-alt"></i>
                                        View
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModal(room);
                                        }}
                                        className="px-4 py-2.5 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                                        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#2563eb' }}
                                    >
                                        <i className="fa-solid fa-pen"></i>
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(room.id);
                                        }}
                                        className="px-4 py-2.5 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                                        style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#e11d48' }}
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                        Del
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Room Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[rgba(150,160,175,0.4)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in" style={{ background: 'var(--nm-bg)', boxShadow: '12px 12px 28px var(--nm-sd), -12px -12px 28px var(--nm-sl)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--nm-text)' }}>
                                {editingRoom ? 'Edit Room' : 'Add New Room'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'var(--nm-bg)', boxShadow: '3px 3px 7px var(--nm-sd), -3px -3px 7px var(--nm-sl)', color: 'var(--nm-text-2)' }}>
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Room Number</label>
                                <input
                                    type="text"
                                    value={formData.roomNumber}
                                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                    required
                                    placeholder="101"
                                    className="w-full px-4 py-3"
                                    style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Room Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Room['type'] })}
                                    className="w-full px-4 py-3"
                                    style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                >
                                    <option value="single">Single</option>
                                    <option value="double">Double</option>
                                    <option value="deluxe">Deluxe</option>
                                    <option value="suite" className="bg-slate-800">Suite</option>
                                    <option value="family" className="bg-slate-800">Family</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Price/Night</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.pricePerNight}
                                        onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                                        required
                                        placeholder="100"
                                        className="w-full px-4 py-3"
                                        style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        required
                                        placeholder="2"
                                        className="w-full px-4 py-3"
                                        style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Room['status'] })}
                                    className="w-full px-4 py-3"
                                    style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                                >
                                    <option value="available">Available</option>
                                    <option value="occupied">Occupied</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 font-semibold rounded-xl transition-all"
                                    style={{ background: 'var(--nm-bg)', boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)', color: 'var(--nm-text-2)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg"
                                >
                                    {editingRoom ? 'Update Room' : 'Add Room'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Guest List Modal for Occupied Rooms */}
            {showGuestListModal && selectedRoom && (
                <div className="fixed inset-0 bg-[rgba(150,160,175,0.4)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in" style={{ background: 'var(--nm-bg)', boxShadow: '12px 12px 28px var(--nm-sd), -12px -12px 28px var(--nm-sl)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold" style={{ color: 'var(--nm-text)' }}>Room {selectedRoom.roomNumber} - Guests</h3>
                                <p className="text-sm mt-1" style={{ color: 'var(--nm-text-3)' }}>Current occupants and booking details</p>
                            </div>
                            <button
                                onClick={() => setShowGuestListModal(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                style={{ background: 'var(--nm-bg)', boxShadow: '3px 3px 7px var(--nm-sd), -3px -3px 7px var(--nm-sl)', color: 'var(--nm-text-2)' }}
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>

                        {loadingBookings ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <i className="fa-solid fa-spinner fa-spin text-4xl text-teal-400 mb-4"></i>
                                    <p style={{ color: 'var(--nm-text-2)' }}>Loading guest information...</p>
                                </div>
                            </div>
                        ) : roomBookings.length > 0 ? (
                            <div className="space-y-4">
                                {roomBookings.map((booking, index) => (
                                    <div key={booking.id} className="p-5 rounded-xl" style={{ background: 'var(--nm-surface)', border: '1px solid var(--nm-border)' }}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                    {booking.guest?.name?.[0] || 'G'}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold" style={{ color: 'var(--nm-text)' }}>{booking.guest?.name || 'Unknown Guest'}</h4>
                                                    <p className="text-sm" style={{ color: 'var(--nm-text-3)' }}>{booking.guest?.email || 'No email'}</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase border ${booking.bookingStatus === 'checked-in' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                booking.bookingStatus === 'confirmed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                {booking.bookingStatus}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="p-3 rounded-lg" style={{ background: 'var(--nm-border)' }}>
                                                <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Phone</p>
                                                <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{booking.guest?.phone || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 rounded-lg" style={{ background: 'var(--nm-border)' }}>
                                                <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Address</p>
                                                <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{booking.guest?.address || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 rounded-lg" style={{ background: 'var(--nm-border)' }}>
                                                <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>ID Type</p>
                                                <p className="text-sm font-semibold capitalize" style={{ color: 'var(--nm-text)' }}>{booking.guest?.idProofType?.replace('_', ' ') || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 rounded-lg" style={{ background: 'var(--nm-border)' }}>
                                                <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>ID Number</p>
                                                <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{booking.guest?.idProofNumber || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {/* Secondary Guests */}
                                        {(() => {
                                            const sg: any[] = (booking.guest as any)?.secondaryGuests || [];
                                            return sg.length > 0 ? (
                                                <div className="mb-4">
                                                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--nm-text-3)' }}>
                                                        <i className="fa-solid fa-users mr-1"></i> Additional Guests
                                                    </p>
                                                    <div className="space-y-2">
                                                        {sg.map((g: any, i: number) => (
                                                            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--nm-border)' }}>
                                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                                                                    {g.name?.[0] || '?'}
                                                                </div>
                                                                <span className="text-sm font-medium" style={{ color: 'var(--nm-text)' }}>{g.name || 'Unknown'}</span>
                                                                {g.age && <span className="text-xs ml-auto" style={{ color: 'var(--nm-text-3)' }}>Age {g.age}</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null;
                                        })()}

                                        <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--nm-border)' }}>
                                            <div className="grid grid-cols-4 gap-3">
                                                <div>
                                                    <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Check-In</p>
                                                    <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{new Date(booking.checkInDate).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Check-Out</p>
                                                    <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{new Date(booking.checkOutDate).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Guests</p>
                                                    <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>{booking.numberOfGuests}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs mb-1" style={{ color: 'var(--nm-text-3)' }}>Total Amount</p>
                                                    <p className="text-sm font-semibold" style={{ color: 'var(--nm-text)' }}>₹{booking.totalAmount}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase border ${booking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                    booking.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        'bg-rose-100 text-rose-700 border-rose-200'
                                                    }`}>
                                                    Payment: {booking.paymentStatus}
                                                </span>
                                                {booking.bookingStatus === 'checked-in' && (
                                                    <button
                                                        onClick={() => handleCheckout(booking.id)}
                                                        className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-lg transition-all shadow-md"
                                                    >
                                                        <i className="fa-solid fa-right-from-bracket mr-2"></i>
                                                        Checkout
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <i className="fa-solid fa-users-slash text-5xl mb-4" style={{ color: 'var(--nm-text-3)' }}></i>
                                <p className="text-lg" style={{ color: 'var(--nm-text-2)' }}>No active bookings found for this room</p>
                                <p className="text-sm mt-2" style={{ color: 'var(--nm-text-3)' }}>The room may be marked as occupied but has no current guests</p>
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                onClick={() => setShowGuestListModal(false)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && selectedRoomForQR && (
                <div className="fixed inset-0 bg-[rgba(150,160,175,0.4)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in" style={{ background: 'var(--nm-bg)', boxShadow: '12px 12px 28px var(--nm-sd), -12px -12px 28px var(--nm-sl)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--nm-text)' }}>
                                Room {selectedRoomForQR.roomNumber} - QR Code
                            </h3>
                            <button onClick={() => setShowQRModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'var(--nm-bg)', boxShadow: '3px 3px 7px var(--nm-sd), -3px -3px 7px var(--nm-sl)', color: 'var(--nm-text-2)' }}>
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>

                        <div className="text-center">
                            <div className="bg-white p-6 rounded-xl border-4 border-teal-400 inline-block mb-4 shadow-lg" style={{ boxShadow: '6px 6px 16px var(--nm-sd), -6px -6px 16px var(--nm-sl)' }}>
                                <QRCodeCanvas
                                    ref={qrCanvasRef}
                                    value={qrCodeData}
                                    size={256}
                                    level="H"
                                    marginSize={2}
                                />
                            </div>

                            <p className="text-sm mb-2" style={{ color: 'var(--nm-text-2)' }}>
                                Guests can scan this QR code to access room service
                            </p>
                            <p className="text-xs mb-6" style={{ color: 'var(--nm-text-3)' }}>
                                Print and place this QR code inside the room
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleDownloadQR}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg"
                                >
                                    <i className="fa-solid fa-download mr-2"></i>
                                    Download
                                </button>
                                <button
                                    onClick={() => setShowQRModal(false)}
                                    className="flex-1 px-4 py-3 font-semibold rounded-xl transition-all"
                                    style={{ background: 'var(--nm-bg)', boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)', color: 'var(--nm-text-2)' }}
                                >
                                    Close
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
