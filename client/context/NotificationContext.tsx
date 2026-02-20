'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { socket } from '@/lib/socket';
import { API_URL } from '@/lib/api';

interface NotificationContextType {
    pendingRequestCount: number;
    incrementCount: () => void;
    decrementCount: () => void;
    resetCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [pendingRequestCount, setPendingRequestCount] = useState(0);

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.error('Error playing sound:', e));
        } catch (error) {
            console.error('Audio playback failed', error);
        }
    };

    useEffect(() => {
        // Initial fetch of pending requests
        const fetchPendingCount = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch(`${API_URL}/service-requests?status=pending`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        setPendingRequestCount(data.length);
                    }
                }
            } catch (error) {
                console.error('Error fetching pending requests:', error);
            }
        };

        fetchPendingCount();

        // Socket listeners
        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('new_service_request', (data: any) => {
            console.log('New request received:', data);
            setPendingRequestCount(prev => prev + 1);
            playNotificationSound();
        });

        return () => {
            socket.off('connect');
            socket.off('new_service_request');
        };
    }, []);

    const incrementCount = () => setPendingRequestCount(prev => prev + 1);
    const decrementCount = () => setPendingRequestCount(prev => Math.max(0, prev - 1));
    const resetCount = () => setPendingRequestCount(0);

    return (
        <NotificationContext.Provider value={{ pendingRequestCount, incrementCount, decrementCount, resetCount }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
