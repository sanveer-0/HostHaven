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
                return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'pending':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'cancelled':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'checked-out':
                return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
            default:
                return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-cyan-400 mb-4"></i>
                    <p className="text-slate-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <i className="fa-solid fa-circle-exclamation text-4xl text-red-500 mb-4"></i>
                    <p className="text-red-400">Error: {error}</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Bookings',
            value: stats?.totalBookings || 0,
            icon: 'fa-calendar-check',
            gradient: 'from-cyan-400 to-blue-500',
            bgIcon: 'from-cyan-500/20 to-blue-500/20',
        },
        {
            title: 'Occupied Rooms',
            value: stats?.occupiedRooms || 0,
            icon: 'fa-bed',
            gradient: 'from-blue-400 to-teal-400',
            bgIcon: 'from-blue-500/20 to-teal-500/20',
        },
        {
            title: 'Active Guests',
            value: stats?.activeGuests || 0,
            icon: 'fa-users',
            gradient: 'from-teal-400 to-emerald-400',
            bgIcon: 'from-teal-500/20 to-emerald-500/20',
        },
        {
            title: 'Total Revenue',
            value: `₹${stats?.totalRevenue?.toLocaleString('en-IN') || 0}`,
            icon: 'fa-indian-rupee-sign',
            gradient: 'from-amber-400 to-orange-500',
            bgIcon: 'from-amber-500/20 to-orange-500/20',
        },
    ];

    const chartData = Object.entries(revenueData).map(([month, revenue]) => ({
        month,
        revenue
    }));

    return (
        <>
            {/* Header */}
            <header className="px-8 py-6 border-b border-white/5 bg-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100 mb-1 drop-shadow-lg">Dashboard Overview</h2>
                        <p className="text-slate-300">Welcome back! Here's your property status</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 glass-dark rounded-xl border border-white/10 flex items-center gap-2">
                            <i className="fa-regular fa-calendar text-cyan-400"></i>
                            <span className="text-sm text-slate-200">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
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
                            className="glass-card-dark p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 animate-slide-up relative overflow-hidden group"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full -mr-6 -mt-6 transition-all group-hover:from-white/10"></div>

                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div>
                                    <p className="text-sm font-medium text-slate-400 mb-1">{card.title}</p>
                                    <h3 className="text-3xl font-bold text-slate-100">{card.value}</h3>
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.bgIcon} flex items-center justify-center shadow-lg border border-white/5`}>
                                    <i className={`fa-solid ${card.icon} text-xl bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}></i>
                                </div>
                            </div>
                            <div className={`h-1 w-full rounded-full bg-slate-700 overflow-hidden`}>
                                <div className={`h-full bg-gradient-to-r ${card.gradient} w-full animate-pulse opacity-80`}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Statistics Graph */}
                {Object.keys(revenueData).length > 0 && (
                    <div className="glass-card-dark rounded-2xl overflow-hidden shadow-lg mb-8 animate-fade-in border border-white/5">
                        <div className="px-6 py-5 border-b border-white/5 bg-white/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100 mb-1">Revenue Trend</h3>
                                    <p className="text-sm text-slate-400">Monthly revenue from completed payments</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart
                                        data={chartData}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            stroke="#94a3b8"
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#94a3b8"
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `₹${value / 1000}k`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                                color: '#f1f5f9'
                                            }}
                                            itemStyle={{ color: '#2dd4bf' }}
                                            formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                                        />
                                        <Legend
                                            wrapperStyle={{ paddingTop: '20px' }}
                                            formatter={() => <span className="text-slate-300">Revenue (₹)</span>}
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={60}
                                        >
                                            {/* We can use Cell here if we want different colors, or just a fill */}
                                            {chartData.map((entry, index) => (
                                                <defs key={`defs-${index}`}>
                                                    <linearGradient id={`colorRevenue-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0.4} />
                                                    </linearGradient>
                                                </defs>
                                            ))}
                                            {/* Applying the gradient properly requires referencing the defs in fill, usually at chart level or here. 
                                                Simplified: just use a solid fill or a single gradient. */}
                                        </Bar>
                                        {/* Re-chart can accept fill as 'url(#id)' on the Bar component directly if defs is defined in BarChart */}
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.5} />
                                            </linearGradient>
                                        </defs>
                                        <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Bookings */}
                <div className="glass-card-dark rounded-2xl overflow-hidden shadow-lg animate-fade-in border border-white/5">
                    <div className="px-6 py-5 border-b border-white/5 bg-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-100 mb-1">Recent Bookings</h3>
                                <p className="text-sm text-slate-400">Latest reservation activity</p>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard/bookings')}
                                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                            >
                                View All
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-800/50 border-b border-white/5">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Guest
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Room
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Check-in Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats?.recentBookings && stats.recentBookings.length > 0 ? (
                                    stats.recentBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-cyan-900/30">
                                                        {booking.guest?.name?.[0] || 'U'}
                                                    </div>
                                                    <span className="text-slate-200 font-medium group-hover:text-cyan-300 transition-colors">{booking.guest?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-slate-300 font-medium">{booking.room?.roomNumber || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-slate-400 capitalize">{booking.room?.type || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-400">
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
                                            <i className="fa-solid fa-umbrella-beach text-4xl text-slate-600 mb-3 animate-pulse"></i>
                                            <p className="text-slate-400">No bookings yet - time to welcome some guests!</p>
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
