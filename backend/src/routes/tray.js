import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

let trayClients = [];
export const userMuteState = {}; // userId -> boolean

export const isUserMuted = (userId) => {
  if (!userId) return false;
  return !!userMuteState[userId];
};

export const setUserMuted = (userId, muted) => {
  if (userId) {
    userMuteState[userId] = !!muted;
  }
};

export const createTrayRouter = (io) => {
  const router = express.Router();

  const authTrayRequest = async (req) => {
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    const apiKey = req.query.apiKey || req.headers['x-api-key'] || req.body?.apiKey;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return await db.findUserById(decoded.id);
      } catch (e) {}
    }

    if (apiKey) {
      return await db.findUserByApiKey(apiKey);
    }

    // Default to first user if local dev request
    const users = await db.getAllUsers();
    return users.length > 0 ? users[0] : null;
  };

  // GET /api/tray/stream
  router.get('/stream', async (req, res) => {
    const user = await authTrayRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const client = { id: Date.now(), userId: user.id, res };
    trayClients.push(client);

    const isMuted = isUserMuted(user.id);
    res.write(`data: ${JSON.stringify({ type: 'INIT', user: { name: user.name, email: user.email }, isMuted })}\n\n`);

    req.on('close', () => {
      trayClients = trayClients.filter(c => c.id !== client.id);
    });
  });

  // GET /api/tray/status
  router.get('/status', async (req, res) => {
    const user = await authTrayRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, apiKey: user.api_key },
      isMuted: isUserMuted(user.id)
    });
  });

  // POST /api/tray/toggle-mute
  router.post('/toggle-mute', async (req, res) => {
    const user = await authTrayRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const newMuted = req.body.isMuted !== undefined ? !!req.body.isMuted : !userMuteState[user.id];
    userMuteState[user.id] = newMuted;

    // Broadcast to tray clients
    broadcastToTray(user.id, { type: 'MUTE_TOGGLED', isMuted: newMuted });

    // Broadcast to web socket clients
    io.to(`user:${user.id}`).emit('tray:mute-changed', { isMuted: newMuted });

    return res.json({ success: true, isMuted: newMuted });
  });

  return router;
};

export const broadcastToTray = (userId, payload) => {
  const matching = trayClients.filter(c => c.userId === userId);
  const dataString = `data: ${JSON.stringify(payload)}\n\n`;
  matching.forEach(c => {
    try {
      c.res.write(dataString);
    } catch (e) {
      console.warn('Error writing to tray client:', e.message);
    }
  });
};
