import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

// Create MySQL Connection Pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || '217.21.69.110',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'u876416965_test01',
  password: process.env.DB_PASSWORD || 'Vgs@1211',
  database: process.env.DB_NAME || 'u876416965_test01',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Initialize and auto-migrate MySQL Schema
export async function initDb() {
  try {
    const conn = await pool.getConnection();

    // 1. admin_users Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        secret_key_hash VARCHAR(255) NOT NULL,
        api_key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. system_settings Table (stores database-driven master keys like registration_key and global_shortcut)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value_hash VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure Master Registration Key (Notify@ys) is stored in MySQL database
    const [regSetting] = await conn.query("SELECT * FROM system_settings WHERE setting_key = 'registration_key'");
    if (regSetting.length === 0) {
      const regKeyHash = await bcrypt.hash('Notify@ys', 10);
      await conn.query(`
        INSERT INTO system_settings (setting_key, setting_value_hash, description)
        VALUES ('registration_key', ?, 'Master security key required during user account creation')
      `, [regKeyHash]);
      console.log("🔑 Master registration security key ('Notify@ys') configured in MySQL database.");
    }

    // Ensure Global Secret Shortcut (Ctrl+y->Alt+s) is stored in MySQL database
    const [shortcutSetting] = await conn.query("SELECT * FROM system_settings WHERE setting_key = 'stealth_shortcut'");
    if (shortcutSetting.length === 0) {
      const shortcutHash = await bcrypt.hash('Ctrl+y->Alt+s', 10);
      await conn.query(`
        INSERT INTO system_settings (setting_key, setting_value_hash, description)
        VALUES ('stealth_shortcut', ?, 'Global secret shortcut sequence to unlock stealth 404 page')
      `, [shortcutHash]);
    }

    // 3. calls Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS calls (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        number VARCHAR(50) NOT NULL,
        name VARCHAR(100),
        company VARCHAR(100),
        tag VARCHAR(50),
        state VARCHAR(30) NOT NULL,
        type VARCHAR(30) NOT NULL,
        duration INT DEFAULT 0,
        notes TEXT,
        timestamp DATETIME NOT NULL,
        device VARCHAR(100),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. contacts Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        number VARCHAR(50) NOT NULL,
        company VARCHAR(100),
        email VARCHAR(100),
        tag VARCHAR(50),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_contact (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. push_subscriptions Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        endpoint TEXT NOT NULL,
        keys_p256dh TEXT NOT NULL,
        keys_auth TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sub_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Remove any legacy seeded demo users (like user-alex)
    await conn.query("DELETE FROM admin_users WHERE id IN ('user-alex')");

    conn.release();
    console.log('✅ Remote MySQL database tables verified and ready (No initial seed).');
  } catch (err) {
    console.error('❌ Error initializing MySQL tables:', err.message);
  }
}

// Database helper operations
export const db = {
  // System Settings & Keys
  async getSetting(key) {
    const [rows] = await pool.query('SELECT * FROM system_settings WHERE setting_key = ?', [key]);
    return rows[0] || null;
  },

  async verifyRegistrationKey(submittedKey) {
    const setting = await this.getSetting('registration_key');
    if (!setting) return false;
    return await bcrypt.compare(submittedKey, setting.setting_value_hash);
  },

  async verifyStealthShortcut(submittedSeq) {
    const cleanSeq = submittedSeq.trim();
    // 1. Check global setting
    const globalSetting = await this.getSetting('stealth_shortcut');
    if (globalSetting) {
      const match = await bcrypt.compare(cleanSeq, globalSetting.setting_value_hash) ||
                    await bcrypt.compare(cleanSeq.toLowerCase(), globalSetting.setting_value_hash);
      if (match) return true;
    }

    // 2. Check user-specific shortcuts
    const [users] = await pool.query('SELECT secret_key_hash FROM admin_users');
    for (const u of users) {
      if (u.secret_key_hash) {
        const match = await bcrypt.compare(cleanSeq, u.secret_key_hash) ||
                      await bcrypt.compare(cleanSeq.toLowerCase(), u.secret_key_hash);
        if (match) return true;
      }
    }
    return false;
  },

  // Users
  async findUserById(id) {
    const [rows] = await pool.query('SELECT * FROM admin_users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findUserByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM admin_users WHERE LOWER(email) = LOWER(?)', [email]);
    return rows[0] || null;
  },

  async findUserByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?)', [username]);
    return rows[0] || null;
  },

  async findUserByApiKey(apiKey) {
    const [rows] = await pool.query('SELECT * FROM admin_users WHERE api_key = ?', [apiKey]);
    return rows[0] || null;
  },

  async getAllUsers() {
    const [rows] = await pool.query('SELECT id, username, email, name, api_key, secret_key_hash FROM admin_users');
    return rows;
  },

  async createUser(userData) {
    await pool.query(`
      INSERT INTO admin_users (id, username, email, password_hash, secret_key_hash, api_key, name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userData.id,
      userData.username || userData.name.split(' ')[0],
      userData.email,
      userData.password_hash,
      userData.secret_key_hash,
      userData.api_key,
      userData.name
    ]);
    return this.findUserById(userData.id);
  },

  async updateSecretShortcut(userId, newShortcutHash) {
    await pool.query('UPDATE admin_users SET secret_key_hash = ? WHERE id = ?', [newShortcutHash, userId]);
  },

  // Calls
  async getCalls(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM calls WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100',
      [userId]
    );
    return rows.map(r => ({
      ...r,
      userId: r.user_id,
      timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp
    }));
  },

  async addCall(callData) {
    const uid = callData.userId || callData.user_id;
    const dateVal = callData.timestamp ? new Date(callData.timestamp) : new Date();
    await pool.query(`
      INSERT INTO calls (id, user_id, number, name, company, tag, state, type, duration, notes, timestamp, device)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      callData.id,
      uid,
      callData.number,
      callData.name || 'Unknown Caller',
      callData.company || '',
      callData.tag || 'Unknown',
      callData.state,
      callData.type || 'INCOMING',
      callData.duration || 0,
      callData.notes || '',
      dateVal,
      callData.device || 'Android Device'
    ]);
    return { ...callData, userId: uid };
  },

  async updateCall(callId, updates, userId) {
    const setClauses = [];
    const values = [];

    if (updates.state !== undefined) { setClauses.push('state = ?'); values.push(updates.state); }
    if (updates.duration !== undefined) { setClauses.push('duration = ?'); values.push(updates.duration); }
    if (updates.notes !== undefined) { setClauses.push('notes = ?'); values.push(updates.notes); }
    if (updates.number !== undefined) { setClauses.push('number = ?'); values.push(updates.number); }
    if (updates.name !== undefined) { setClauses.push('name = ?'); values.push(updates.name); }
    if (updates.company !== undefined) { setClauses.push('company = ?'); values.push(updates.company); }
    if (updates.tag !== undefined) { setClauses.push('tag = ?'); values.push(updates.tag); }

    if (setClauses.length > 0) {
      values.push(callId, userId);
      await pool.query(`UPDATE calls SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`, values);
    }

    const [rows] = await pool.query('SELECT * FROM calls WHERE id = ? AND user_id = ?', [callId, userId]);
    if (rows[0]) {
      return {
        ...rows[0],
        userId: rows[0].user_id,
        timestamp: rows[0].timestamp instanceof Date ? rows[0].timestamp.toISOString() : rows[0].timestamp
      };
    }
    return null;
  },

  async findActiveCall(userId) {
    const [rows] = await pool.query(
      "SELECT * FROM calls WHERE user_id = ? AND state IN ('RINGING', 'ANSWERED') ORDER BY timestamp DESC LIMIT 1",
      [userId]
    );
    if (rows[0]) {
      return {
        ...rows[0],
        userId: rows[0].user_id,
        timestamp: rows[0].timestamp instanceof Date ? rows[0].timestamp.toISOString() : rows[0].timestamp
      };
    }
    return null;
  },

  async deleteCall(callId, userId) {
    await pool.query('DELETE FROM calls WHERE id = ? AND user_id = ?', [callId, userId]);
  },

  async clearCalls(userId) {
    await pool.query('DELETE FROM calls WHERE user_id = ?', [userId]);
  },

  async getCallStats(userId) {
    const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM calls WHERE user_id = ?', [userId]);
    const [missedRows] = await pool.query("SELECT COUNT(*) as count FROM calls WHERE user_id = ? AND state = 'MISSED'", [userId]);
    const [answeredRows] = await pool.query("SELECT COUNT(*) as count FROM calls WHERE user_id = ? AND state IN ('ANSWERED', 'ENDED')", [userId]);
    const [todayRows] = await pool.query('SELECT COUNT(*) as count FROM calls WHERE user_id = ? AND DATE(timestamp) = CURDATE()', [userId]);

    return {
      total: totalRows[0]?.count || 0,
      todayCount: todayRows[0]?.count || 0,
      missed: missedRows[0]?.count || 0,
      answered: answeredRows[0]?.count || 0
    };
  },

  // Contacts
  async getContacts(userId) {
    const [rows] = await pool.query('SELECT * FROM contacts WHERE user_id = ? ORDER BY name ASC', [userId]);
    return rows.map(r => ({ ...r, userId: r.user_id }));
  },

  async findContactByNumber(number, userId) {
    const cleanNum = number.replace(/\D/g, '');
    const [rows] = await pool.query(
      "SELECT * FROM contacts WHERE user_id = ? AND REPLACE(REPLACE(REPLACE(number, ' ', ''), '-', ''), '+', '') LIKE ?",
      [userId, `%${cleanNum.slice(-10)}`]
    );
    return rows[0] || null;
  },

  async addContact(contactData) {
    await pool.query(`
      INSERT INTO contacts (id, user_id, name, number, company, email, tag, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      contactData.id,
      contactData.userId,
      contactData.name,
      contactData.number,
      contactData.company || '',
      contactData.email || '',
      contactData.tag || 'Contact',
      contactData.notes || ''
    ]);
    return contactData;
  },

  async deleteContact(contactId, userId) {
    await pool.query('DELETE FROM contacts WHERE id = ? AND user_id = ?', [contactId, userId]);
  },

  // Push Subscriptions
  async getSubscriptions(userId) {
    const [rows] = await pool.query('SELECT * FROM push_subscriptions WHERE user_id = ?', [userId]);
    return rows.map(r => ({
      endpoint: r.endpoint,
      keys: {
        p256dh: r.keys_p256dh,
        auth: r.keys_auth
      }
    }));
  },

  async addSubscription(subscription, userId) {
    const [existing] = await pool.query(
      'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, subscription.endpoint]
    );
    if (existing.length === 0) {
      await pool.query(`
        INSERT INTO push_subscriptions (user_id, endpoint, keys_p256dh, keys_auth)
        VALUES (?, ?, ?, ?)
      `, [
        userId,
        subscription.endpoint,
        subscription.keys?.p256dh || '',
        subscription.keys?.auth || ''
      ]);
    }
  },

  async removeSubscription(endpoint, userId) {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?', [endpoint, userId]);
  }
};
