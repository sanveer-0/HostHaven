// API Response Types
export interface User {
    _id: string;
    username: string;
    email: string;
    role: 'admin' | 'staff';
}

export interface Guest {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    idProofType: 'passport' | 'driving_license' | 'national_id' | 'other';
    idProofNumber: string;
    checkInDate: string;
    checkOutDate?: string;
    status: 'active' | 'checked-out';
}

export interface Room {
    id: number;
    roomNumber: string;
    type: 'single' | 'double' | 'suite' | 'deluxe' | 'family';
    capacity: number;
    pricePerNight: number;
    amenities: string[];
    status: 'available' | 'occupied' | 'maintenance';
    images: string[];
    description: string;
}

export interface Booking {
    id: number;
    guestId: number;
    roomId: number;
    guest?: Guest;
    room?: Room;
    checkInDate: string;
    checkOutDate: string;
    checkInTime?: string;
    checkOutTime?: string;
    numberOfGuests: number;
    totalAmount: number;
    paymentStatus: 'pending' | 'partial' | 'paid';
    bookingStatus: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
    specialRequests: string;
}

export interface Payment {
    id: number;
    bookingId: number;
    booking?: Booking;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'pending' | 'other';
    transactionId: string;
    paymentDate: string;
    status: 'completed' | 'pending' | 'failed';
    notes: string;
}

export interface DashboardStats {
    totalGuests: number;
    totalRooms: number;
    totalBookings: number;
    activeGuests: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
    totalRevenue: number;
    recentBookings: Booking[];
}

// API Client
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'APIError';
    }
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        throw new APIError(response.status, data.message || 'Something went wrong');
    }

    return data;
}

// Auth API
export const authAPI = {
    login: (email: string, password: string) =>
        fetchAPI<User & { token: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    register: (username: string, email: string, password: string, role?: string) =>
        fetchAPI<User & { token: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, role }),
        }),

    getMe: () => fetchAPI<User>('/auth/me'),
};

// Guests API
export const guestsAPI = {
    getAll: () => fetchAPI<Guest[]>('/guests'),
    getOne: (id: number) => fetchAPI<Guest>(`/guests/${id}`),
    create: (data: Partial<Guest>) => fetchAPI<Guest>('/guests', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Guest>) => fetchAPI<Guest>(`/guests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchAPI<{ message: string }>(`/guests/${id}`, {
        method: 'DELETE',
    }),
};

// Rooms API
export const roomsAPI = {
    getAll: () => fetchAPI<Room[]>('/rooms'),
    getAvailable: () => fetchAPI<Room[]>('/rooms/available'),
    getOne: (id: number) => fetchAPI<Room>(`/rooms/${id}`),
    create: (data: Partial<Room>) => fetchAPI<Room>('/rooms', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Room>) => fetchAPI<Room>(`/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchAPI<{ message: string }>(`/rooms/${id}`, {
        method: 'DELETE',
    }),
};

// Bookings API
export const bookingsAPI = {
    getAll: () => fetchAPI<Booking[]>('/bookings'),
    getOne: (id: number) => fetchAPI<Booking>(`/bookings/${id}`),
    getByRoom: (roomId: number) => fetchAPI<Booking[]>(`/bookings/room/${roomId}`),
    create: (data: Partial<Booking>) => fetchAPI<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Booking>) => fetchAPI<Booking>(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchAPI<{ message: string }>(`/bookings/${id}`, {
        method: 'DELETE',
    }),
    checkout: (id: number) => fetchAPI<{ message: string; invoice: any }>(`/bookings/${id}/checkout`, {
        method: 'POST',
    }),
};

// Payments API
export const paymentsAPI = {
    getAll: () => fetchAPI<Payment[]>('/payments'),
    getOne: (id: number) => fetchAPI<Payment>(`/payments/${id}`),
    create: (data: Partial<Payment>) => fetchAPI<Payment>('/payments', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Payment>) => fetchAPI<Payment>(`/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchAPI<{ message: string }>(`/payments/${id}`, {
        method: 'DELETE',
    }),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => fetchAPI<DashboardStats>('/dashboard/stats'),
    getRevenue: () => fetchAPI<Record<string, number>>('/dashboard/revenue'),
    getOccupancy: () => fetchAPI<{
        totalRooms: number;
        occupiedRooms: number;
        occupancyRate: number;
    }>('/dashboard/occupancy'),
};
