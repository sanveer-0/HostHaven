'use client';

import { useEffect, useState } from 'react';
import { guestsAPI, Guest } from '@/lib/api';

export default function GuestsPage() {
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        idProof: '',
    });

    useEffect(() => {
        loadGuests();
    }, []);

    const loadGuests = async () => {
        try {
            const data = await guestsAPI.getAll();
            setGuests(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await guestsAPI.create(formData);
            setShowModal(false);
            setFormData({ name: '', email: '', phone: '', address: '', idProof: '' });
            loadGuests();
        } catch (err) {
            console.error(err);
            alert('Failed to create guest');
        }
    };

    return (
        <>
            <header className="px-8 py-6 border-b border-white/60 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-1">Guest Directory</h2>
                        <p className="text-slate-600">View and manage all registered guests 👥</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2"
                    >
                        <i className="fa-solid fa-user-plus"></i>
                        <span>Add Guest</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden shadow-lg animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Address</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <i className="fa-solid fa-spinner fa-spin text-3xl text-cyan-500 mb-3"></i>
                                            <p className="text-slate-600">Loading guests...</p>
                                        </td>
                                    </tr>
                                ) : guests.length > 0 ? (
                                    guests.map((guest) => (
                                        <tr key={guest.id} className="hover:bg-amber-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-semibold shadow-md">
                                                        {guest.name[0]}
                                                    </div>
                                                    <span className="text-slate-800 font-medium">{guest.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">{guest.email}</td>
                                            <td className="px-6 py-4 text-slate-600">{guest.phone}</td>
                                            <td className="px-6 py-4 text-slate-600">{guest.address || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${guest.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                                                    {guest.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <i className="fa-solid fa-users-slash text-4xl text-slate-300 mb-3"></i>
                                            <p className="text-slate-500">No guests found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Guest Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">Add New Guest</h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    placeholder="john@example.com"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    placeholder="+1 234 567 8900"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="123 Beach St"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">ID Proof</label>
                                <input
                                    type="text"
                                    value={formData.idProof}
                                    onChange={(e) => setFormData({ ...formData, idProof: e.target.value })}
                                    required
                                    placeholder="Passport/License Number"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                />
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
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl transition-all shadow-lg"
                                >
                                    Add Guest
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
