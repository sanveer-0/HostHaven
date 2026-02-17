'use client';

import { useEffect, useState } from 'react';

interface ServiceRequest {
    id: number;
    roomId: number;
    bookingId: number;
    type: string;
    items: any;
    description: string;
    specialInstructions?: string;
    totalAmount: number;
    status: string;
    notes?: string;
    createdAt: string;
    completedAt?: string;
}

export default function RequestsPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadRequests();
        // Refresh every 30 seconds
        const interval = setInterval(loadRequests, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadRequests = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            // Ensure data is an array
            setRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading requests:', error);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                loadRequests();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const addNotes = async () => {
        if (!selectedRequest) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedRequest.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ staffNotes: notes })
            });

            if (response.ok) {
                setShowNotesModal(false);
                setNotes('');
                setSelectedRequest(null);
                loadRequests();
            }
        } catch (error) {
            console.error('Error adding notes:', error);
            alert('Failed to add notes');
        }
    };

    const filteredRequests = requests.filter(req => {
        if (filterStatus !== 'all' && req.status !== filterStatus) return false;
        if (filterType !== 'all' && req.type !== filterType) return false;
        return true;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-700 border-amber-300';
            case 'in-progress':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'completed':
                return 'bg-green-100 text-green-700 border-green-300';
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-300';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    };

    const getTypeIcon = (type: string) => {
        return type === 'food' ? 'fa-utensils' : 'fa-bell-concierge';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-white/60 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Service Requests
                        </h1>
                        <p className="text-slate-600 mt-1">Manage guest food orders and room service requests</p>
                    </div>
                    <button
                        onClick={loadRequests}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all shadow-lg"
                    >
                        <i className="fa-solid fa-rotate mr-2"></i>
                        Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mt-6">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Type</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">All Types</option>
                            <option value="food">Food Orders</option>
                            <option value="room_service">Room Service</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Requests List */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <i className="fa-solid fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
                            <p className="text-slate-600">Loading requests...</p>
                        </div>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 text-center">
                        <i className="fa-solid fa-inbox text-6xl text-slate-300 mb-4"></i>
                        <h2 className="text-2xl font-bold text-slate-700 mb-2">No Requests Found</h2>
                        <p className="text-slate-500">
                            {filterStatus !== 'all' || filterType !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Guest service requests will appear here'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredRequests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:shadow-xl transition-all border border-white/60"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${request.type === 'food'
                                            ? 'from-orange-500 to-red-500'
                                            : 'from-teal-500 to-cyan-500'
                                            } flex items-center justify-center shadow-lg`}>
                                            <i className={`fa-solid ${getTypeIcon(request.type)} text-white text-lg`}></i>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">Room {request.roomId}</h3>
                                            <p className="text-xs text-slate-600">{formatDate(request.createdAt)}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${getStatusColor(request.status)}`}>
                                        {request.status}
                                    </span>
                                </div>

                                {/* Description */}
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-slate-700 mb-2">{request.description}</p>
                                    {request.type === 'food' && Array.isArray(request.items) && (
                                        <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                                            {request.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-slate-700">{item.name} x{item.quantity}</span>
                                                    <span className="font-semibold text-slate-800">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {request.type === 'room_service' && Array.isArray(request.items) && (
                                        <div className="bg-slate-50 rounded-lg p-3">
                                            <ul className="text-sm text-slate-700 space-y-1">
                                                {request.items.map((item: any, idx: number) => (
                                                    <li key={idx}>• {item.name}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {request.specialInstructions && (
                                        <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                            <p className="text-xs text-blue-700">
                                                <i className="fa-solid fa-note-sticky mr-1"></i>
                                                {request.specialInstructions}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Amount */}
                                {request.totalAmount > 0 && (
                                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-slate-700">Total Amount</span>
                                            <span className="text-lg font-bold text-purple-600">₹{request.totalAmount}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {request.notes && (
                                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs font-semibold text-slate-600 mb-1">Staff Notes:</p>
                                        <p className="text-sm text-slate-700">{request.notes}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="space-y-2">
                                    {request.status === 'pending' && (
                                        <button
                                            onClick={() => updateStatus(request.id, 'in-progress')}
                                            className="w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-all"
                                        >
                                            <i className="fa-solid fa-play mr-2"></i>
                                            Start Processing
                                        </button>
                                    )}
                                    {request.status === 'in-progress' && (
                                        <button
                                            onClick={() => updateStatus(request.id, 'completed')}
                                            className="w-full px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-all"
                                        >
                                            <i className="fa-solid fa-check mr-2"></i>
                                            Mark as Completed
                                        </button>
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedRequest(request);
                                                setNotes(request.notes || '');
                                                setShowNotesModal(true);
                                            }}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-all text-sm"
                                        >
                                            <i className="fa-solid fa-note-sticky mr-2"></i>
                                            Notes
                                        </button>
                                        {request.status !== 'cancelled' && request.status !== 'completed' && (
                                            <button
                                                onClick={() => updateStatus(request.id, 'cancelled')}
                                                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-all text-sm"
                                            >
                                                <i className="fa-solid fa-times mr-2"></i>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes Modal */}
            {showNotesModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-800">Add Notes</h3>
                            <button
                                onClick={() => {
                                    setShowNotesModal(false);
                                    setNotes('');
                                    setSelectedRequest(null);
                                }}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Room {selectedRequest.roomId} - {selectedRequest.description}
                        </p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes or comments about this request..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                            rows={4}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={addNotes}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all"
                            >
                                Save Notes
                            </button>
                            <button
                                onClick={() => {
                                    setShowNotesModal(false);
                                    setNotes('');
                                    setSelectedRequest(null);
                                }}
                                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
