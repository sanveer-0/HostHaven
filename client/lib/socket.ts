import { io } from "socket.io-client";

// Socket.IO must connect to the root server URL (not the /api path).
// NEXT_PUBLIC_SOCKET_URL should be set on Vercel to the bare Render URL,
// e.g. https://hosthaven-backend.onrender.com  (NO trailing /api)
const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
        : "http://localhost:5000");

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    transports: ['websocket', 'polling'],
});

