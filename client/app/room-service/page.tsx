'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/api';

interface MenuItem {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    isVegetarian: boolean;
    isAvailable: boolean;
}

interface CartItem extends MenuItem {
    quantity: number;
}

function RoomServiceContent() {
    const searchParams = useSearchParams();
    const roomNumber = searchParams.get('room');

    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [showMyRequests, setShowMyRequests] = useState(false);
    const myRequestsRef = useRef<HTMLDivElement>(null);
    const [isOccupied, setIsOccupied] = useState<boolean | null>(null);
    const [activeBookingId, setActiveBookingId] = useState<number | null>(null);
    const [checkingOccupancy, setCheckingOccupancy] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Room service items
    const roomServiceItems = [
        { name: 'Extra Towels', price: 0, icon: 'fa-bath', category: 'room_service' },
        { name: 'Bed Sheets', price: 0, icon: 'fa-bed', category: 'room_service' },
        { name: 'Pillows', price: 0, icon: 'fa-bed-pulse', category: 'room_service' },
        { name: 'Extra Mattress', price: 500, icon: 'fa-mattress-pillow', category: 'room_service' },
        { name: 'Toiletries', price: 0, icon: 'fa-pump-soap', category: 'room_service' },
    ];

    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    useEffect(() => {
        loadMenu();
        if (roomNumber) {
            loadMyRequests();
            checkOccupancy();
            const interval = setInterval(loadMyRequests, 15000);
            return () => clearInterval(interval);
        }
    }, [roomNumber]);

    const checkOccupancy = async (retries = 3) => {
        setCheckingOccupancy(true);
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const roomsResponse = await fetch(`${API_URL}/rooms`);
                if (!roomsResponse.ok) throw new Error('rooms fetch failed');
                const roomsData = await roomsResponse.json();
                const rooms = Array.isArray(roomsData) ? roomsData : [];
                const room = rooms.find((r: any) => r.roomNumber === roomNumber);
                if (!room) { setIsOccupied(false); setCheckingOccupancy(false); return; }

                const bookingsResponse = await fetch(`${API_URL}/bookings/room/${room.id}`);
                if (!bookingsResponse.ok) throw new Error('bookings fetch failed');
                const bookingsData = await bookingsResponse.json();
                const bookings = Array.isArray(bookingsData) ? bookingsData : [];
                const activeBooking = bookings.find((b: any) => b.bookingStatus === 'checked-in');
                setIsOccupied(!!activeBooking);
                if (activeBooking) setActiveBookingId(activeBooking.id);
                setCheckingOccupancy(false);
                return;
            } catch {
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    setIsOccupied(false);
                    setCheckingOccupancy(false);
                }
            }
        }
    };

    const loadMenu = async () => {
        try {
            const response = await fetch(`${API_URL}/menu`);
            const data = await response.json();
            setMenu(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading menu:', error);
            setMenu([]);
        } finally {
            setLoading(false);
        }
    };

    const loadMyRequests = async () => {
        try {
            const roomsResponse = await fetch(`${API_URL}/rooms`);
            const roomsData = await roomsResponse.json();
            const rooms = Array.isArray(roomsData) ? roomsData : [];
            const room = rooms.find((r: any) => r.roomNumber === roomNumber);

            if (room) {
                const response = await fetch(`${API_URL}/service-requests/room/${room.id}`);
                const data = await response.json();
                const all = Array.isArray(data) ? data : [];
                const bookingsRes = await fetch(`${API_URL}/bookings/room/${room.id}`);
                const bookingsData = await bookingsRes.json();
                const bookings = Array.isArray(bookingsData) ? bookingsData : [];
                const activeBooking = bookings.find((b: any) => b.bookingStatus === 'checked-in');
                if (activeBooking) {
                    setMyRequests(all.filter((r: any) => r.bookingId === activeBooking.id));
                } else {
                    setMyRequests([]);
                }
            }
        } catch (error) {
            console.error('Error loading requests:', error);
        }
    };

    const addToCart = (item: MenuItem) => {
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
    };

    const removeFromCart = (itemId: number) => {
        setCart(cart.filter(c => c.id !== itemId));
    };

    const updateQuantity = (itemId: number, quantity: number) => {
        if (quantity === 0) {
            removeFromCart(itemId);
        } else {
            setCart(cart.map(c => c.id === itemId ? { ...c, quantity } : c));
        }
    };

    const toggleService = (serviceName: string) => {
        if (selectedServices.includes(serviceName)) {
            setSelectedServices(selectedServices.filter(s => s !== serviceName));
        } else {
            setSelectedServices([...selectedServices, serviceName]);
        }
    };

    const calculateTotal = () => {
        const foodTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const serviceTotal = selectedServices.reduce((sum, service) => {
            const item = roomServiceItems.find(s => s.name === service);
            return sum + (item?.price || 0);
        }, 0);
        return foodTotal + serviceTotal;
    };

    const handleSubmit = async () => {
        if (!roomNumber) { alert('Room number not found'); return; }
        if (cart.length === 0 && selectedServices.length === 0) { alert('Please add items to your order'); return; }
        if (!isOccupied) { alert('This room is currently unoccupied. Service requests can only be submitted for checked-in guests.'); return; }

        setSubmitting(true);
        try {
            const roomsResponse = await fetch(`${API_URL}/rooms`);
            const rooms = Array.isArray(await roomsResponse.json()) ? await (await fetch(`${API_URL}/rooms`)).json() : [];
            const room = rooms.find((r: any) => r.roomNumber === roomNumber);
            if (!room) throw new Error('Room not found');

            const bookings = await (await fetch(`${API_URL}/bookings/room/${room.id}`)).json();
            const activeBooking = (Array.isArray(bookings) ? bookings : []).find((b: any) => b.bookingStatus === 'checked-in');

            const allItems = [
                ...cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
                ...selectedServices.map(s => {
                    const serviceItem = roomServiceItems.find(item => item.name === s);
                    return { name: s, price: serviceItem?.price || 0, quantity: 1 };
                })
            ];

            const requestData = {
                roomId: room.id,
                bookingId: activeBooking ? activeBooking.id : null,
                type: cart.length > 0 ? 'food' : 'room_service',
                items: allItems,
                description: cart.length > 0 && selectedServices.length > 0
                    ? 'Food Order & Room Service Request'
                    : cart.length > 0 ? 'Food Order' : 'Room Service Request',
                specialInstructions,
                totalAmount: calculateTotal()
            };

            const response = await fetch(`${API_URL}/service-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                setCart([]);
                setSelectedServices([]);
                setSpecialInstructions('');
                setSuccessMsg('Request submitted! We\'ll get to you shortly.');
                setTimeout(() => setSuccessMsg(''), 5000);
                loadMyRequests();
                setShowMyRequests(true);
                setTimeout(() => myRequestsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to submit request');
            }
        } catch (error: any) {
            console.error('Error submitting request:', error);
            alert(`Failed to submit request: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const categories = ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages'];

    // ── nm-bg style helper
    const nmCard = { background: 'var(--nm-bg)', boxShadow: '10px 10px 24px var(--nm-sd), -10px -10px 24px var(--nm-sl)', borderRadius: '20px' } as const;
    const nmRaised = { background: 'var(--nm-bg)', boxShadow: '6px 6px 14px var(--nm-sd), -6px -6px 14px var(--nm-sl)', borderRadius: '14px' } as const;
    const nmInset = { background: 'var(--nm-bg)', boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', borderRadius: '12px', border: 'none', outline: 'none' } as const;

    if (!roomNumber) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--nm-bg)' }}>
                <div className="p-10 text-center max-w-md" style={nmCard}>
                    <div className="w-20 h-20 mx-auto rounded-2xl mb-6 flex items-center justify-center" style={{ ...nmRaised, background: '#fff3e0' }}>
                        <i className="fa-solid fa-exclamation-triangle text-3xl text-amber-500"></i>
                    </div>
                    <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--nm-text)' }}>Invalid Access</h1>
                    <p style={{ color: 'var(--nm-text-2)' }}>Please scan the QR code in your room to access room service.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32" style={{ background: 'var(--nm-bg)' }}>

            {/* Header */}
            <header className="sticky top-0 z-30 px-4 md:px-8 py-4" style={{ background: 'var(--nm-bg)', boxShadow: '0 6px 16px var(--nm-sd)' }}>
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center" style={{ boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)' }}>
                            <i className="fa-solid fa-bell-concierge text-lg text-white"></i>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">Room Service</h1>
                            <p className="text-xs" style={{ color: 'var(--nm-text-3)' }}>Room {roomNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {(cart.length > 0 || selectedServices.length > 0) && (
                            <div className="px-4 py-2 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-teal-400 to-cyan-400" style={{ boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)' }}>
                                ₹{calculateTotal()}
                            </div>
                        )}
                        <button
                            onClick={() => {
                                const isOpening = !showMyRequests;
                                setShowMyRequests(isOpening);
                                if (isOpening) setTimeout(() => myRequestsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                            }}
                            className="relative px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
                            style={{ ...nmRaised, color: 'var(--nm-text-2)' }}
                        >
                            <i className="fa-solid fa-clock-rotate-left"></i>
                            <span className="hidden sm:inline">My Requests</span>
                            {myRequests.filter((r: any) => r.status === 'pending' || r.status === 'in-progress').length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-400 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                                    {myRequests.filter((r: any) => r.status === 'pending' || r.status === 'in-progress').length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6 space-y-8">

                {/* Success Toast */}
                {successMsg && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl animate-scale-in" style={{ background: 'rgba(209,250,229,0.8)', border: '1px solid #6ee7b7' }}>
                        <i className="fa-solid fa-circle-check text-emerald-500 text-xl flex-shrink-0"></i>
                        <p className="font-semibold text-emerald-700">{successMsg}</p>
                    </div>
                )}

                {/* My Requests Panel */}
                {showMyRequests && (
                    <div ref={myRequestsRef} className="animate-scale-in" style={nmCard}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid rgba(197,205,216,0.4)' }}>
                                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--nm-text)' }}>
                                    <i className="fa-solid fa-list-check text-teal-400"></i>
                                    My Requests
                                </h2>
                                <button onClick={() => setShowMyRequests(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ ...nmRaised, color: 'var(--nm-text-2)' }}>
                                    <i className="fa-solid fa-times text-sm"></i>
                                </button>
                            </div>
                            {myRequests.length === 0 ? (
                                <div className="text-center py-10">
                                    <i className="fa-solid fa-inbox text-4xl mb-3" style={{ color: 'var(--nm-text-3)' }}></i>
                                    <p style={{ color: 'var(--nm-text-3)' }}>No requests yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myRequests.map((request: any) => (
                                        <div key={request.id} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(197,205,216,0.4)' }}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-sm" style={{ color: 'var(--nm-text)' }}>{request.description}</h3>
                                                    <p className="text-xs mt-0.5" style={{ color: 'var(--nm-text-3)' }}>
                                                        {new Date(request.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border flex-shrink-0 ${request.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        request.status === 'in-progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                            request.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                                'bg-rose-100 text-rose-700 border-rose-200'
                                                    }`}>
                                                    {request.status}
                                                </span>
                                            </div>

                                            {request.items && Array.isArray(request.items) && request.items.length > 0 && (
                                                <div className="mt-2 p-3 rounded-lg space-y-1" style={nmInset}>
                                                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--nm-text-3)' }}>
                                                        <i className="fa-solid fa-list mr-1"></i>Items:
                                                    </p>
                                                    {request.items.map((item: any, i: number) => (
                                                        <div key={i} className="flex justify-between text-xs" style={{ color: 'var(--nm-text-2)' }}>
                                                            <span>{item.quantity && item.quantity > 1 ? `${item.quantity}× ` : ''}{item.name}</span>
                                                            {item.price > 0 && <span className="font-medium">₹{item.quantity ? item.price * item.quantity : item.price}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {request.totalAmount > 0 && (
                                                <p className="text-sm font-bold mt-2 text-teal-500">Total: ₹{request.totalAmount}</p>
                                            )}
                                            {request.staffNotes && (
                                                <div className="mt-2 p-3 rounded-lg border-l-4 border-blue-400" style={{ background: 'rgba(219,234,254,0.5)' }}>
                                                    <p className="text-xs font-semibold text-blue-600 mb-1"><i className="fa-solid fa-user-tie mr-1"></i>Staff Note:</p>
                                                    <p className="text-xs text-blue-700">{request.staffNotes}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Quick Services */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--nm-text)' }}>
                        <i className="fa-solid fa-concierge-bell text-teal-400"></i>
                        Quick Services
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {roomServiceItems.map(service => {
                            const selected = selectedServices.includes(service.name);
                            return (
                                <button
                                    key={service.name}
                                    onClick={() => toggleService(service.name)}
                                    className="p-5 rounded-2xl text-center transition-all duration-200"
                                    style={selected ? {
                                        background: 'var(--nm-bg)',
                                        boxShadow: 'inset 5px 5px 12px var(--nm-sd), inset -5px -5px 12px var(--nm-sl)',
                                        borderRadius: '20px',
                                    } : {
                                        background: 'var(--nm-bg)',
                                        boxShadow: '8px 8px 18px var(--nm-sd), -8px -8px 18px var(--nm-sl)',
                                        borderRadius: '20px',
                                    }}
                                >
                                    <div className={`w-12 h-12 mx-auto rounded-xl mb-3 flex items-center justify-center transition-all ${selected ? 'bg-gradient-to-br from-teal-400 to-cyan-400' : ''}`}
                                        style={!selected ? { background: 'var(--nm-bg)', boxShadow: '4px 4px 9px var(--nm-sd), -4px -4px 9px var(--nm-sl)' } : {}}>
                                        <i className={`fa-solid ${service.icon} text-lg ${selected ? 'text-white' : ''}`} style={!selected ? { color: 'var(--nm-text-2)' } : {}}></i>
                                    </div>
                                    <h3 className="font-semibold text-xs leading-tight" style={{ color: selected ? 'var(--nm-text)' : 'var(--nm-text-2)' }}>{service.name}</h3>
                                    <p className="text-xs mt-1 font-medium text-teal-500">{service.price === 0 ? 'Free' : `₹${service.price}`}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Food Menu */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--nm-text)' }}>
                        <i className="fa-solid fa-utensils text-teal-400"></i>
                        Food Menu
                    </h2>
                    {loading ? (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-spinner fa-spin text-4xl text-teal-400 mb-4"></i>
                            <p style={{ color: 'var(--nm-text-2)' }}>Loading menu...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {categories.map(category => {
                                const items = menu.filter(item => item.category === category && item.isAvailable);
                                if (items.length === 0) return null;
                                return (
                                    <div key={category}>
                                        <h3 className="text-base font-bold mb-3 capitalize px-2 border-l-4 border-teal-400" style={{ color: 'var(--nm-text)' }}>{category}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {items.map(item => {
                                                const cartItem = cart.find(c => c.id === item.id);
                                                const inCart = !!cartItem;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="p-5 rounded-2xl transition-all duration-200"
                                                        style={inCart ? {
                                                            background: 'var(--nm-bg)',
                                                            boxShadow: 'inset 5px 5px 12px var(--nm-sd), inset -5px -5px 12px var(--nm-sl)',
                                                            borderRadius: '20px',
                                                        } : {
                                                            background: 'var(--nm-bg)',
                                                            boxShadow: '8px 8px 20px var(--nm-sd), -8px -8px 20px var(--nm-sl)',
                                                            borderRadius: '20px',
                                                        }}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex-1 pr-3">
                                                                <h4 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--nm-text)' }}>
                                                                    {item.name}
                                                                    {item.isVegetarian && (
                                                                        <span className="w-5 h-5 border-2 border-emerald-500 flex items-center justify-center rounded-sm flex-shrink-0" title="Vegetarian">
                                                                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                                                        </span>
                                                                    )}
                                                                </h4>
                                                                <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--nm-text-3)' }}>{item.description}</p>
                                                            </div>
                                                            <span className="text-lg font-bold text-teal-500 flex-shrink-0">₹{item.price}</span>
                                                        </div>

                                                        {inCart && (
                                                            <span className="inline-flex items-center gap-1 mt-1 mb-2 bg-teal-100 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-teal-200">
                                                                <i className="fa-solid fa-check text-[10px]"></i>
                                                                Added to order
                                                            </span>
                                                        )}

                                                        {inCart ? (
                                                            <div className="mt-3 flex items-center justify-between gap-2 p-1 rounded-xl" style={nmInset}>
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                                                                    className="flex-1 py-2 rounded-lg text-white flex items-center justify-center transition-all"
                                                                    style={{ background: 'linear-gradient(135deg, #f87171, #ef4444)', boxShadow: '2px 2px 5px var(--nm-sd)' }}
                                                                >
                                                                    <i className="fa-solid fa-minus text-xs"></i>
                                                                </button>
                                                                <span className="w-10 text-center font-bold text-base" style={{ color: 'var(--nm-text)' }}>{cartItem.quantity}</span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                                                                    className="flex-1 py-2 rounded-lg text-white flex items-center justify-center transition-all"
                                                                    style={{ background: 'linear-gradient(135deg, #2dd4bf, #06b6d4)', boxShadow: '2px 2px 5px var(--nm-sd)' }}
                                                                >
                                                                    <i className="fa-solid fa-plus text-xs"></i>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => addToCart(item)}
                                                                className="w-full mt-3 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                                                                style={{ ...nmRaised, color: 'var(--nm-text-2)' }}
                                                            >
                                                                <i className="fa-solid fa-plus text-teal-400"></i>
                                                                Add to Order
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Cart Summary */}
                {cart.length > 0 && (
                    <div style={nmCard} className="p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--nm-text)' }}>
                            <i className="fa-solid fa-cart-shopping text-teal-400"></i>
                            Your Order
                        </h3>
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(197,205,216,0.4)' }}>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--nm-text)' }}>{item.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--nm-text-3)' }}>₹{item.price} each</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="w-8 h-8 rounded-lg text-white flex items-center justify-center transition-all"
                                            style={{ background: 'linear-gradient(135deg,#f87171,#ef4444)', boxShadow: '2px 2px 5px var(--nm-sd)' }}>
                                            <i className="fa-solid fa-minus text-xs"></i>
                                        </button>
                                        <span className="w-7 text-center font-bold text-sm" style={{ color: 'var(--nm-text)' }}>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 rounded-lg text-white flex items-center justify-center transition-all"
                                            style={{ background: 'linear-gradient(135deg,#2dd4bf,#06b6d4)', boxShadow: '2px 2px 5px var(--nm-sd)' }}>
                                            <i className="fa-solid fa-plus text-xs"></i>
                                        </button>
                                        <span className="w-14 text-right font-bold text-sm text-teal-500">₹{item.price * item.quantity}</span>
                                        <button onClick={() => removeFromCart(item.id)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                            style={{ background: 'rgba(254,202,202,0.5)', color: '#ef4444' }}>
                                            <i className="fa-solid fa-trash text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Special Instructions */}
                {(cart.length > 0 || selectedServices.length > 0) && (
                    <div style={nmCard} className="p-6">
                        <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--nm-text-2)' }}>
                            <i className="fa-solid fa-note-sticky mr-2 text-teal-400"></i>
                            Special Instructions <span className="font-normal" style={{ color: 'var(--nm-text-3)' }}>(optional)</span>
                        </label>
                        <textarea
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Any special requests or dietary requirements..."
                            rows={3}
                            className="w-full px-4 py-3 text-sm"
                            style={{ ...nmInset, color: 'var(--nm-text)', width: '100%', display: 'block' }}
                        />
                    </div>
                )}

                {/* Room status banners */}
                {checkingOccupancy && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(219,234,254,0.6)', border: '1px solid #93c5fd' }}>
                        <i className="fa-solid fa-spinner fa-spin text-blue-500 text-xl flex-shrink-0"></i>
                        <div>
                            <p className="font-semibold text-blue-700 text-sm">Checking room status...</p>
                            <p className="text-blue-600 text-xs mt-0.5">This may take a moment. Please wait.</p>
                        </div>
                    </div>
                )}

                {isOccupied === false && !checkingOccupancy && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: 'rgba(254,243,199,0.7)', border: '1px solid #fcd34d' }}>
                        <i className="fa-solid fa-triangle-exclamation text-amber-500 text-xl mt-0.5 flex-shrink-0"></i>
                        <div className="flex-1">
                            <p className="font-semibold text-amber-700 text-sm">Room Not Occupied</p>
                            <p className="text-amber-600 text-xs mt-0.5">Service requests can only be placed for rooms with an active check-in.</p>
                            <button
                                onClick={() => checkOccupancy()}
                                className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
                                style={{ background: 'rgba(251,191,36,0.2)', color: '#92400e', border: '1px solid #fcd34d' }}
                            >
                                <i className="fa-solid fa-rotate-right mr-1"></i>Re-check Status
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Submit Button */}
            {(cart.length > 0 || selectedServices.length > 0) && (
                <div className="fixed bottom-0 left-0 right-0 z-40 p-4" style={{ background: 'var(--nm-bg)', boxShadow: '0 -6px 16px var(--nm-sd)' }}>
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || isOccupied === false || checkingOccupancy}
                            className="w-full py-4 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all text-base shadow-lg"
                        >
                            {submitting ? (
                                <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Submitting...</>
                            ) : checkingOccupancy ? (
                                <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Checking Room Status...</>
                            ) : isOccupied === false ? (
                                <><i className="fa-solid fa-ban mr-2"></i>Room Not Occupied</>
                            ) : (
                                <><i className="fa-solid fa-paper-plane mr-2"></i>Submit Request — ₹{calculateTotal()}</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RoomServicePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nm-bg)' }}>
                <i className="fa-solid fa-spinner fa-spin text-4xl text-teal-400"></i>
            </div>
        }>
            <RoomServiceContent />
        </Suspense>
    );
}
