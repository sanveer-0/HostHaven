'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

interface SidebarProps {
    user: User;
    handleLogout: () => void;
}

export default function Sidebar({ user, handleLogout }: SidebarProps) {
    const pathname = usePathname();
    const { pendingRequestCount } = useNotification();

    const navItems = [
        { href: '/dashboard', icon: 'fa-chart-line', label: 'Overview', gradient: 'from-cyan-400 to-blue-500' },
        { href: '/dashboard/bookings', icon: 'fa-calendar-check', label: 'Bookings', gradient: 'from-blue-400 to-teal-400' },
        { href: '/dashboard/rooms', icon: 'fa-door-open', label: 'Rooms', gradient: 'from-teal-400 to-cyan-400' },
        { href: '/dashboard/requests', icon: 'fa-bell-concierge', label: 'Requests', gradient: 'from-purple-400 to-pink-400' },
        { href: '/dashboard/payments', icon: 'fa-credit-card', label: 'Payments', gradient: 'from-emerald-400 to-teal-400' },
        { href: '/dashboard/reports', icon: 'fa-file-export', label: 'Reports', gradient: 'from-orange-400 to-red-400' },
    ];

    return (
        <aside className="w-72 glass-dark border-r border-white/5 flex flex-col p-6 animate-fade-in relative z-10 shadow-2xl">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <i className="fa-solid fa-hotel text-xl text-white"></i>
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        HostHaven
                    </h1>
                    <p className="text-xs text-slate-400">Guest Management</p>
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
                            className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg shadow-cyan-500/10'
                                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                                }`}
                        >
                            <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isActive
                                ? 'bg-white/20'
                                : 'bg-white/5 group-hover:bg-white/10'
                                }`}>
                                <i className={`fa-solid ${item.icon} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}></i>
                            </div>
                            <span className="font-medium flex-1">{item.label}</span>

                            {/* Notification Badge */}
                            {item.label === 'Requests' && pendingRequestCount > 0 && (
                                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg shadow-red-500/30 animate-pulse">
                                    {pendingRequestCount > 99 ? '99+' : pendingRequestCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all group border border-white/5">
                    <div className="w-11 h-11 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
                        {user.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{user.username}</p>
                        <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/10"
                        title="Logout"
                    >
                        <i className="fa-solid fa-arrow-right-from-bracket text-sm"></i>
                    </button>
                </div>
            </div>
        </aside>
    );
}
