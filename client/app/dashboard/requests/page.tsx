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
                return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'in-progress':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'completed':
                return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'cancelled':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
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
            <header className="px-8 py-6 border-b border-white/5 bg-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100 mb-1 drop-shadow-lg">Service Requests</h2>
                        <p className="text-slate-300">Manage guest food orders and room service requests</p>
                    </div>
                    <button
                        onClick={loadRequests}
                        className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-900/20 border border-white/10"
                    >
                        <i className="fa-solid fa-rotate mr-2"></i>
                        Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mt-6">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Filter by Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:ring-1 focus:ring-cyan-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Filter by Type</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:ring-1 focus:ring-cyan-500"
                        >
                            <option value="all">All Types</option>
                            <option value="food">Food Orders</option>
                            <option value="room_service">Room Service</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Requests List */}
            <div className="flex-1 overflow-y-auto p-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <i className="fa-solid fa-spinner fa-spin text-4xl text-cyan-500 mb-4"></i>
                            <p className="text-slate-400">Loading requests...</p>
                        </div>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="glass-card-dark rounded-2xl p-12 text-center border border-white/5">
                        <i className="fa-solid fa-inbox text-6xl text-slate-600 mb-4"></i>
                        <h2 className="text-2xl font-bold text-slate-300 mb-2">No Requests Found</h2>
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
                                className="glass-card-dark rounded-2xl p-6 hover:shadow-xl transition-all border border-white/5 group"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${request.type === 'food'
                                            ? 'from-orange-500 to-red-600'
                                            : 'from-teal-500 to-cyan-600'
                                            } flex items-center justify-center shadow-lg shadow-black/20 text-white`}>
                                            <i className={`fa-solid ${getTypeIcon(request.type)} text-lg`}></i>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">Room {request.roomId}</h3>
                                            <p className="text-xs text-slate-400">{formatDate(request.createdAt)}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${getStatusColor(request.status)}`}>
                                        {request.status}
                                    </span>
                                </div>

                                {/* Description */}
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-slate-300 mb-2">{request.description}</p>
                                    {request.type === 'food' && Array.isArray(request.items) && (
                                        <div className="bg-slate-800/50 rounded-lg p-3 space-y-1 border border-white/5">
                                            {request.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-slate-400">{item.name} x{item.quantity}</span>
                                                    <span className="font-semibold text-slate-200">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {request.type === 'room_service' && Array.isArray(request.items) && (
                                        <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
                                            <ul className="text-sm text-slate-300 space-y-1">
                                                {request.items.map((item: any, idx: number) => (
                                                    <li key={idx}>• {item.name}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {request.specialInstructions && (
                                        <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <p className="text-xs text-blue-300">
                                                <i className="fa-solid fa-note-sticky mr-1"></i>
                                                {request.specialInstructions}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Amount */}
                                {request.totalAmount > 0 && (
                                    <div className="mb-4 p-3 bg-gradient-to-r from-slate-800 to-slate-800/50 border border-white/5 rounded-lg flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-400">Total Amount</span>
                                        <span className="text-lg font-bold text-cyan-400">₹{request.totalAmount}</span>
                                    </div>
                                )}

                                {/* Notes */}
                                {request.notes && (
                                    <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-white/5">
                                        <p className="text-xs font-semibold text-slate-500 mb-1">Staff Notes:</p>
                                        <p className="text-sm text-slate-300">{request.notes}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    {request.status === 'pending' && (
                                        <button
                                            onClick={() => updateStatus(request.id, 'in-progress')}
                                            className="w-full px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg font-medium transition-all"
                                        >
                                            <i className="fa-solid fa-play mr-2"></i>
                                            Start Processing
                                        </button>
                                    )}
                                    {request.status === 'in-progress' && (
                                        <button
                                            onClick={() => updateStatus(request.id, 'completed')}
                                            className="w-full px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg font-medium transition-all"
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
                                            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-all text-sm border border-white/5"
                                        >
                                            <i className="fa-solid fa-note-sticky mr-2"></i>
                                            Notes
                                        </button>
                                        {request.status !== 'cancelled' && request.status !== 'completed' && (
                                            <button
                                                onClick={() => updateStatus(request.id, 'cancelled')}
                                                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg font-medium transition-all text-sm"
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
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card-dark rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/10 animate-scale-in">
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                            <h3 className="text-xl font-bold text-slate-100">Add Notes</h3>
                            <button
                                onClick={() => {
                                    setShowNotesModal(false);
                                    setNotes('');
                                    setSelectedRequest(null);
                                }}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">
                            Room {selectedRequest.roomId} - {selectedRequest.description}
                        </p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes or comments about this request..."
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:ring-1 focus:ring-cyan-500 focus:outline-none mb-6 placeholder-slate-600"
                            rows={4}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowNotesModal(false);
                                    setNotes('');
                                    setSelectedRequest(null);
                                }}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-all border border-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addNotes}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-900/20"
                            >
                                Save Notes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
