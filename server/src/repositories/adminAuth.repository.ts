import { RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export interface AdminUserRow extends RowDataPacket {
  Id: string;
  FullName: string;
  Email: string;
  Password: string;
  Role: string;
  IsActive: number;
  DefaultPasswordChanged: number;
  DateInvited: Date;
  DateCreated: Date;
  DateUpdated: Date | null;
  DateDeleted: Date | null;
}

export async function findAdminByEmail(email: string): Promise<AdminUserRow | null> {
  logger.info({ email }, 'Repository: findAdminByEmail');
  const [rows] = await pool.execute<AdminUserRow[]>(
    'SELECT * FROM AdminUsers WHERE Email = ? AND IsActive = 1 AND DateDeleted IS NULL',
    [email],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findAdminById(id: string): Promise<AdminUserRow | null> {
  logger.info({ adminId: id }, 'Repository: findAdminById');
  const [rows] = await pool.execute<AdminUserRow[]>(
    'SELECT * FROM AdminUsers WHERE Id = ? AND DateDeleted IS NULL',
    [id],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function updateAdminPassword(adminId: string, hashedPassword: string): Promise<void> {
  logger.info({ adminId }, 'Repository: updateAdminPassword');
  await pool.execute(
    'UPDATE AdminUsers SET Password = ?, DefaultPasswordChanged = 1, DateUpdated = NOW(6) WHERE Id = ?',
    [hashedPassword, adminId],
  );
}
