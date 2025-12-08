/**
 * Virtual Focus Room - Backend Server
 * 
 * A real-time collaboration server for video rooms using Socket.io and WebRTC signaling
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const roomManager = require('./utils/roomManager');
const { setupSocketHandlers } = require('./handlers/socketHandlers');
const authRoutes = require('./routes/authRoutes');
const tierRoutes = require('./routes/tierRoutes');
const todoRoutes = require('./routes/todoRoutes');
const statsRoutes = require('./routes/statsRoutes');
const messageRoutes = require('./routes/messageRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// CORS Configuration logic
const getCorsConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

    return {
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, etc)
            if (!origin) return callback(null, true);

            if (isProduction) {
                if (allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            } else {
                // Development: Allow localhost, 127.0.0.1, and local network IPs
                if (
                    origin.includes('localhost') ||
                    origin.includes('127.0.0.1') ||
                    /^http:\/\/192\.168\.\d+\.\d+/.test(origin) ||
                    /^http:\/\/10\.\d+\.\d+\.\d+/.test(origin)
                ) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true
    };
};

const corsOptions = getCorsConfig();

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); // Parse JSON bodies

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/focusroom';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('⚠️ Running without database persistence for now.');
    });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tiers', tierRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', require('./routes/friendRoutes'));

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize Socket.io with increased buffer size for file transfers
const io = new Server(server, {
    cors: corsOptions,
    maxHttpBufferSize: 10 * 1024 * 1024, // 10MB for image sharing
    pingTimeout: 60000,
    pingInterval: 25000
});

// Socket connection handler
io.on("connection", (socket) => {
    setupSocketHandlers(io, socket);
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║     Virtual Focus Room Server Started      ║
╠════════════════════════════════════════════╣
║  Port: ${PORT}                                ║
║  Health: http://localhost:${PORT}/health      ║
╚════════════════════════════════════════════╝
`);
});