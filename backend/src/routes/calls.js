import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { sendPushNotification } from '../services/pushService.js';

export const createCallRouter = (io) => {
  const router = express.Router();

  // Ingestion API for Android Phone or Webhooks
  // POST /api/calls/event
  router.post('/event', async (req, res) => {
    try {
      const { number, name, state, duration, timestamp, device } = req.body;

      const apiKey = req.body.apiKey ||
        req.headers['x-api-key'] ||
        (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
          ? req.headers.authorization.split(' ')[1]
          : null);

      if (!apiKey) {
        return res.status(401).json({
          error: 'Missing API Key. Provide your user API Key in the "apiKey" body parameter or "x-api-key" header.'
        });
      }

      const user = await db.findUserByApiKey(apiKey);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user API Key.' });
      }

      if (!number && !state) {
        return res.status(400).json({ error: 'Missing required fields: number, state' });
      }

      const formattedState = (state || 'RINGING').toUpperCase();

      let callerName = name;
      let callerCompany = '';
      let callerTag = '';

      const matchedContact = await db.findContactByNumber(number || '', user.id);
      if (matchedContact) {
        if (!callerName || callerName === 'Unknown' || callerName === 'Unknown Caller') {
          callerName = matchedContact.name;
        }
        callerCompany = matchedContact.company || '';
        callerTag = matchedContact.tag || '';
      } else if (!callerName) {
        callerName = 'Unknown Caller';
      }

      const activeCall = await db.findActiveCall(user.id);
      let callRecord;

      if (activeCall && (formattedState === 'ANSWERED' || formattedState === 'ENDED' || formattedState === 'MISSED' || formattedState === 'REJECTED')) {
        callRecord = await db.updateCall(activeCall.id, {
          state: formattedState,
          duration: duration !== undefined ? duration : (activeCall.duration || 0)
        }, user.id);
      } else {
        callRecord = await db.addCall({
          id: uuidv4(),
          userId: user.id,
          number: number || 'Private Number',
          name: callerName,
          company: callerCompany,
          tag: callerTag,
          state: formattedState,
          type: 'INCOMING',
          duration: duration || 0,
          timestamp: timestamp || new Date().toISOString(),
          notes: '',
          device: device || 'Android Phone'
        });
      }

      // Broadcast real-time event to socket room
      io.to(`user:${user.id}`).emit('call:event', {
        event: formattedState,
        call: callRecord
      });

      // Broadcast to Windows System Tray Companion
      try {
        const { broadcastToTray } = await import('./tray.js');
        broadcastToTray(user.id, { type: 'CALL_EVENT', event: formattedState, call: callRecord });
      } catch (e) {}

      // Dispatch Web Push specifically to this user's devices (ONLY if NOT muted)
      try {
        const { isUserMuted } = await import('./tray.js');
        if (!isUserMuted(user.id)) {
          if (formattedState === 'RINGING') {
            sendPushNotification({
              title: `Incoming: ${callerName}`,
              body: `${number} ${callerCompany ? `(${callerCompany})` : ''}`,
              tag: 'incoming-call',
              data: { callId: callRecord.id, number, name: callerName }
            }, user.id);
          } else if (formattedState === 'MISSED') {
            sendPushNotification({
              title: `Missed: ${callerName}`,
              body: `${number} - ${new Date().toLocaleTimeString()}`,
              tag: 'missed-call',
              data: { callId: callRecord.id }
            }, user.id);
          }
        }
      } catch (e) {}

      return res.status(200).json({
        success: true,
        message: `Call event processed for user ${user.name}: ${formattedState}`,
        call: callRecord
      });
    } catch (err) {
      console.error('Error processing call event:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/calls
  router.get('/', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { state, search } = req.query;
      let calls = await db.getCalls(userId);

      if (state && state !== 'ALL') {
        calls = calls.filter(c => c.state === state.toUpperCase());
      }

      if (search) {
        const q = search.toLowerCase();
        calls = calls.filter(c =>
          (c.number && c.number.toLowerCase().includes(q)) ||
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q)) ||
          (c.company && c.company.toLowerCase().includes(q))
        );
      }

      const activeCall = await db.findActiveCall(userId);

      return res.json({
        calls,
        activeCall,
        total: calls.length
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch calls' });
    }
  });

  // PATCH /api/calls/:id
  router.patch('/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { notes, name, company } = req.body;

      const updated = await db.updateCall(id, {
        ...(notes !== undefined && { notes }),
        ...(name !== undefined && { name }),
        ...(company !== undefined && { company })
      }, userId);

      if (!updated) {
        return res.status(404).json({ error: 'Call record not found' });
      }

      io.to(`user:${userId}`).emit('call:updated', updated);
      return res.json({ success: true, call: updated });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update call' });
    }
  });

  // DELETE /api/calls/:id
  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      await db.deleteCall(id, userId);
      io.to(`user:${userId}`).emit('call:deleted', { id });
      return res.json({ success: true, message: 'Call deleted' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete call' });
    }
  });

  // DELETE /api/calls
  router.delete('/', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      await db.clearCalls(userId);
      io.to(`user:${userId}`).emit('call:cleared');
      return res.json({ success: true, message: 'Call history cleared' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to clear calls' });
    }
  });

  // GET /api/calls/stats
  router.get('/stats', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const stats = await db.getCallStats(userId);
      return res.json(stats);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch call stats' });
    }
  });

  return router;
};
