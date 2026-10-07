import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const createContactRouter = (io) => {
  const router = express.Router();
  router.use(requireAuth);

  // GET /api/contacts
  router.get('/', async (req, res) => {
    try {
      const contacts = await db.getContacts(req.user.id);
      return res.json({ contacts });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  });

  // POST /api/contacts
  router.post('/', async (req, res) => {
    const { name, number, company, email, tag, notes } = req.body;
    if (!name || !number) {
      return res.status(400).json({ error: 'Name and number are required' });
    }

    try {
      const newContact = await db.addContact({
        id: uuidv4(),
        userId: req.user.id,
        name,
        number,
        company: company || '',
        email: email || '',
        tag: tag || 'Contact',
        notes: notes || ''
      });

      io.to(`user:${req.user.id}`).emit('contact:created', newContact);
      return res.status(201).json({ success: true, contact: newContact });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save contact' });
    }
  });

  // DELETE /api/contacts/:id
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.deleteContact(id, req.user.id);
      io.to(`user:${req.user.id}`).emit('contact:deleted', { id });
      return res.json({ success: true, message: 'Contact deleted' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete contact' });
    }
  });

  return router;
};
