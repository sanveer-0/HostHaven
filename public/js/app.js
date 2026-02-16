// State
const state = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')),
    currentView: 'dashboard'
};

// API Base URL
const API_URL = '/api';

// DOM Elements
const views = {
    auth: document.getElementById('auth-view'),
    dashboard: document.getElementById('dashboard-layout')
};
const contentArea = document.getElementById('content-area');
const modalContainer = document.getElementById('modal-container');
const pageTitle = document.getElementById('page-title');

// Initialize
function init() {
    if (state.token) {
        showView('dashboard');
        renderDashboard();
    } else {
        showView('auth');
    }

    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.dataset.view;
            navigateTo(view);
        });
    });

    // Close Modal
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) closeModal();
    });

    // Global Action Button (New Booking default)
    document.getElementById('add-new-btn').addEventListener('click', () => {
        if (state.currentView === 'payments') {
            openPaymentModal();
        } else {
            // Default to booking or show generic
            alert('Feature coming soon: New Booking Modal');
        }
    });
}

// Navigation
function navigateTo(view) {
    state.currentView = view;

    // Update Sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    // Render Content
    switch (view) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'bookings':
            renderBookings();
            break;
        case 'rooms':
            renderRooms();
            break;
        case 'guests':
            renderGuests();
            break;
        case 'payments':
            renderPayments();
            break;
    }
}

function showView(viewName) {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
    views[viewName].classList.add('active');

    if (viewName === 'dashboard' && state.user) {
        document.getElementById('user-name').textContent = state.user.username;
        document.getElementById('user-role').textContent = state.user.role;
    }
}

// API Helper
async function fetchAPI(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401) {
            handleLogout();
        }
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}

// Auth Handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const data = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        state.token = data.token;
        state.user = {
            id: data._id,
            username: data.username,
            email: data.email,
            role: data.role
        };

        localStorage.setItem('token', state.token);
        localStorage.setItem('user', JSON.stringify(state.user));

        showView('dashboard');
        renderDashboard();
    } catch (error) {
        alert(error.message);
    }
}

function handleLogout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showView('auth');
}

// Web Views
async function renderDashboard() {
    pageTitle.textContent = 'Dashboard Overview';
    contentArea.innerHTML = '<div class="loader">Loading...</div>';

    try {
        const stats = await fetchAPI('/dashboard/stats');

        contentArea.innerHTML = `
            <div class="grid-4">
                <div class="stats-card">
                    <div class="stats-info">
                        <h3>Total Bookings</h3>
                        <div class="value">${stats.totalBookings}</div>
                    </div>
                    <div class="stats-icon icon-blue"><i class="fa-solid fa-calendar-check"></i></div>
                </div>
                <div class="stats-card">
                    <div class="stats-info">
                        <h3>Occupied Rooms</h3>
                        <div class="value">${stats.occupiedRooms}</div>
                    </div>
                    <div class="stats-icon icon-purple"><i class="fa-solid fa-bed"></i></div>
                </div>
                <div class="stats-card">
                    <div class="stats-info">
                        <h3>Active Guests</h3>
                        <div class="value">${stats.activeGuests}</div>
                    </div>
                    <div class="stats-icon icon-green"><i class="fa-solid fa-users"></i></div>
                </div>
                <div class="stats-card">
                    <div class="stats-info">
                        <h3>Total Revenue</h3>
                        <div class="value">$${stats.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div class="stats-icon icon-orange"><i class="fa-solid fa-dollar-sign"></i></div>
                </div>
            </div>

            <div class="section-header">
                <h3>Recent Bookings</h3>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Guest</th>
                            <th>Room</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.recentBookings.map(booking => `
                            <tr>
                                <td>${booking.guest ? booking.guest.name : 'Unknown'}</td>
                                <td>${booking.room ? booking.room.roomNumber : 'N/A'}</td>
                                <td>${booking.room ? booking.room.type : 'N/A'}</td>
                                <td>${new Date(booking.checkInDate).toLocaleDateString()}</td>
                                <td><span class="status-badge status-${getStatusColor(booking.bookingStatus)}">${booking.bookingStatus}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        contentArea.innerHTML = `<p class="text-danger">Error loading dashboard: ${error.message}</p>`;
    }
}

