import './pre-init.js';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import patchMongoose from './mockDb.js';
import { USE_MOCK } from './pre-init.js';

// Server instance setup begins...

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import clientRoutes from './routes/client.js';
import employeeRoutes from './routes/employee.js';
import managerRoutes from './routes/manager.js';
import batteryRoutes from './routes/battery.js';
import publicRoutes from './routes/public.js';
import financeRoutes from './routes/finance.js';
import chatRoutes from './routes/chat.js';
import evDashboardRoutes from './routes/evDashboard.js';
import Message from './models/Message.js';
import { mockUsers } from './mockData.js';
import { startLivePulse } from './services/livePulse.js';
import { startAlertWatcher } from './services/alertWatcher.js';
import { startReportScheduler } from './services/reportScheduler.js';
import { apiLimiter } from './middleware/loginLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.CLIENT_URL
].filter(Boolean);

const checkCorsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com') || process.env.NODE_ENV !== 'production') {
    return callback(null, true);
  }
  return callback(null, true);
};

// Socket.io
const io = new Server(server, {
  cors: {
    origin: checkCorsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'same-origin' },
}));
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});
app.use(cors({
  origin: checkCorsOrigin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/batteries', batteryRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ev', evDashboardRoutes);

// Health check (moved above catch-all)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Stone India API running', timestamp: new Date() });
});

// Manager route health check
app.get('/api/health/manager', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Manager routes are registered on the server.',
    routes: ['/api/manager/dashboard', '/api/manager/employees', '/api/manager/tasks', '/api/manager/leaves']
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log(`[404] API Route Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found on this server.` });
});

// Centralized error handler
app.use(errorHandler);

// Socket.io for live chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      if (!USE_MOCK) {
        const newMessage = await Message.create({
          roomId: data.roomId,
          sender: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          content: data.text,
          type: 'text'
        });
        // Mutate data to include timestamp and ID from DB
        data._id = newMessage._id;
        data.time = newMessage.createdAt;
      }

      io.to(data.roomId).emit('receive_message', data);
    } catch (error) {
      console.error('Socket message save error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Start Real-Time Factory Pulse (no DB dependency — safe to start immediately)
startLivePulse(io);

// Helper: start DB-dependent services and listen
const startServicesAndListen = (modeLabel = '') => {
  startAlertWatcher(io);
  startReportScheduler().catch(err => console.error('[ReportScheduler] Startup error:', err.message));
  server.listen(process.env.PORT || 5000, () => {
    console.log(`🚀 Stone India Server ${modeLabel} running on port ${process.env.PORT || 5000}`);
  });
};

// MongoDB connection or Mock Fallback
if (USE_MOCK) {
  console.log('🧪 DEMO MODE: Using Robust In-Memory Mock Database');
  startServicesAndListen('(MOCK)');
} else {
  mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log('✅ MongoDB connected');
      startServicesAndListen();
    })
    .catch((err) => {
      console.error('❌ CRITICAL: MongoDB connection failed:', err.message);
      console.log('⚠️  Falling back to Demo Mode (In-Memory Mock Database) to prevent 500 errors.');
      patchMongoose();
      startServicesAndListen('(DEMO/MOCK MODE)');
    });
}

export { io };
