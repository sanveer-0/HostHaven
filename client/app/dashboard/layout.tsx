'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '@/lib/auth';
import { User } from '@/lib/api';
import { NotificationProvider } from '@/context/NotificationContext';
import Sidebar from '@/components/Sidebar';


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
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

    if (!user) return null;

    return (
        <NotificationProvider>
            <div className="flex h-screen overflow-hidden relative text-[#3d5263]" style={{ background: 'var(--nm-bg)' }}>

                {/* Sidebar */}
                <Sidebar user={user} handleLogout={handleLogout} />

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                    {children}
                </main>
            </div>
        </NotificationProvider>
    );
}
