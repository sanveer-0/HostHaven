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
            <header className="px-8 py-6 border-b border-white/5 bg-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100 mb-1 drop-shadow-lg">Guest Directory</h2>
                        <p className="text-slate-300">View and manage all registered guests</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg shadow-cyan-900/30 flex items-center gap-2 border border-white/10"
                    >
                        <i className="fa-solid fa-user-plus"></i>
                        <span>Add Guest</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="glass-card-dark rounded-2xl overflow-hidden shadow-lg animate-fade-in border border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-white/5">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <i className="fa-solid fa-spinner fa-spin text-3xl text-cyan-400 mb-3"></i>
                                            <p className="text-slate-400">Loading guests...</p>
                                        </td>
                                    </tr>
                                ) : guests.length > 0 ? (
                                    guests.map((guest) => (
                                        <tr key={guest.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-cyan-900/20">
                                                        {guest.name[0]}
                                                    </div>
                                                    <span className="text-slate-200 font-medium group-hover:text-cyan-300 transition-colors">{guest.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">{guest.email}</td>
                                            <td className="px-6 py-4 text-slate-400">{guest.phone}</td>
                                            <td className="px-6 py-4 text-slate-400">{guest.address || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${guest.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                                                    {guest.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <i className="fa-solid fa-users-slash text-4xl text-slate-600 mb-3"></i>
                                            <p className="text-slate-400">No guests found</p>
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
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card-dark rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in border border-white/10">
                        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                            <h3 className="text-2xl font-bold text-slate-100">Add New Guest</h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    placeholder="john@example.com"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    placeholder="+1 234 567 8900"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="123 Beach St"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">ID Proof</label>
                                <input
                                    type="text"
                                    value={formData.idProof}
                                    onChange={(e) => setFormData({ ...formData, idProof: e.target.value })}
                                    required
                                    placeholder="Passport/License Number"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600"
                                />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-all border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-900/20"
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
