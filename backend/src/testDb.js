import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  console.log(`Connecting to MySQL on ${process.env.DB_HOST}:${process.env.DB_PORT} as ${process.env.DB_USER}...`);
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    });
    console.log('✅ Successfully connected to MySQL database!');

    const [rows] = await connection.query('SHOW TABLES;');
    console.log('Tables in database:', rows);
    await connection.end();
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  }
}

testConnection();
