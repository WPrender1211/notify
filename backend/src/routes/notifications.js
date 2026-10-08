import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { sendPushNotification } from '../services/pushService.js';

export const createNotificationRouter = (io) => {
  const router = express.Router();

  // 1. Ingestion API for Android Phone
  // POST /api/notifications/event
  router.post('/event', async (req, res) => {
    try {
      const { packageName, appName, title, text, subText, timestamp } = req.body;

      const apiKey = req.body.apiKey ||
        req.headers['x-api-key'] ||
        (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
          ? req.headers.authorization.split(' ')[1]
          : null);

      if (!apiKey) {
        return res.status(401).json({ error: 'Missing API Key.' });
      }

      const user = await db.findUserByApiKey(apiKey);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user API Key.' });
      }

      if (!packageName) {
        return res.status(400).json({ error: 'Missing required field: packageName' });
      }

      // Check User Filter Rules for this App
      const rule = await db.getAppRuleForPackage(user.id, packageName);

      // If user disabled logging completely for this app
      if (!rule.logToWeb) {
        return res.json({ success: true, ignored: true, message: 'App is muted by user rule.' });
      }

      // Automatically register app in rules table if not yet present
      await db.upsertAppRule(
        user.id,
        uuidv4(),
        packageName,
        appName || 'App',
        rule.logToWeb,
        rule.showPopup
      );

      const notifRecord = await db.addNotification({
        id: uuidv4(),
        userId: user.id,
        packageName,
        appName: appName || 'App',
        title: title || '',
        text: text || '',
        subText: subText || '',
        timestamp: timestamp || new Date().toISOString()
      });

      // Broadcast real-time event to user's web socket room
      io.to(`user:${user.id}`).emit('notification:event', {
        notification: notifRecord,
        showPopup: rule.showPopup
      });

      // Forward to Windows System Tray Companion if showPopup is true
      if (rule.showPopup) {
        try {
          const { broadcastToTray, isUserMuted } = await import('./tray.js');
          broadcastToTray(user.id, {
            type: 'APP_NOTIFICATION',
            notification: notifRecord
          });

          // Dispatch Web Push if user is not globally muted
          if (!isUserMuted(user.id)) {
            sendPushNotification({
              title: `${appName || 'Notification'}: ${title || ''}`.trim(),
              body: text || '',
              tag: `app-${packageName}`,
              data: { notifId: notifRecord.id, packageName, appName }
            }, user.id);
          }
        } catch (e) {}
      }

      return res.status(201).json({ success: true, notification: notifRecord });
    } catch (err) {
      console.error('Error processing notification event:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Protected User Routes
  router.use(requireAuth);

  // GET /api/notifications
  router.get('/', async (req, res) => {
    try {
      const limit = req.query.limit || 100;
      const notifications = await db.getNotifications(req.user.id, limit);
      return res.json({ notifications });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // DELETE /api/notifications/clear
  router.delete('/clear', async (req, res) => {
    try {
      await db.clearNotifications(req.user.id);
      io.to(`user:${req.user.id}`).emit('notification:cleared');
      return res.json({ success: true, message: 'All notifications cleared' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to clear notifications' });
    }
  });

  // DELETE /api/notifications/:id
  router.delete('/:id', async (req, res) => {
    try {
      await db.deleteNotification(req.params.id, req.user.id);
      io.to(`user:${req.user.id}`).emit('notification:deleted', { id: req.params.id });
      return res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
  });

  // GET /api/notifications/rules
  router.get('/rules', async (req, res) => {
    try {
      const rules = await db.getAppRules(req.user.id);
      return res.json({ rules });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch app rules' });
    }
  });

  // POST /api/notifications/rules
  router.post('/rules', async (req, res) => {
    const { packageName, appName, logToWeb, showPopup } = req.body;
    if (!packageName) {
      return res.status(400).json({ error: 'packageName is required' });
    }

    try {
      await db.upsertAppRule(
        req.user.id,
        uuidv4(),
        packageName,
        appName || 'App',
        logToWeb !== undefined ? Boolean(logToWeb) : true,
        showPopup !== undefined ? Boolean(showPopup) : true
      );

      const updatedRules = await db.getAppRules(req.user.id);
      return res.json({ success: true, rules: updatedRules });
    } catch (err) {
      console.error('Error saving app rule:', err);
      return res.status(500).json({ error: 'Failed to update app rule' });
    }
  });

  return router;
};
