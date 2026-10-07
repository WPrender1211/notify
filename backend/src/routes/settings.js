import express from 'express';
import os from 'os';
import { requireAuth } from '../middleware/auth.js';

export const createSettingsRouter = () => {
  const router = express.Router();
  router.use(requireAuth);

  const getLocalIpAddresses = () => {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({ interface: name, ip: iface.address });
        }
      }
    }
    return addresses;
  };

  router.get('/', (req, res) => {
    const localIps = getLocalIpAddresses();
    const port = process.env.PORT || 5000;
    const userApiKey = req.user.apiKey;

    return res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        apiKey: userApiKey
      },
      localIps,
      port,
      serverUrls: localIps.map(item => `http://${item.ip}:${port}/api/calls/event`),
      samplePayload: {
        number: '+15552345678',
        name: 'Sarah Jenkins',
        state: 'RINGING',
        device: 'Android Phone',
        apiKey: userApiKey
      }
    });
  });

  return router;
};
