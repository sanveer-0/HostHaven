'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardAPI, DashboardStats } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [revenueData, setRevenueData] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [statsData, revenue] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getRevenue()
            ]);
            setStats(statsData);
            setRevenueData(revenue);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
            case 'checked-in':
                return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            case 'pending':
                return 'bg-amber-100 text-amber-700 border-amber-300';
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-300';
            case 'checked-out':
                return 'bg-slate-100 text-slate-700 border-slate-300';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-cyan-500 mb-4"></i>
                    <p className="text-slate-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <i className="fa-solid fa-circle-exclamation text-4xl text-red-500 mb-4"></i>
                    <p className="text-red-600">Error: {error}</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Bookings',
            value: stats?.totalBookings || 0,
            icon: 'fa-calendar-check',
            gradient: 'from-cyan-500 to-blue-500',
            bgGradient: 'from-cyan-100 to-blue-100',
        },
        {
            title: 'Occupied Rooms',
            value: stats?.occupiedRooms || 0,
            icon: 'fa-bed',
            gradient: 'from-blue-500 to-teal-500',
            bgGradient: 'from-blue-100 to-teal-100',
        },
        {
            title: 'Active Guests',
            value: stats?.activeGuests || 0,
            icon: 'fa-users',
            gradient: 'from-teal-500 to-cyan-500',
            bgGradient: 'from-teal-100 to-cyan-100',
        },
        {
            title: 'Total Revenue',
            value: `₹${stats?.totalRevenue?.toLocaleString('en-IN') || 0}`,
            icon: 'fa-indian-rupee-sign',
            gradient: 'from-amber-400 to-orange-400',
            bgGradient: 'from-amber-100 to-orange-100',
        },
    ];

    return (
        <>
            {/* Header */}
            <header className="px-8 py-6 border-b border-white/60 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-1">Dashboard Overview</h2>
                        <p className="text-slate-600">Welcome back! Here's your property status</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white/60 rounded-lg border border-slate-200">
                            <i className="fa-regular fa-calendar text-cyan-600 mr-2"></i>
                            <span className="text-sm text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((card, index) => (
                        <div
                            key={card.title}
                            className="bg-white/70 backdrop-blur-sm border border-white/60 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-2">{card.title}</p>
                                    <h3 className="text-3xl font-bold text-slate-800">{card.value}</h3>
                                </div>
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.bgGradient} flex items-center justify-center shadow-md`}>
                                    <i className={`fa-solid ${card.icon} text-2xl bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}></i>
                                </div>
                            </div>
                            <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${card.gradient}`}></div>
                        </div>
                    ))}
                </div>

                {/* Statistics Graph */}
                {Object.keys(revenueData).length > 0 ? (
                    <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden shadow-lg mb-8 animate-fade-in">
                        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-white/50 to-cyan-50/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-1">Revenue Trend</h3>
                                    <p className="text-sm text-slate-600">Monthly revenue from completed payments</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={Object.entries(revenueData).map(([month, revenue]) => ({
                                        month,
                                        revenue
                                    }))}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" stroke="#64748b" />
                                    <YAxis stroke="#0891b2" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        formatter={() => 'Revenue (₹)'}
                                    />
                                    <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[8, 8, 0, 0]} />
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.6} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : null}

                {/* Recent Bookings */}
                <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden shadow-lg animate-fade-in">
                    <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-white/50 to-cyan-50/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-1">Recent Bookings</h3>
                                <p className="text-sm text-slate-600">Latest reservation activity</p>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard/bookings')}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-md"
                            >
                                View All
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Guest
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Room
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Check-in Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {stats?.recentBookings && stats.recentBookings.length > 0 ? (
                                    stats.recentBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-cyan-50/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold shadow-md">
                                                        {booking.guest?.name?.[0] || 'U'}
                                                    </div>
                                                    <span className="text-slate-800 font-medium">{booking.guest?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-slate-700 font-medium">{booking.room?.roomNumber || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-slate-600 capitalize">{booking.room?.type || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {new Date(booking.checkInDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${getStatusColor(booking.bookingStatus)}`}>
                                                    {booking.bookingStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <i className="fa-solid fa-umbrella-beach text-4xl text-slate-300 mb-3"></i>
                                            <p className="text-slate-500">No bookings yet - time to welcome some guests!</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
