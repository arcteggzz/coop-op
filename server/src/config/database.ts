import mysql from 'mysql2/promise';
import { env } from './env';
import { logger } from '../utils/logger';

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  ssl: {
    rejectUnauthorized: false, // DigitalOcean managed DB requires SSL
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testDatabaseConnection(): Promise<void> {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
  logger.info('Database connection established successfully');
}

export { pool };
