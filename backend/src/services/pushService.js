import webPush from 'web-push';
import { db } from '../db.js';
import { isUserMuted } from '../routes/tray.js';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxI2smOUdtx1qLNVbMgc5ks03uoqHGomihKM5yqL30';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@localdev.com';

try {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn('VAPID initialization warning:', e.message);
}

export const getVapidPublicKey = () => VAPID_PUBLIC_KEY;

export const sendPushNotification = async (payload, userId = null) => {
  // MASTER SAFEGUARD: If user is muted, DO NOT send any web push notification
  if (userId && isUserMuted(userId)) {
    console.log(`[Push] User ${userId} is MUTED. Suppressing Web Push notification.`);
    return;
  }

  const subscriptions = await db.getSubscriptions(userId);
  if (!subscriptions || !subscriptions.length) return;

  const payloadString = JSON.stringify(payload);

  const notifications = subscriptions.map(async (sub) => {
    try {
      await webPush.sendNotification(sub, payloadString);
    } catch (err) {
      // Auto-prune any dead, unsubscribed, or expired subscription from database
      try {
        await db.removeSubscription(sub.endpoint, userId);
      } catch (e) {}
    }
  });

  await Promise.allSettled(notifications);
};
