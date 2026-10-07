import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { JWT_SECRET, requireAuth } from '../middleware/auth.js';

export const authRouter = express.Router();

// 1. Verify Secret Keyboard Shortcut Against MySQL Database
// POST /api/auth/verify-shortcut
authRouter.post('/verify-shortcut', async (req, res) => {
  const { sequence } = req.body;
  if (!sequence || typeof sequence !== 'string') {
    return res.status(400).json({ error: 'Sequence is required' });
  }

  try {
    const isUnlocked = await db.verifyStealthShortcut(sequence);

    if (isUnlocked) {
      return res.json({
        success: true,
        unlocked: true,
        message: 'Sequence verified by MySQL database'
      });
    }

    return res.status(401).json({
      success: false,
      unlocked: false,
      error: 'Invalid sequence'
    });
  } catch (err) {
    console.error('Error verifying shortcut:', err);
    return res.status(500).json({ error: 'Internal database error' });
  }
});

// 2. User Login
// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const { email, username, password } = req.body;

  if ((!email && !username) || !password) {
    return res.status(400).json({ error: 'Username/email and password are required' });
  }

  try {
    let user = null;
    if (email) {
      user = await db.findUserByEmail(email);
    }
    if (!user && (username || email)) {
      user = await db.findUserByUsername(username || email);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '365d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        apiKey: user.api_key
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. User Registration (Secured by Database-Driven Security Key: Notify@ys)
// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  const { name, email, password, username, securityKey } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (!securityKey) {
    return res.status(400).json({ error: 'Admin Security Key is required for registration' });
  }

  try {
    // Cryptographically verify security key against MySQL database
    const isKeyValid = await db.verifyRegistrationKey(securityKey.trim());
    if (!isKeyValid) {
      return res.status(403).json({ error: 'Invalid Security Key. Contact your administrator.' });
    }

    const existingEmail = await db.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    let candidateUsername = username || email.split('@')[0] || name.trim().split(' ')[0].toLowerCase();
    let existingUsername = await db.findUserByUsername(candidateUsername);
    if (existingUsername) {
      candidateUsername = `${candidateUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const secret_key_hash = await bcrypt.hash('Ctrl+y->Alt+s', 10);
    const id = `user-${Date.now()}`;
    const apiKey = `usr_key_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${uuidv4().slice(0, 8)}`;

    const newUser = await db.createUser({
      id,
      username: candidateUsername,
      name,
      email,
      password_hash,
      secret_key_hash,
      api_key: apiKey
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        apiKey: newUser.api_key
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create user account' });
  }
});

// 4. Update Secret Shortcut in MySQL
// POST /api/auth/update-shortcut
authRouter.post('/update-shortcut', requireAuth, async (req, res) => {
  const { sequence } = req.body;
  if (!sequence || sequence.trim().length < 3) {
    return res.status(400).json({ error: 'Valid sequence string required' });
  }

  try {
    const newHash = await bcrypt.hash(sequence.trim(), 10);
    await db.updateSecretShortcut(req.user.id, newHash);
    return res.json({ success: true, message: 'Secret shortcut updated in MySQL database!' });
  } catch (err) {
    console.error('Error updating shortcut:', err);
    return res.status(500).json({ error: 'Failed to update shortcut in database' });
  }
});
