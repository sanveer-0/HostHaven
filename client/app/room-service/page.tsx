'use client';

import { useEffect, useState } from 'react';
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

export default function RoomServicePage() {
    const searchParams = useSearchParams();
    const roomNumber = searchParams.get('room');

    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [showMyRequests, setShowMyRequests] = useState(false);

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
            // Refresh requests every 15 seconds
            const interval = setInterval(loadMyRequests, 15000);
            return () => clearInterval(interval);
        }
    }, [roomNumber]);

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
                setMyRequests(Array.isArray(data) ? data : []);
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
            <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center max-w-md">
                    <i className="fa-solid fa-exclamation-triangle text-6xl text-amber-500 mb-4"></i>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Invalid Access</h1>
                    <p className="text-slate-600">Please scan the QR code in your room to access room service.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 pb-6">
            {/* Header */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-white/60 p-4 md:p-6 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                                <i className="fa-solid fa-hotel text-lg md:text-xl text-white"></i>
                            </div>
                            <div>
                                <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                    Room Service
                                </h1>
                                <p className="text-xs md:text-sm text-slate-600">Room {roomNumber}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                            <button
                                onClick={() => setShowMyRequests(!showMyRequests)}
                                className="px-3 py-2 md:px-4 md:py-2 bg-white/70 hover:bg-white text-slate-700 rounded-xl font-medium transition-all border border-slate-200 relative text-sm"
                            >
                                <i className="fa-solid fa-clock-rotate-left md:mr-2"></i>
                                <span className="hidden md:inline">My Requests</span>
                                {myRequests.length > 0 && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        {myRequests.filter((r: any) => r.status === 'pending' || r.status === 'in-progress').length}
                                    </span>
                                )}
                            </button>
                            {(cart.length > 0 || selectedServices.length > 0) && (
                                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl font-semibold text-sm md:text-base">
                                    ₹{calculateTotal()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-6">
                {/* My Requests Section */}
                {showMyRequests && (
                    <div className="mb-6 bg-white/70 backdrop-blur-sm rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-slate-800">My Requests</h2>
                            <button
                                onClick={() => setShowMyRequests(false)}
                                className="text-slate-600 hover:text-slate-800"
                            >
                                <i className="fa-solid fa-times text-xl"></i>
                            </button>
                        </div>
                        {myRequests.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">No requests yet</p>
                        ) : (
                            <div className="space-y-4">
                                {myRequests.map((request: any) => (
                                    <div key={request.id} className="bg-white rounded-xl p-4 border border-slate-200">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-slate-800">{request.description}</h3>
                                                <p className="text-sm text-slate-600">
                                                    {new Date(request.createdAt).toLocaleString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                request.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                                    request.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </div>

                                        {/* Items List */}
                                        {request.items && Array.isArray(request.items) && request.items.length > 0 && (
                                            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                                <p className="text-xs font-semibold text-slate-700 mb-2">
                                                    <i className="fa-solid fa-list mr-1"></i>
                                                    Items Ordered:
                                                </p>
                                                <div className="space-y-1">
                                                    {request.items.map((item: any, index: number) => (
                                                        <div key={index} className="flex justify-between text-sm">
                                                            <span className="text-slate-700">
                                                                {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ''}
                                                                {item.name}
                                                            </span>
                                                            {item.price > 0 && (
                                                                <span className="text-slate-600 font-medium">
                                                                    ₹{item.quantity ? item.price * item.quantity : item.price}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {request.totalAmount > 0 && (
                                            <p className="text-sm font-semibold text-cyan-600 mt-2">Total: ₹{request.totalAmount}</p>
                                        )}
                                        {request.specialInstructions && (
                                            <p className="text-sm text-slate-600 mt-2">
                                                <i className="fa-solid fa-note-sticky mr-1"></i>
                                                {request.specialInstructions}
                                            </p>
                                        )}
                                        {request.staffNotes && (
                                            <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                                                <p className="text-xs font-semibold text-blue-700 mb-1">
                                                    <i className="fa-solid fa-user-tie mr-1"></i>
                                                    Staff Notes:
                                                </p>
                                                <p className="text-sm text-blue-800">
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
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-bell-concierge text-teal-600"></i>
                        Room Service
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                        {roomServiceItems.map(service => (
                            <button
                                key={service.name}
                                onClick={() => toggleService(service.name)}
                                className={`p-3 md:p-4 rounded-xl text-center transition-all ${selectedServices.includes(service.name)
                                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg scale-105'
                                    : 'bg-white/70 hover:bg-white text-slate-800 hover:shadow-md'
                                    }`}
                            >
                                <i className={`fa-solid ${service.icon} text-2xl md:text-3xl mb-2`}></i>
                                <h3 className="font-semibold text-xs md:text-sm mb-1 leading-tight">{service.name}</h3>
                                <p className="text-xs opacity-90">
                                    {service.price === 0 ? 'Free' : `₹${service.price}`}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Food Menu Section */}
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-utensils text-cyan-600"></i>
                        Food Menu
                    </h2>
                    {loading ? (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-spinner fa-spin text-4xl text-cyan-500 mb-4"></i>
                            <p className="text-slate-600">Loading menu...</p>
                        </div>
                    ) : (
                        <div className="space-y-6 md:space-y-8">
                            {categories.map(category => {
                                const items = menu.filter(item => item.category === category && item.isAvailable);
                                if (items.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h3 className="text-lg md:text-xl font-bold text-slate-700 mb-3 capitalize">{category}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                            {items.map(item => (
                                                <div key={item.id} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 hover:shadow-lg transition-all">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex-1 pr-2">
                                                            <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                                                                {item.name}
                                                                {item.isVegetarian && (
                                                                    <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-green-600 flex items-center justify-center flex-shrink-0">
                                                                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-600 rounded-full"></span>
                                                                    </span>
                                                                )}
                                                            </h4>
                                                            <p className="text-xs md:text-sm text-slate-600 line-clamp-2">{item.description}</p>
                                                        </div>
                                                        <span className="text-base md:text-lg font-bold text-cyan-600 flex-shrink-0">₹{item.price}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => addToCart(item)}
                                                        className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all text-sm md:text-base"
                                                    >
                                                        <i className="fa-solid fa-plus mr-2"></i>
                                                        Add to Cart
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Cart */}
                {cart.length > 0 && (
                    <div className="mt-6 md:mt-8 bg-white/70 backdrop-blur-sm rounded-xl p-4 md:p-6">
                        <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4">Your Food Order</h3>
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 text-sm md:text-base truncate">{item.name}</p>
                                        <p className="text-xs md:text-sm text-slate-600">₹{item.price} each</p>
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="w-7 h-7 md:w-8 md:h-8 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center"
                                        >
                                            <i className="fa-solid fa-minus text-xs"></i>
                                        </button>
                                        <span className="w-6 md:w-8 text-center font-semibold text-sm md:text-base">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-7 h-7 md:w-8 md:h-8 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center justify-center"
                                        >
                                            <i className="fa-solid fa-plus text-xs"></i>
                                        </button>
                                        <span className="w-16 md:w-20 text-right font-bold text-cyan-600 text-sm md:text-base">₹{item.price * item.quantity}</span>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="w-7 h-7 md:w-8 md:h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center"
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
                    <div className="mt-4 md:mt-6 bg-white/70 backdrop-blur-sm rounded-xl p-4 md:p-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Special Instructions (Optional)
                        </label>
                        <textarea
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Any special requests or dietary requirements..."
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm md:text-base"
                            rows={3}
                        />
                    </div>
                )}

                {/* Submit Button */}
                {(cart.length > 0 || selectedServices.length > 0) && (
                    <div className="mt-4 md:mt-6 sticky bottom-0 bg-gradient-to-t from-sky-100 via-cyan-50 to-transparent pt-4 pb-2 md:pb-0 md:static md:bg-none">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full px-6 py-3 md:py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl shadow-lg transition-all text-base md:text-lg"
                        >
                            {submitting ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                    Submitting...
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
