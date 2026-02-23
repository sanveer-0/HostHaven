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
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'pending':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'cancelled':
                return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'checked-out':
                return 'bg-slate-100 text-slate-600 border-slate-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-teal-400 mb-4"></i>
                    <p style={{ color: 'var(--nm-text-2)' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <i className="fa-solid fa-circle-exclamation text-4xl text-rose-400 mb-4"></i>
                    <p className="text-rose-500">Error: {error}</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Bookings',
            value: stats?.totalBookings || 0,
            icon: 'fa-calendar-check',
            gradient: 'from-sky-400 to-blue-500',
        },
        {
            title: 'Occupied Rooms',
            value: stats?.occupiedRooms || 0,
            icon: 'fa-bed',
            gradient: 'from-blue-400 to-teal-400',
        },
        {
            title: 'Active Guests',
            value: stats?.activeGuests || 0,
            icon: 'fa-users',
            gradient: 'from-teal-400 to-emerald-400',
        },
        {
            title: 'Total Revenue',
            value: `₹${stats?.totalRevenue?.toLocaleString('en-IN') || 0}`,
            icon: 'fa-indian-rupee-sign',
            gradient: 'from-amber-400 to-orange-400',
        },
    ];

    const chartData = Object.entries(revenueData).map(([month, revenue]) => ({
        month,
        revenue
    }));

    return (
        <>
            {/* Header */}
            <header className="px-8 py-6 bg-transparent" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-1" style={{ color: 'var(--nm-text)' }}>Dashboard Overview</h2>
                        <p style={{ color: 'var(--nm-text-2)' }}>Welcome back! Here's your property status</p>
                    </div>
                    <div
                        className="px-4 py-2 rounded-xl flex items-center gap-2 text-sm"
                        style={{
                            background: 'var(--nm-bg)',
                            boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)',
                            color: 'var(--nm-text-2)',
                        }}
                    >
                        <i className="fa-regular fa-calendar text-teal-500"></i>
                        <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((card, index) => (
                        <div
                            key={card.title}
                            className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                            style={{
                                background: 'var(--nm-bg)',
                                boxShadow: '8px 8px 18px var(--nm-sd), -8px -8px 18px var(--nm-sl)',
                                animationDelay: `${index * 100}ms`,
                            }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--nm-text-3)' }}>{card.title}</p>
                                    <h3 className="text-3xl font-bold" style={{ color: 'var(--nm-text)' }}>{card.value}</h3>
                                </div>
                                <div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}
                                    style={{ boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)' }}
                                >
                                    <i className={`fa-solid ${card.icon} text-xl text-white`}></i>
                                </div>
                            </div>
                            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--nm-border)' }}>
                                <div className={`h-full bg-gradient-to-r ${card.gradient} w-full`}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Revenue Chart */}
                {Object.keys(revenueData).length > 0 && (
                    <div
                        className="rounded-2xl overflow-hidden mb-8"
                        style={{
                            background: 'var(--nm-bg)',
                            boxShadow: '8px 8px 18px var(--nm-sd), -8px -8px 18px var(--nm-sl)',
                        }}
                    >
                        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                            <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--nm-text)' }}>Revenue Trend</h3>
                            <p className="text-sm" style={{ color: 'var(--nm-text-2)' }}>Monthly revenue from completed payments</p>
                        </div>
                        <div className="p-6">
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--nm-border)" vertical={false} />
                                        <XAxis dataKey="month" stroke="#9ab0be" tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#9ab0be" tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                        <Tooltip
                                            cursor={{ fill: 'var(--nm-border)' }}
                                            contentStyle={{
                                                backgroundColor: 'var(--nm-bg)',
                                                border: '1px solid var(--nm-border)',
                                                borderRadius: '12px',
                                                boxShadow: '6px 6px 14px var(--nm-sd), -6px -6px 14px var(--nm-sl)',
                                                color: '#3d5263',
                                            }}
                                            itemStyle={{ color: '#2dd4bf' }}
                                            formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} formatter={() => <span style={{ color: 'var(--nm-text-2)' }}>Revenue (₹)</span>} />
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
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: 'var(--nm-bg)',
                        boxShadow: '8px 8px 18px var(--nm-sd), -8px -8px 18px var(--nm-sl)',
                    }}
                >
                    <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                        <div>
                            <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--nm-text)' }}>Recent Bookings</h3>
                            <p className="text-sm" style={{ color: 'var(--nm-text-2)' }}>Latest reservation activity</p>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/bookings')}
                            className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white text-sm font-medium rounded-xl transition-all"
                            style={{ boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)' }}
                        >
                            View All
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--nm-border)' }}>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Guest</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Room</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Check-in Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nm-text-3)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentBookings && stats.recentBookings.length > 0 ? (
                                    stats.recentBookings.map((booking) => (
                                        <tr
                                            key={booking.id}
                                            className="transition-colors group"
                                            style={{ borderBottom: '1px solid var(--nm-border)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--nm-surface)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-md">
                                                        {booking.guest?.name?.[0] || 'U'}
                                                    </div>
                                                    <span className="font-medium" style={{ color: 'var(--nm-text)' }}>{booking.guest?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium" style={{ color: 'var(--nm-text)' }}>{booking.room?.roomNumber || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap capitalize" style={{ color: 'var(--nm-text-2)' }}>{booking.room?.type || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--nm-text-2)' }}>{new Date(booking.checkInDate).toLocaleDateString()}</td>
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
                                            <i className="fa-solid fa-umbrella-beach text-4xl text-teal-300 mb-3 block"></i>
                                            <p style={{ color: 'var(--nm-text-3)' }}>No bookings yet — time to welcome some guests!</p>
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
