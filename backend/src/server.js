import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

import { initDb, db } from './db.js';
import { JWT_SECRET } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { createCallRouter } from './routes/calls.js';
import { createContactRouter } from './routes/contacts.js';
import { pushRouter } from './routes/push.js';
import { createSettingsRouter } from './routes/settings.js';
import { createSimulatorRouter } from './routes/simulator.js';
import { createTrayRouter } from './routes/tray.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Socket.io with JWT authentication
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io Auth Middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('Authentication token required for WebSocket connection'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.findUserById(decoded.id);
    if (!user) {
      return next(new Error('User not found'));
    }
    socket.user = user;
    next();
  } catch (err) {
    return next(new Error('Invalid WebSocket authentication token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user.id;
  const userRoom = `user:${userId}`;
  socket.join(userRoom);

  console.log(`[Socket] Authenticated user connected: ${socket.user.name} (${socket.user.email}) -> Room: ${userRoom}`);

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.user.name}`);
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/calls', createCallRouter(io));
app.use('/api/contacts', createContactRouter(io));
app.use('/api/push', pushRouter);
app.use('/api/settings', createSettingsRouter());
app.use('/api/simulator', createSimulatorRouter(io));
app.use('/api/tray', createTrayRouter(io));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Multi-User Call Notifier Server (MySQL Connected)'
  });
});

// Serve static frontend build
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next();
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await initDb();

  server.listen(PORT, '0.0.0.0', () => {
    console.log('=================================================');
    console.log(`🚀 Multi-User Call Notifier Backend running on port ${PORT}`);
    console.log(`🗄️ MySQL Database Connected: ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`);
    console.log(`📡 Ingestion Endpoint: http://localhost:${PORT}/api/calls/event`);
    console.log('=================================================');
  });
}

startServer();