async function renderPayments() {
    pageTitle.textContent = 'Payment Records';
    document.getElementById('add-new-btn').innerHTML = '<i class="fa-solid fa-plus"></i> Record Payment';

    contentArea.innerHTML = '<div class="loader">Loading...</div>';

    try {
        const payments = await fetchAPI('/payments');

        contentArea.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Booking Ref</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.map(payment => `
                            <tr>
                                <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
                                <td>${payment.booking ? payment.booking._id.substring(0, 8) + '...' : 'N/A'}</td>
                                <td>$${payment.amount}</td>
                                <td>${payment.paymentMethod}</td>
                                <td><span class="status-badge status-success">${payment.status}</span></td>
                                <td>
                                    <button class="btn-icon" onclick="deletePayment('${payment._id}')"><i class="fa-solid fa-trash text-danger"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        contentArea.innerHTML = `<p class="text-danger">Error loading payments: ${error.message}</p>`;
    }
}

async function renderBookings() {
    pageTitle.textContent = 'All Bookings';
    contentArea.innerHTML = '<div class="loader">Loading...</div>';

    try {
        const bookings = await fetchAPI('/bookings');

        contentArea.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Guest</th>
                            <th>Room</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bookings.map(booking => `
                            <tr>
                                <td>${booking.guest ? booking.guest.name : 'Unknown'}</td>
                                <td>${booking.room ? booking.room.roomNumber : 'N/A'}</td>
                                <td>${new Date(booking.checkInDate).toLocaleDateString()}</td>
                                <td>${new Date(booking.checkOutDate).toLocaleDateString()}</td>
                                <td><span class="status-badge status-${getStatusColor(booking.bookingStatus)}">${booking.bookingStatus}</span></td>
                                <td>
                                    <button class="btn-icon"><i class="fa-solid fa-eye"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        contentArea.innerHTML = `<p class="text-danger">Error loading bookings: ${error.message}</p>`;
    }
}

async function renderRooms() {
    pageTitle.textContent = 'Rooms Management';
    contentArea.innerHTML = '<div class="loader">Loading...</div>';

    try {
        const rooms = await fetchAPI('/rooms');

        contentArea.innerHTML = `
            <div class="grid-4">
                ${rooms.map(room => `
                    <div class="stats-card" style="display:block">
                        <div style="display:flex; justify-content:space-between; margin-bottom:1rem">
                            <h3 style="font-size:1.2rem; font-weight:bold">${room.roomNumber}</h3>
                            <span class="status-badge status-${getRoomStatusColor(room.status)}">${room.status}</span>
                        </div>
                        <p class="text-muted">${room.type} - $${room.pricePerNight}/night</p>
                        <div style="margin-top:1rem; display:flex; gap:0.5rem">
                            <button class="btn btn-secondary" style="padding:0.5rem; font-size:0.8rem">Edit</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        contentArea.innerHTML = `<p class="text-danger">Error loading rooms: ${error.message}</p>`;
    }
}

async function renderGuests() {
    pageTitle.textContent = 'Guest Directory';
    contentArea.innerHTML = '<div class="loader">Loading...</div>';

    try {
        // Assume /api/guests is the endpoint (based on server.js)
        const guests = await fetchAPI('/guests');

        contentArea.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${guests.map(guest => `
                            <tr>
                                <td>${guest.name}</td>
                                <td>${guest.email}</td>
                                <td>${guest.phone}</td>
                                <td><span class="status-badge status-${guest.status === 'active' ? 'success' : 'secondary'}">${guest.status}</span></td>
                                <td>
                                    <button class="btn-icon"><i class="fa-solid fa-pen"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        contentArea.innerHTML = `<p class="text-danger">Error loading guests: ${error.message}</p>`;
    }
}

// Modals
async function openPaymentModal() {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = 'Record New Payment';
    modalBody.innerHTML = '<div class="loader">Loading bookings...</div>';

    modalContainer.classList.remove('hidden');

    try {
        // Fetch active bookings for dropdown
        const bookings = await fetchAPI('/bookings');

        modalBody.innerHTML = `
            <form id="payment-form">
                <div class="form-group">
                    <label>Select Booking</label>
                    <select id="payment-booking" required>
                        <option value="">-- Select Booking Ref --</option>
                        ${bookings.map(b => `<option value="${b._id}">Room ${b.room ? b.room.roomNumber : 'N/A'} - ${b.guest ? b.guest.name : 'Unknown'} (${b._id.substring(0, 8)})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Amount ($)</label>
                    <input type="number" id="payment-amount" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Payment Method</label>
                    <select id="payment-method" required>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="payment-notes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Record Payment</button>
            </form>
        `;

        document.getElementById('payment-form').addEventListener('submit', handleCreatePayment);
    } catch (error) {
        modalBody.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    }
}

async function handleCreatePayment(e) {
    e.preventDefault();
    const data = {
        booking: document.getElementById('payment-booking').value,
        amount: Number(document.getElementById('payment-amount').value),
        paymentMethod: document.getElementById('payment-method').value,
        notes: document.getElementById('payment-notes').value
    };

    try {
        await fetchAPI('/payments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        closeModal();
        renderPayments(); // Refresh list
    } catch (error) {
        alert(error.message);
    }
}

function closeModal() {
    modalContainer.classList.add('hidden');
}

// Utilities
function getStatusColor(status) {
    switch (status) {
        case 'confirmed': return 'success';
        case 'pending': return 'warning';
        case 'cancelled': return 'danger';
        case 'checked-in': return 'success';
        case 'checked-out': return 'secondary';
        default: return 'secondary';
    }
}

function getRoomStatusColor(status) {
    switch (status) {
        case 'available': return 'success';
        case 'occupied': return 'danger';
        case 'maintenance': return 'warning';
        default: return 'secondary';
    }
}

// Start App
init();
