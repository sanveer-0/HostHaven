'use client';

import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { useNotification } from '@/context/NotificationContext';
import { API_URL } from '@/lib/api';

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
    room?: { id: number; roomNumber: string; type: string; };
}

export default function RequestsPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notes, setNotes] = useState('');
    const { resetCount } = useNotification();

    useEffect(() => {
        loadRequests();
        resetCount();
        const handleNewRequest = () => { loadRequests(); resetCount(); };
        socket.on('new_service_request', handleNewRequest);
        const interval = setInterval(loadRequests, 30000);
        return () => { clearInterval(interval); socket.off('new_service_request', handleNewRequest); };
    }, []);

    const loadRequests = async () => {
        try {
            const response = await fetch(`${API_URL}/service-requests`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
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
            const response = await fetch(`${API_URL}/service-requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ status })
            });
            if (response.ok) loadRequests();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const addNotes = async () => {
        if (!selectedRequest) return;
        try {
            const response = await fetch(`${API_URL}/service-requests/${selectedRequest.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ staffNotes: notes })
            });
            if (response.ok) { setShowNotesModal(false); setNotes(''); setSelectedRequest(null); loadRequests(); }
        } catch (error) { console.error('Error adding notes:', error); alert('Failed to add notes'); }
    };

    const filteredRequests = requests.filter(req => filterStatus === 'all' || req.status === filterStatus);

    const getStatusStyle = (status: string): string => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getTypeIcon = (type: string) => type === 'food' ? 'fa-utensils' : 'fa-bell-concierge';

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const nmCard: React.CSSProperties = {
        background: 'var(--nm-bg)',
        boxShadow: '8px 8px 18px var(--nm-sd), -8px -8px 18px var(--nm-sl)',
        borderRadius: '20px',
    };
    const nmSection: React.CSSProperties = {
        background: 'var(--nm-surface)',
        borderRadius: '12px',
        border: '1px solid var(--nm-border)',
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="px-8 py-6 bg-transparent" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-1" style={{ color: 'var(--nm-text)' }}>Service Requests</h2>
                        <p style={{ color: 'var(--nm-text-2)' }}>Manage guest food orders and room service requests</p>
                    </div>
                    <button
                        onClick={loadRequests}
                        className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-medium transition-all"
                        style={{ boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)' }}
                    >
                        <i className="fa-solid fa-rotate mr-2"></i>Refresh
                    </button>
                </div>

                {/* Filter */}
                <div className="mt-6 max-w-xs">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--nm-text-2)' }}>Filter by Status</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-4 py-2 nm-input text-sm"
                        style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </header>

            {/* Requests List */}
            <div className="flex-1 overflow-y-auto p-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <i className="fa-solid fa-spinner fa-spin text-4xl text-teal-400 mb-4"></i>
                            <p style={{ color: 'var(--nm-text-2)' }}>Loading requests...</p>
                        </div>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="rounded-2xl p-12 text-center" style={nmCard}>
                        <i className="fa-solid fa-inbox text-6xl text-teal-200 mb-4"></i>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--nm-text)' }}>No Requests Found</h2>
                        <p style={{ color: 'var(--nm-text-3)' }}>
                            {filterStatus !== 'all' ? 'Try adjusting your filters' : 'Guest service requests will appear here'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredRequests.map((request) => (
                            <div key={request.id} className="rounded-2xl p-6 transition-all group" style={nmCard}>
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${request.type === 'food' ? 'from-orange-400 to-red-500' : 'from-teal-400 to-cyan-500'} flex items-center justify-center text-white`}
                                            style={{ boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)' }}>
                                            <i className={`fa-solid ${getTypeIcon(request.type)} text-lg`}></i>
                                        </div>
                                        <div>
                                            <h3 className="font-bold" style={{ color: 'var(--nm-text)' }}>Room {request.room?.roomNumber ?? request.roomId}</h3>
                                            <p className="text-xs" style={{ color: 'var(--nm-text-3)' }}>{formatDate(request.createdAt)}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${getStatusStyle(request.status)}`}>
                                        {request.status}
                                    </span>
                                </div>

                                {/* Description */}
                                <div className="mb-4">
                                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--nm-text)' }}>{request.description}</p>
                                    {request.type === 'food' && Array.isArray(request.items) && (
                                        <div className="rounded-xl p-3 space-y-1" style={nmSection}>
                                            {request.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span style={{ color: 'var(--nm-text-2)' }}>{item.name} x{item.quantity}</span>
                                                    <span className="font-semibold" style={{ color: 'var(--nm-text)' }}>₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {request.type === 'room_service' && Array.isArray(request.items) && (
                                        <div className="rounded-xl p-3" style={nmSection}>
                                            <ul className="text-sm space-y-1" style={{ color: 'var(--nm-text-2)' }}>
                                                {request.items.map((item: any, idx: number) => (
                                                    <li key={idx}>• {item.name}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {request.specialInstructions && (
                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-xs text-blue-600">
                                                <i className="fa-solid fa-note-sticky mr-1"></i>
                                                {request.specialInstructions}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Amount */}
                                {request.totalAmount > 0 && (
                                    <div className="mb-4 p-3 rounded-xl flex justify-between items-center" style={nmSection}>
                                        <span className="text-sm font-medium" style={{ color: 'var(--nm-text-2)' }}>Total Amount</span>
                                        <span className="text-lg font-bold text-teal-600">₹{request.totalAmount}</span>
                                    </div>
                                )}

                                {/* Staff Notes */}
                                {request.notes && (
                                    <div className="mb-4 p-3 rounded-xl" style={nmSection}>
                                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--nm-text-3)' }}>Staff Notes:</p>
                                        <p className="text-sm" style={{ color: 'var(--nm-text)' }}>{request.notes}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--nm-border)' }}>
                                    {request.status === 'pending' && (
                                        <button
                                            onClick={() => updateStatus(request.id, 'in-progress')}
                                            className="w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 rounded-lg font-medium transition-all text-sm"
                                        >
                                            <i className="fa-solid fa-play mr-2"></i>Start Processing
                                        </button>
                                    )}
                                    {request.status === 'in-progress' && (
                                        <button
                                            onClick={() => updateStatus(request.id, 'completed')}
                                            className="w-full px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200 rounded-lg font-medium transition-all text-sm"
                                        >
                                            <i className="fa-solid fa-check mr-2"></i>Mark as Completed
                                        </button>
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => { setSelectedRequest(request); setNotes(request.notes || ''); setShowNotesModal(true); }}
                                            className="px-4 py-2 rounded-lg font-medium transition-all text-sm"
                                            style={{ background: 'var(--nm-bg)', boxShadow: '3px 3px 7px var(--nm-sd), -3px -3px 7px var(--nm-sl)', color: 'var(--nm-text-2)' }}
                                        >
                                            <i className="fa-solid fa-note-sticky mr-2"></i>Notes
                                        </button>
                                        {request.status !== 'cancelled' && request.status !== 'completed' && (
                                            <button
                                                onClick={() => updateStatus(request.id, 'cancelled')}
                                                className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 rounded-lg font-medium transition-all text-sm"
                                            >
                                                <i className="fa-solid fa-times mr-2"></i>Cancel
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
                <div className="fixed inset-0 bg-[rgba(150,160,175,0.4)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in" style={{ background: 'var(--nm-bg)', boxShadow: '12px 12px 28px var(--nm-sd), -12px -12px 28px var(--nm-sl)' }}>
                        <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                            <h3 className="text-xl font-bold" style={{ color: 'var(--nm-text)' }}>Add Notes</h3>
                            <button
                                onClick={() => { setShowNotesModal(false); setNotes(''); setSelectedRequest(null); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                style={{ background: 'var(--nm-bg)', boxShadow: '3px 3px 7px var(--nm-sd), -3px -3px 7px var(--nm-sl)', color: 'var(--nm-text-2)' }}
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <p className="text-sm mb-4" style={{ color: 'var(--nm-text-2)' }}>
                            Room {selectedRequest.room?.roomNumber ?? selectedRequest.roomId} — {selectedRequest.description}
                        </p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes or comments about this request..."
                            className="w-full px-4 py-3 mb-6 text-sm"
                            style={{ boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)', background: 'var(--nm-bg)', borderRadius: '12px', border: 'none', color: 'var(--nm-text)', outline: 'none' }}
                            rows={4}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowNotesModal(false); setNotes(''); setSelectedRequest(null); }}
                                className="flex-1 px-4 py-3 font-semibold rounded-xl transition-all text-sm"
                                style={{ background: 'var(--nm-bg)', boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)', color: 'var(--nm-text-2)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addNotes}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg text-sm"
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
