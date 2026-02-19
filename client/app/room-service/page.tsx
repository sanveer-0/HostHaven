'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

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
            // Refresh requests every 15 seconds
            const interval = setInterval(loadMyRequests, 15000);
            return () => clearInterval(interval);
        }
    }, [roomNumber]);

    const checkOccupancy = async () => {
        try {
            const roomsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms`);
            const roomsData = await roomsResponse.json();
            const rooms = Array.isArray(roomsData) ? roomsData : [];
            const room = rooms.find((r: any) => r.roomNumber === roomNumber);
            if (!room) { setIsOccupied(false); return; }

            const bookingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/room/${room.id}`);
            const bookingsData = await bookingsResponse.json();
            const bookings = Array.isArray(bookingsData) ? bookingsData : [];
            const activeBooking = bookings.find((b: any) => b.bookingStatus === 'checked-in');
            setIsOccupied(!!activeBooking);
            if (activeBooking) setActiveBookingId(activeBooking.id);
        } catch {
            setIsOccupied(false);
        }
    };

    const loadMenu = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu`);
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
            const roomsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms`);
            const roomsData = await roomsResponse.json();
            const rooms = Array.isArray(roomsData) ? roomsData : [];
            const room = rooms.find((r: any) => r.roomNumber === roomNumber);

            if (room) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/room/${room.id}`);
                const data = await response.json();
                const all = Array.isArray(data) ? data : [];
                // Only show requests from the current active booking
                const bookingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/room/${room.id}`);
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
        if (!roomNumber) {
            alert('Room number not found');
            return;
        }

        if (cart.length === 0 && selectedServices.length === 0) {
            alert('Please add items to your order');
            return;
        }

        if (!isOccupied) {
            alert('This room is currently unoccupied. Service requests can only be submitted for checked-in guests.');
            return;
        }

        setSubmitting(true);
        try {
            const roomsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms`);
            const roomsData = await roomsResponse.json();
            const rooms = Array.isArray(roomsData) ? roomsData : [];
            const room = rooms.find((r: any) => r.roomNumber === roomNumber);

            if (!room) {
                throw new Error('Room not found');
            }

            const bookingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/room/${room.id}`);
            const bookingsData = await bookingsResponse.json();
            const bookings = Array.isArray(bookingsData) ? bookingsData : [];
            const activeBooking = bookings.find((b: any) => b.bookingStatus === 'checked-in');

            // Combine food and service items
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
                    : cart.length > 0
                        ? 'Food Order'
                        : 'Room Service Request',
                specialInstructions,
                totalAmount: calculateTotal()
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                alert('Request submitted successfully!');
                setCart([]);
                setSelectedServices([]);
                setSpecialInstructions('');
                loadMyRequests();
                setShowMyRequests(true);
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

    if (!roomNumber) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex items-center justify-center p-4 text-slate-100 relative overflow-hidden">
                <div className="glass-dark rounded-2xl p-8 text-center max-w-md relative z-10">
                    <i className="fa-solid fa-exclamation-triangle text-6xl text-amber-500 mb-4 animate-bounce"></i>
                    <h1 className="text-2xl font-bold text-slate-100 mb-2">Invalid Access</h1>
                    <p className="text-slate-300">Please scan the QR code in your room to access room service.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 pb-6 text-slate-100 relative overflow-x-hidden">

            {/* Header */}
            <header className="glass-dark border-b border-white/5 p-4 md:p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <i className="fa-solid fa-bell-concierge text-lg md:text-xl text-white"></i>
                            </div>
                            <div>
                                <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                    Room Service
                                </h1>
                                <p className="text-xs md:text-sm text-slate-400">Room {roomNumber}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                            {(cart.length > 0 || selectedServices.length > 0) && (
                                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl font-semibold text-sm md:text-base shadow-lg shadow-cyan-500/30">
                                    ₹{calculateTotal()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Floating My Requests Button */}
            <button
                onClick={() => {
                    const isOpening = !showMyRequests;
                    setShowMyRequests(isOpening);
                    if (isOpening) {
                        setTimeout(() => {
                            myRequestsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                    }
                }}
                className="fixed bottom-6 right-4 md:right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-semibold shadow-xl shadow-cyan-900/40 transition-all border border-white/10 text-sm"
            >
                <i className="fa-solid fa-clock-rotate-left"></i>
                <span>My Requests</span>
                {myRequests.filter((r: any) => r.status === 'pending' || r.status === 'in-progress').length > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                        {myRequests.filter((r: any) => r.status === 'pending' || r.status === 'in-progress').length}
                    </span>
                )}
            </button>

            <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-6 relative z-10">
                {/* My Requests Section */}
                {showMyRequests && (
                    <div ref={myRequestsRef} className="mb-6 glass-dark rounded-2xl p-6 border border-white/10 animate-scale-in">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-slate-100">My Requests</h2>
                            <button
                                onClick={() => setShowMyRequests(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <i className="fa-solid fa-times text-xl"></i>
                            </button>
                        </div>
                        {myRequests.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">No requests yet</p>
                        ) : (
                            <div className="space-y-4">
                                {myRequests.map((request: any) => (
                                    <div key={request.id} className="bg-slate-800/60 rounded-xl p-4 border border-white/5">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-slate-200">{request.description}</h3>
                                                <p className="text-sm text-slate-400">
                                                    {new Date(request.createdAt).toLocaleString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${request.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                request.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                                                    request.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                        'bg-red-500/20 text-red-400'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </div>

                                        {/* Items List */}
                                        {request.items && Array.isArray(request.items) && request.items.length > 0 && (
                                            <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
                                                <p className="text-xs font-semibold text-slate-400 mb-2">
                                                    <i className="fa-solid fa-list mr-1"></i>
                                                    Items Ordered:
                                                </p>
                                                <div className="space-y-1">
                                                    {request.items.map((item: any, index: number) => (
                                                        <div key={index} className="flex justify-between text-sm">
                                                            <span className="text-slate-300">
                                                                {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ''}
                                                                {item.name}
                                                            </span>
                                                            {item.price > 0 && (
                                                                <span className="text-slate-400 font-medium">
                                                                    ₹{item.quantity ? item.price * item.quantity : item.price}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {request.totalAmount > 0 && (
                                            <p className="text-sm font-semibold text-cyan-400 mt-2">Total: ₹{request.totalAmount}</p>
                                        )}
                                        {request.specialInstructions && (
                                            <p className="text-sm text-slate-400 mt-2">
                                                <i className="fa-solid fa-note-sticky mr-1"></i>
                                                {request.specialInstructions}
                                            </p>
                                        )}
                                        {request.staffNotes && (
                                            <div className="mt-2 p-3 bg-blue-900/20 border-l-4 border-blue-500 rounded">
                                                <p className="text-xs font-semibold text-blue-400 mb-1">
                                                    <i className="fa-solid fa-user-tie mr-1"></i>
                                                    Staff Notes:
                                                </p>
                                                <p className="text-sm text-blue-300">
                                                    {request.staffNotes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Room Service Items Section */}
                <div className="mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-100 mb-3 md:mb-4 flex items-center gap-2 drop-shadow-md">
                        <i className="fa-solid fa-concierge-bell text-teal-400"></i>
                        Quick Services
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                        {roomServiceItems.map(service => (
                            <button
                                key={service.name}
                                onClick={() => toggleService(service.name)}
                                className={`group p-4 md:p-5 rounded-2xl text-center transition-all duration-300 border backdrop-blur-md relative overflow-hidden ${selectedServices.includes(service.name)
                                    ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/40 border-cyan-400 scale-105'
                                    : 'glass-card-dark text-slate-300 hover:text-white hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-900/20 cursor-pointer'
                                    }`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity ${!selectedServices.includes(service.name) ? 'group-hover:opacity-100' : ''}`}></div>
                                <i className={`fa-solid ${service.icon} text-2xl md:text-3xl mb-3 transition-transform ${selectedServices.includes(service.name) ? 'scale-110' : 'group-hover:scale-110'}`}></i>
                                <h3 className="font-semibold text-xs md:text-sm mb-1 leading-tight">{service.name}</h3>
                                <p className={`text-xs ${selectedServices.includes(service.name) ? 'text-cyan-100' : 'text-slate-500 group-hover:text-cyan-400'}`}>
                                    {service.price === 0 ? 'Free' : `₹${service.price}`}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Food Menu Section */}
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-100 mb-3 md:mb-4 flex items-center gap-2 drop-shadow-md">
                        <i className="fa-solid fa-utensils text-cyan-400"></i>
                        Food Menu
                    </h2>
                    {loading ? (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-spinner fa-spin text-4xl text-cyan-500 mb-4"></i>
                            <p className="text-slate-400">Loading menu...</p>
                        </div>
                    ) : (
                        <div className="space-y-8 md:space-y-10">
                            {categories.map(category => {
                                const items = menu.filter(item => item.category === category && item.isAvailable);
                                if (items.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h3 className="text-lg md:text-xl font-bold text-teal-300 mb-4 capitalize px-2 border-l-4 border-teal-500">{category}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                            {items.map(item => {
                                                const cartItem = cart.find(c => c.id === item.id);
                                                const inCart = !!cartItem;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`rounded-2xl p-5 transition-all duration-300 group relative ${inCart
                                                            ? 'bg-cyan-950/60 ring-2 ring-cyan-500/60 shadow-lg shadow-cyan-900/30'
                                                            : 'glass-card-dark ring-1 ring-white/5 hover:ring-cyan-500/30 hover:shadow-2xl hover:shadow-black/40'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="flex-1 pr-3">
                                                                <h4 className={`font-bold flex items-center gap-2 text-base md:text-lg transition-colors ${inCart ? 'text-cyan-300' : 'text-slate-100 group-hover:text-cyan-300'}`}>
                                                                    {item.name}
                                                                    {item.isVegetarian && (
                                                                        <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-green-500 flex items-center justify-center flex-shrink-0 rounded-sm" title="Vegetarian">
                                                                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full"></span>
                                                                        </span>
                                                                    )}
                                                                </h4>
                                                                <p className="text-xs md:text-sm text-slate-400 line-clamp-2 mt-1">{item.description}</p>
                                                            </div>
                                                            <span className="text-base md:text-xl font-bold text-teal-400 flex-shrink-0 drop-shadow-sm">₹{item.price}</span>
                                                        </div>

                                                        {/* "In cart" badge — inline, below description */}
                                                        {inCart && (
                                                            <span className="inline-flex items-center gap-1 mt-2 mb-1 bg-cyan-500/20 text-cyan-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-cyan-500/30">
                                                                <i className="fa-solid fa-check text-[10px]"></i>
                                                                Added to order
                                                            </span>
                                                        )}

                                                        {inCart ? (
                                                            /* Inline quantity controls */
                                                            <div className="mt-3 flex items-center justify-between gap-2 bg-slate-900/50 rounded-xl p-1">
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                                                                    className="flex-1 py-2 bg-slate-700 hover:bg-red-500/40 text-white rounded-lg flex items-center justify-center transition-colors"
                                                                >
                                                                    <i className="fa-solid fa-minus text-xs"></i>
                                                                </button>
                                                                <span className="w-10 text-center font-bold text-slate-100 text-base">
                                                                    {cartItem.quantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                                                                    className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-cyan-900/20"
                                                                >
                                                                    <i className="fa-solid fa-plus text-xs"></i>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            /* Add to Order button */
                                                            <button
                                                                onClick={() => addToCart(item)}
                                                                className="w-full mt-3 px-4 py-2.5 bg-slate-800 hover:bg-gradient-to-r hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all text-sm md:text-base border border-white/5 hover:border-transparent group-hover:shadow-lg shadow-black/20"
                                                            >
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <i className="fa-solid fa-plus"></i>
                                                                    Add to Order
                                                                </div>
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

                {/* Cart */}
                {cart.length > 0 && (
                    <div className="mt-8 md:mt-10 glass-dark rounded-2xl p-5 md:p-6 border border-teal-500/20 shadow-xl shadow-teal-900/10">
                        <h3 className="text-lg md:text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-cart-shopping text-teal-400"></i>
                            Your Order
                        </h3>
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-xl border border-white/5">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-200 text-sm md:text-base truncate">{item.name}</p>
                                        <p className="text-xs md:text-sm text-slate-400">₹{item.price} each</p>
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="w-8 h-8 md:w-9 md:h-9 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-white transition-colors"
                                        >
                                            <i className="fa-solid fa-minus text-xs"></i>
                                        </button>
                                        <span className="w-6 md:w-8 text-center font-bold text-slate-100 text-sm md:text-base">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 md:w-9 md:h-9 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-cyan-900/20"
                                        >
                                            <i className="fa-solid fa-plus text-xs"></i>
                                        </button>
                                        <span className="w-16 md:w-20 text-right font-bold text-teal-400 text-sm md:text-base">₹{item.price * item.quantity}</span>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="w-8 h-8 md:w-9 md:h-9 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg flex items-center justify-center transition-colors"
                                        >
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
                    <div className="mt-4 md:mt-6 glass-dark rounded-2xl p-4 md:p-6 border border-white/5">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Special Instructions (Optional)
                        </label>
                        <textarea
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Any special requests or dietary requirements..."
                            className="w-full px-3 py-2 md:px-4 md:py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base"
                            rows={3}
                        />
                    </div>
                )}

                {/* Unoccupied room warning */}
                {isOccupied === false && (
                    <div className="mt-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                        <i className="fa-solid fa-triangle-exclamation text-amber-400 text-xl mt-0.5 flex-shrink-0"></i>
                        <div>
                            <p className="font-semibold text-amber-300 text-sm">Room Not Occupied</p>
                            <p className="text-amber-400/80 text-xs mt-0.5">Service requests can only be placed for rooms with an active check-in. Please contact the front desk if you need assistance.</p>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                {(cart.length > 0 || selectedServices.length > 0) && (
                    <div className="mt-4 md:mt-6 sticky bottom-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent pt-6 pb-4 md:pb-0 md:static md:bg-none z-40">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || isOccupied === false}
                            className="w-full px-6 py-3 md:py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-cyan-900/40 transition-all text-base md:text-lg border border-white/10"
                        >
                            {submitting ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                    Submitting...
                                </>
                            ) : isOccupied === false ? (
                                <>
                                    <i className="fa-solid fa-ban mr-2"></i>
                                    Room Not Occupied
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-paper-plane mr-2"></i>
                                    Submit Request - ₹{calculateTotal()}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RoomServicePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><i className="fa-solid fa-spinner fa-spin text-4xl text-cyan-500"></i></div>}>
            <RoomServiceContent />
        </Suspense>
    );
}
