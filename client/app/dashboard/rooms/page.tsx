'use client';

import { useEffect, useState } from 'react';
import { roomsAPI, bookingsAPI, Room, Booking } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
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
        // Generate QR code URL - in production this would call the backend QR generator
        const qrUrl = `${window.location.origin}/room-service?room=${room.roomNumber}`;
        setQrCodeData(qrUrl);
        setShowQRModal(true);
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
                return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            case 'occupied':
                return 'bg-red-100 text-red-700 border-red-300';
            case 'maintenance':
                return 'bg-amber-100 text-amber-700 border-amber-300';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-300';
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
            <header className="px-8 py-6 border-b border-white/60 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-1">Room Management</h2>
                        <p className="text-slate-600">Manage all your rooms and their availability 🏨</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2"
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
                            <i className="fa-solid fa-spinner fa-spin text-4xl text-cyan-500 mb-4"></i>
                            <p className="text-slate-600">Loading rooms...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {rooms.map((room, index) => (
                            <div
                                key={room.id}
                                className="bg-white/70 backdrop-blur-sm border border-white/60 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                            <i className={`fa-solid ${getRoomIcon(room.type)} text-white text-lg`}></i>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">{room.roomNumber}</h3>
                                            <p className="text-sm text-slate-600 capitalize">{room.type}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${getRoomStatusColor(room.status)}`}>
                                        {room.status}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">Price/Night</span>
                                        <span className="text-slate-800 font-semibold">₹{room.pricePerNight}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">Capacity</span>
                                        <span className="text-slate-800 font-semibold">{room.capacity} guests</span>
                                    </div>
                                </div>

                                <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 mb-4"></div>

                                <div className="grid grid-cols-2 gap-2">
                                    {room.status === 'occupied' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRoomClick(room);
                                            }}
                                            className="col-span-2 px-4 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
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
                                        className="px-4 py-2.5 bg-cyan-100 hover:bg-cyan-200 text-cyan-700 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <i className="fa-solid fa-qrcode"></i>
                                        QR Code
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenGuestInterface(room);
                                        }}
                                        className="px-4 py-2.5 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <i className="fa-solid fa-external-link-alt"></i>
                                        Guest View
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModal(room);
                                        }}
                                        className="px-4 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <i className="fa-solid fa-pen"></i>
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(room.id);
                                        }}
                                        className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Room Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">
                                {editingRoom ? 'Edit Room' : 'Add New Room'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Room Number</label>
                                <input
                                    type="text"
                                    value={formData.roomNumber}
                                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                    required
                                    placeholder="101"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Room Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Room['type'] })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                >
                                    <option value="single">Single</option>
                                    <option value="double">Double</option>
                                    <option value="deluxe">Deluxe</option>
                                    <option value="suite">Suite</option>
                                    <option value="family">Family</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Price/Night</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.pricePerNight}
                                        onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                                        required
                                        placeholder="100"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        required
                                        placeholder="2"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Room['status'] })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
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
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all shadow-lg"
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">Room {selectedRoom.roomNumber} - Guests</h3>
                                <p className="text-sm text-slate-600 mt-1">Current occupants and booking details</p>
                            </div>
                            <button
                                onClick={() => setShowGuestListModal(false)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>

                        {loadingBookings ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <i className="fa-solid fa-spinner fa-spin text-4xl text-cyan-500 mb-4"></i>
                                    <p className="text-slate-600">Loading guest information...</p>
                                </div>
                            </div>
                        ) : roomBookings.length > 0 ? (
                            <div className="space-y-4">
                                {roomBookings.map((booking, index) => (
                                    <div key={booking.id} className="bg-gradient-to-br from-blue-50 to-teal-50 p-5 rounded-xl border border-blue-200">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                    {booking.guest?.name?.[0] || 'G'}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-slate-800">{booking.guest?.name || 'Unknown Guest'}</h4>
                                                    <p className="text-sm text-slate-600">{booking.guest?.email || 'No email'}</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase ${booking.bookingStatus === 'checked-in' ? 'bg-green-100 text-green-700 border border-green-300' :
                                                booking.bookingStatus === 'confirmed' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                                                    'bg-slate-100 text-slate-700 border border-slate-300'
                                                }`}>
                                                {booking.bookingStatus}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-white/70 p-3 rounded-lg">
                                                <p className="text-xs text-slate-600 mb-1">Phone</p>
                                                <p className="text-sm font-semibold text-slate-800">{booking.guest?.phone || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white/70 p-3 rounded-lg">
                                                <p className="text-xs text-slate-600 mb-1">Address</p>
                                                <p className="text-sm font-semibold text-slate-800">{booking.guest?.address || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white/70 p-3 rounded-lg">
                                                <p className="text-xs text-slate-600 mb-1">ID Type</p>
                                                <p className="text-sm font-semibold text-slate-800 capitalize">{booking.guest?.idProofType?.replace('_', ' ') || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white/70 p-3 rounded-lg">
                                                <p className="text-xs text-slate-600 mb-1">ID Number</p>
                                                <p className="text-sm font-semibold text-slate-800">{booking.guest?.idProofNumber || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="border-t border-blue-200 pt-4 mt-4">
                                            <div className="grid grid-cols-4 gap-3">
                                                <div>
                                                    <p className="text-xs text-slate-600 mb-1">Check-In</p>
                                                    <p className="text-sm font-semibold text-slate-800">{new Date(booking.checkInDate).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-600 mb-1">Check-Out</p>
                                                    <p className="text-sm font-semibold text-slate-800">{new Date(booking.checkOutDate).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-600 mb-1">Guests</p>
                                                    <p className="text-sm font-semibold text-slate-800">{booking.numberOfGuests}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-600 mb-1">Total Amount</p>
                                                    <p className="text-sm font-semibold text-slate-800">₹{booking.totalAmount}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                                    booking.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    Payment: {booking.paymentStatus}
                                                </span>
                                                {booking.bookingStatus === 'checked-in' && (
                                                    <button
                                                        onClick={() => handleCheckout(booking.id)}
                                                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold rounded-lg transition-all shadow-md"
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
                                <i className="fa-solid fa-users-slash text-5xl text-slate-300 mb-4"></i>
                                <p className="text-slate-600 text-lg">No active bookings found for this room</p>
                                <p className="text-slate-500 text-sm mt-2">The room may be marked as occupied but has no current guests</p>
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                onClick={() => setShowGuestListModal(false)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all shadow-lg"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && selectedRoomForQR && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">
                                Room {selectedRoomForQR.roomNumber} - QR Code
                            </h3>
                            <button onClick={() => setShowQRModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>

                        <div className="text-center">
                            <div className="bg-white p-6 rounded-xl border-4 border-cyan-500 inline-block mb-4">
                                <QRCodeSVG
                                    value={qrCodeData}
                                    size={256}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <p className="text-sm text-slate-600 mb-2">
                                Guests can scan this QR code to access room service
                            </p>
                            <p className="text-xs text-slate-500 mb-6">
                                Print and place this QR code inside the room
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        // In production, this would download the QR code
                                        alert('QR Code download feature coming soon!');
                                    }}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg"
                                >
                                    <i className="fa-solid fa-download mr-2"></i>
                                    Download
                                </button>
                                <button
                                    onClick={() => setShowQRModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
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
