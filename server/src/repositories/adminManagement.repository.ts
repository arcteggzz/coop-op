import { RowDataPacket, ResultSetHeader } from 'mysql2';
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
  InvitedByAdminId: string | null;
  DateCreated: Date;
  DateUpdated: Date | null;
  DateDeleted: Date | null;
}

export interface AdminPermissionRow extends RowDataPacket {
  Id: string;
  AdminId: string;
  PermissionKey: string;
}

// ─── Lookups ──────────────────────────────────────────────────────────────────

export async function findAdminByEmail(email: string): Promise<AdminUserRow | null> {
  logger.info({ email }, 'Repository: findAdminByEmail (management)');
  const [rows] = await pool.execute<AdminUserRow[]>(
    'SELECT * FROM AdminUsers WHERE Email = ? AND DateDeleted IS NULL',
    [email],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findAdminById(id: string): Promise<AdminUserRow | null> {
  logger.info({ adminId: id }, 'Repository: findAdminById (management)');
  const [rows] = await pool.execute<AdminUserRow[]>(
    'SELECT * FROM AdminUsers WHERE Id = ? AND DateDeleted IS NULL',
    [id],
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createAdmin(data: {
  id: string;
  fullName: string;
  email: string;
  hashedPassword: string;
  role: string;
  invitedByAdminId: string;
}): Promise<void> {
  logger.info({ email: data.email, role: data.role }, 'Repository: createAdmin');
  await pool.execute<ResultSetHeader>(
    `INSERT INTO AdminUsers
       (Id, FullName, Email, Password, Role, IsActive, DefaultPasswordChanged, DateInvited, InvitedByAdminId, DateCreated)
     VALUES (?, ?, ?, ?, ?, 1, 0, NOW(6), ?, NOW(6))`,
    [data.id, data.fullName, data.email, data.hashedPassword, data.role, data.invitedByAdminId],
  );
}

export async function insertAdminPermissions(
  adminId: string,
  permissionKeys: string[],
): Promise<void> {
  logger.info({ adminId, count: permissionKeys.length }, 'Repository: insertAdminPermissions');
  for (const key of permissionKeys) {
    const id = require('uuid').v4();
    await pool.execute(
      'INSERT INTO AdminPermissions (Id, AdminId, PermissionKey, DateCreated) VALUES (?, ?, ?, NOW(6))',
      [id, adminId, key],
    );
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listAdmins(
  filters: { role?: string; isActive?: number },
  page: number,
  pageSize: number,
): Promise<AdminUserRow[]> {
  logger.info({ filters, page, pageSize }, 'Repository: listAdmins');
  const conditions: string[] = ['DateDeleted IS NULL'];
  const params: (string | number)[] = [];

  if (filters.role) {
    conditions.push('Role = ?');
    params.push(filters.role);
  }
  if (filters.isActive !== undefined) {
    conditions.push('IsActive = ?');
    params.push(filters.isActive);
  }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.execute<AdminUserRow[]>(
    `SELECT Id, FullName, Email, Role, IsActive, DefaultPasswordChanged, DateInvited, DateCreated
     FROM AdminUsers WHERE ${where} ORDER BY DateCreated DESC LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );
  return rows;
}

export async function countAdmins(filters: { role?: string; isActive?: number }): Promise<number> {
  logger.info({ filters }, 'Repository: countAdmins');
  const conditions: string[] = ['DateDeleted IS NULL'];
  const params: (string | number)[] = [];

  if (filters.role) {
    conditions.push('Role = ?');
    params.push(filters.role);
  }
  if (filters.isActive !== undefined) {
    conditions.push('IsActive = ?');
    params.push(filters.isActive);
  }

  const where = conditions.join(' AND ');
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM AdminUsers WHERE ${where}`,
    params,
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function getAdminPermissions(adminId: string): Promise<string[]> {
  logger.info({ adminId }, 'Repository: getAdminPermissions');
  const [rows] = await pool.execute<AdminPermissionRow[]>(
    'SELECT PermissionKey FROM AdminPermissions WHERE AdminId = ? AND DateDeleted IS NULL',
    [adminId],
  );
  return rows.map((r) => r.PermissionKey);
}

export async function replaceAdminPermissions(
  adminId: string,
  permissionKeys: string[],
): Promise<void> {
  logger.info({ adminId, count: permissionKeys.length }, 'Repository: replaceAdminPermissions');
  await pool.execute('DELETE FROM AdminPermissions WHERE AdminId = ?', [adminId]);
  await insertAdminPermissions(adminId, permissionKeys);
}

// ─── Status updates ───────────────────────────────────────────────────────────

export async function setAdminIsActive(adminId: string, isActive: 0 | 1): Promise<void> {
  logger.info({ adminId, isActive }, 'Repository: setAdminIsActive');
  await pool.execute(
    'UPDATE AdminUsers SET IsActive = ?, DateUpdated = NOW(6) WHERE Id = ?',
    [isActive, adminId],
  );
}

export async function softDeleteAdmin(adminId: string): Promise<void> {
  logger.info({ adminId }, 'Repository: softDeleteAdmin');
  await pool.execute(
    'UPDATE AdminUsers SET DateDeleted = NOW(6), IsActive = 0, DateUpdated = NOW(6) WHERE Id = ?',
    [adminId],
  );
}
