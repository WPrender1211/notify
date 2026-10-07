import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getVapidPublicKey, sendPushNotification } from '../services/pushService.js';

export const pushRouter = express.Router();

// GET /api/push/public-key
pushRouter.get('/public-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

// POST /api/push/subscribe
pushRouter.post('/subscribe', requireAuth, async (req, res) => {
  const subscription = req.body;
  const userId = req.user.id;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid push subscription payload' });
  }

  try {
    await db.addSubscription(subscription, userId);
    return res.status(201).json({ success: true, message: 'Push subscription stored in database' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to store push subscription' });
  }
});

// POST /api/push/unsubscribe
pushRouter.post('/unsubscribe', requireAuth, async (req, res) => {
  const { endpoint } = req.body;
  const userId = req.user.id;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  try {
    await db.removeSubscription(endpoint, userId);
    return res.json({ success: true, message: 'Push subscription removed' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove push subscription' });
  }
});

// POST /api/push/test
pushRouter.post('/test', requireAuth, async (req, res) => {
  try {
    await sendPushNotification({
      title: 'Call Notifier Test Alert',
      body: 'Browser push notifications are connected and working properly for your account!',
      tag: 'test-notification'
    }, req.user.id);

    return res.json({ success: true, message: 'Test notification dispatched' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to dispatch push notification' });
  }
});
