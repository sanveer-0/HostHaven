# HostHaven - Next.js + SQLite

Modern guesthouse management system with Next.js frontend and Express + SQLite backend.

## 🚀 Quick Start

**Both servers are currently running!**

- **Backend**: http://localhost:5000 ✅
- **Frontend**: http://localhost:3000 ✅

### Login Credentials

- **Email**: `admin@test.com`
- **Password**: `password123`

Visit http://localhost:3000 to login!

---

## Tech Stack

**Backend:**
- Express.js
- SQLite + Sequelize ORM
- JWT Authentication
- bcryptjs

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Font Awesome

---

## Setup Instructions (For Future Reference)

### 1. Backend Setup

```bash
cd d:\hostHaven
npm install

# Start backend server
npm run dev
```

Backend runs on http://localhost:5000

> **Note**: SQLite requires no installation! The database file `database.sqlite` is automatically created.

### 2. Frontend Setup

```bash
cd d:\hostHaven\client
npm install

# Start frontend
npm run dev
```

Frontend runs on http://localhost:3000

### 3. Create Admin User

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username":"admin","email":"admin@test.com","password":"password123","role":"admin"}'
```

---

## Features

- ✅ User authentication with JWT
- ✅ Dashboard with analytics
- ✅ Guest management
- ✅ Room management
- ✅ Booking system
- ✅ Payment tracking
- ✅ Modern glassmorphism UI
- ✅ SQLite database (no installation required)

---

## Project Structure

```
hostHaven/
├── config/          # Database configuration
├── controllers/     # Business logic
├── middleware/      # Auth middleware
├── models/          # Sequelize models
├── routes/          # API routes
├── server.js        # Express server
├── database.sqlite  # SQLite database file
└── client/          # Next.js frontend
    ├── app/         # Pages and layouts
    ├── lib/         # API client and utilities
    └── public/      # Static assets
```

---

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/guests` - Get all guests
- `GET /api/rooms` - Get all rooms
- `GET /api/bookings` - Get all bookings
- `GET /api/payments` - Get all payments

---

## Development

**Backend:** `npm run dev` (port 5000)  
**Frontend:** `cd client && npm run dev` (port 3000)

---

## Migration Notes

This project was migrated from:
- **MongoDB → SQLite** (Sequelize ORM)
- **Vanilla JavaScript → Next.js + TypeScript**

SQLite was chosen for easier development setup (no database server installation required).

See [walkthrough.md](file:///C:/Users/iamsa/.gemini/antigravity/brain/5f046668-4cde-4544-abfc-aaf6cdc09b05/walkthrough.md) for complete migration details.

## Deployment Status
Deployed on Vercel & Render
