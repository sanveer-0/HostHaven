'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

interface SidebarProps {
    user: User;
    handleLogout: () => void;
}

export default function Sidebar({ user, handleLogout }: SidebarProps) {
    const pathname = usePathname();
    const { pendingRequestCount } = useNotification();
    const [dark, setDark] = useState(false);

    // Load saved preference on mount
    useEffect(() => {
        const saved = localStorage.getItem('hosthaven-theme');
        const prefersDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDark(prefersDark);
        document.documentElement.classList.toggle('dark', prefersDark);
    }, []);

    const toggleTheme = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('hosthaven-theme', next ? 'dark' : 'light');
    };

    const navItems = [
        { href: '/dashboard', icon: 'fa-chart-line', label: 'Overview', gradient: 'from-sky-400 to-blue-500' },
        { href: '/dashboard/bookings', icon: 'fa-calendar-check', label: 'Bookings', gradient: 'from-blue-400 to-teal-400' },
        { href: '/dashboard/rooms', icon: 'fa-door-open', label: 'Rooms', gradient: 'from-teal-400 to-cyan-400' },
        { href: '/dashboard/requests', icon: 'fa-bell-concierge', label: 'Requests', gradient: 'from-violet-400 to-purple-500' },
        { href: '/dashboard/payments', icon: 'fa-credit-card', label: 'Payments', gradient: 'from-emerald-400 to-teal-400' },
        { href: '/dashboard/reports', icon: 'fa-file-export', label: 'Reports', gradient: 'from-orange-400 to-red-400' },
    ];

    return (
        <aside
            className="w-72 flex flex-col p-6 relative z-10"
            style={{
                background: 'var(--nm-bg)',
                boxShadow: '8px 0 20px var(--nm-sd)',
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center"
                    style={{ boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)' }}>
                    <i className="fa-solid fa-hotel text-xl text-white"></i>
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                        HostHaven
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--nm-text-3)' }}>Guest Management</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200`}
                            style={isActive ? {
                                boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)',
                                background: 'var(--nm-bg)',
                            } : {}}
                        >
                            <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isActive
                                    ? `bg-gradient-to-br ${item.gradient}`
                                    : ''
                                    }`}
                                style={!isActive ? {
                                    background: 'var(--nm-bg)',
                                    boxShadow: '3px 3px 7px var(--nm-sd), -3px -3px 7px var(--nm-sl)',
                                } : {}}
                            >
                                <i className={`fa-solid ${item.icon} text-sm ${isActive ? 'text-white' : ''}`}
                                    style={!isActive ? { color: 'var(--nm-text-2)' } : {}}></i>
                            </div>
                            <span
                                className="font-medium flex-1 text-sm"
                                style={{ color: isActive ? 'var(--nm-text)' : 'var(--nm-text-2)' }}
                            >
                                {item.label}
                            </span>

                            {/* Notification Badge */}
                            {item.label === 'Requests' && pendingRequestCount > 0 && (
                                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-rose-400 rounded-full shadow-md animate-pulse">
                                    {pendingRequestCount > 99 ? '99+' : pendingRequestCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Dark / Light Mode Toggle */}
            <div className="py-4" style={{ borderTop: '1px solid rgba(197,205,216,0.5)', borderBottom: '1px solid rgba(197,205,216,0.5)' }}>
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{ background: 'var(--nm-bg)', boxShadow: '4px 4px 10px var(--nm-sd), -4px -4px 10px var(--nm-sl)' }}
                    title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {/* Track */}
                    <div
                        className="relative w-11 h-6 rounded-full flex-shrink-0 transition-all"
                        style={{
                            boxShadow: 'inset 3px 3px 6px var(--nm-sd), inset -3px -3px 6px var(--nm-sl)',
                            background: 'var(--nm-bg)',
                        }}
                    >
                        {/* Thumb */}
                        <div
                            className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center text-white ${dark ? 'translate-x-5 bg-gradient-to-br from-indigo-500 to-purple-600' : 'translate-x-0.5 bg-gradient-to-br from-amber-400 to-orange-400'}`}
                            style={{ boxShadow: '2px 2px 5px rgba(0,0,0,0.2)' }}
                        >
                            <i className={`fa-solid ${dark ? 'fa-moon' : 'fa-sun'} text-[9px]`}></i>
                        </div>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--nm-text-2)' }}>
                        {dark ? 'Dark Mode' : 'Light Mode'}
                    </span>
                </button>
            </div>

            {/* User Profile */}
            <div className="pt-4">
                <div
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ boxShadow: 'inset 3px 3px 7px var(--nm-sd), inset -3px -3px 7px var(--nm-sl)', background: 'var(--nm-bg)' }}
                >
                    <div className="w-11 h-11 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-white shadow-md flex-shrink-0">
                        {user.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--nm-text)' }}>{user.username}</p>
                        <p className="text-xs capitalize" style={{ color: 'var(--nm-text-3)' }}>{user.role}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                        style={{
                            background: 'var(--nm-bg)',
                            boxShadow: '3px 3px 7px var(--nm-sd), -3px -3px 7px var(--nm-sl)',
                            color: '#f87171',
                        }}
                        title="Logout"
                        onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--nm-bg)')}
                    >
                        <i className="fa-solid fa-arrow-right-from-bracket text-sm"></i>
                    </button>
                </div>
            </div>
        </aside>
    );
}
