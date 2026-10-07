import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { sendPushNotification } from '../services/pushService.js';

export const createSimulatorRouter = (io) => {
  const router = express.Router();
  router.use(requireAuth);

  let simulationTimer = null;

  const sampleCallers = [
    { name: 'Elena Rostova', number: '+1 (555) 349-8812', company: 'Novacorp Global', tag: 'Client' },
    { name: 'Marcus Vance', number: '+1 (555) 782-4190', company: 'Starlight Tech', tag: 'Lead' },
    { name: 'Dr. Emily Watson', number: '+1 (555) 623-1109', company: 'Metro Health', tag: 'Partner' },
    { name: 'James O’Connor', number: '+1 (555) 901-3321', company: 'Prime Capital', tag: 'Investor' },
    { name: 'Unknown Caller', number: '+1 (555) 831-7645', company: '', tag: 'Spam/Unknown' }
  ];

  router.post('/trigger', async (req, res) => {
    const userId = req.user.id;
    const { type = 'RINGING', customName, customNumber, customCompany } = req.body;

    const caller = customName
      ? { name: customName, number: customNumber || '+1 (555) 000-1122', company: customCompany || '', tag: 'Custom' }
      : sampleCallers[Math.floor(Math.random() * sampleCallers.length)];

    if (type === 'AUTO_SEQUENCE') {
      const callRecord = await db.addCall({
        id: uuidv4(),
        userId,
        number: caller.number,
        name: caller.name,
        company: caller.company,
        tag: caller.tag,
        state: 'RINGING',
        type: 'INCOMING',
        duration: 0,
        timestamp: new Date().toISOString(),
        notes: '',
        device: 'Simulation Device'
      });

      io.to(`user:${userId}`).emit('call:event', { event: 'RINGING', call: callRecord });
      sendPushNotification({
        title: `Incoming: ${caller.name}`,
        body: `${caller.number} ${caller.company ? `(${caller.company})` : ''}`,
        tag: 'incoming-call'
      }, userId);

      if (simulationTimer) clearTimeout(simulationTimer);
      simulationTimer = setTimeout(async () => {
        const answeredCall = await db.updateCall(callRecord.id, {
          state: 'ANSWERED'
        }, userId);
        io.to(`user:${userId}`).emit('call:event', { event: 'ANSWERED', call: answeredCall });

        simulationTimer = setTimeout(async () => {
          const endedCall = await db.updateCall(callRecord.id, {
            state: 'ENDED',
            duration: 8
          }, userId);
          io.to(`user:${userId}`).emit('call:event', { event: 'ENDED', call: endedCall });
        }, 8000);
      }, 4000);

      return res.json({ success: true, message: 'Auto call sequence started', call: callRecord });
    }

    if (type === 'RINGING') {
      const callRecord = await db.addCall({
        id: uuidv4(),
        userId,
        number: caller.number,
        name: caller.name,
        company: caller.company,
        tag: caller.tag,
        state: 'RINGING',
        type: 'INCOMING',
        duration: 0,
        timestamp: new Date().toISOString(),
        notes: '',
        device: 'Simulation Device'
      });

      io.to(`user:${userId}`).emit('call:event', { event: 'RINGING', call: callRecord });
      sendPushNotification({
        title: `Incoming: ${caller.name}`,
        body: `${caller.number}`,
        tag: 'incoming-call'
      }, userId);
      return res.json({ success: true, call: callRecord });
    }

    if (type === 'MISSED') {
      const activeCall = await db.findActiveCall(userId);
      let callRecord;
      if (activeCall) {
        callRecord = await db.updateCall(activeCall.id, { state: 'MISSED' }, userId);
      } else {
        callRecord = await db.addCall({
          id: uuidv4(),
          userId,
          number: caller.number,
          name: caller.name,
          company: caller.company,
          tag: caller.tag,
          state: 'MISSED',
          type: 'INCOMING',
          duration: 0,
          timestamp: new Date().toISOString(),
          notes: '',
          device: 'Simulation Device'
        });
      }

      io.to(`user:${userId}`).emit('call:event', { event: 'MISSED', call: callRecord });
      sendPushNotification({
        title: `Missed: ${caller.name}`,
        body: `${caller.number}`,
        tag: 'missed-call'
      }, userId);
      return res.json({ success: true, call: callRecord });
    }

    if (type === 'ENDED' || type === 'REJECTED') {
      const activeCall = await db.findActiveCall(userId);
      if (activeCall) {
        const updated = await db.updateCall(activeCall.id, {
          state: type,
          duration: activeCall.state === 'ANSWERED' ? 24 : 0
        }, userId);
        io.to(`user:${userId}`).emit('call:event', { event: type, call: updated });
        return res.json({ success: true, call: updated });
      }
      return res.json({ success: true, message: 'No active call to end' });
    }

    return res.status(400).json({ error: 'Unknown simulation type' });
  });

  return router;
};
