'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getUser, clearAuth } from '@/lib/auth';
import { User } from '@/lib/api';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            router.push('/');
        } else {
            setUser(currentUser);
        }
    }, [router]);

    const handleLogout = () => {
        clearAuth();
        router.push('/');
    };

    const navItems = [
        { href: '/dashboard', icon: 'fa-chart-line', label: 'Overview', gradient: 'from-cyan-500 to-blue-500' },
        { href: '/dashboard/bookings', icon: 'fa-calendar-check', label: 'Bookings', gradient: 'from-blue-500 to-teal-500' },
        { href: '/dashboard/rooms', icon: 'fa-door-open', label: 'Rooms', gradient: 'from-teal-500 to-cyan-500' },
        { href: '/dashboard/requests', icon: 'fa-bell-concierge', label: 'Requests', gradient: 'from-purple-500 to-pink-500' },
        { href: '/dashboard/payments', icon: 'fa-credit-card', label: 'Payments', gradient: 'from-emerald-500 to-teal-500' },
        { href: '/dashboard/reports', icon: 'fa-file-export', label: 'Reports', gradient: 'from-orange-500 to-red-500' },
    ];

    if (!user) return null;

    return (
        <div className="flex h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 overflow-hidden relative">
            {/* Sidebar */}
            <aside className="w-72 bg-white/70 backdrop-blur-xl border-r border-white/60 flex flex-col p-6 animate-fade-in relative z-10">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <i className="fa-solid fa-hotel text-xl text-white"></i>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            HostHaven
                        </h1>
                        <p className="text-xs text-slate-500">Guest Management</p>
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
                                    ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isActive
                                    ? 'bg-white/20'
                                    : 'bg-white/40 group-hover:bg-white/60'
                                    }`}>
                                    <i className={`fa-solid ${item.icon} ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-800'}`}></i>
                                </div>
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 hover:bg-white/80 transition-all group">
                        <div className="w-11 h-11 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
                            {user.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{user.username}</p>
                            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-9 h-9 rounded-lg bg-red-100 hover:bg-red-500 text-red-500 hover:text-white transition-all flex items-center justify-center"
                            title="Logout"
                        >
                            <i className="fa-solid fa-arrow-right-from-bracket text-sm"></i>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                {children}
            </main>
        </div>
    );
}
