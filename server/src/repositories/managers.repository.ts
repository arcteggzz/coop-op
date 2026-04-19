import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

export interface ManagementUserRow extends RowDataPacket {
  Id: string;
  FullName: string;
  Email: string;
  Password: string;
  IsActive: number;
  DefaultPasswordChanged: number;
  DateInvited: Date;
  InvitedByAdminId: string;
  InvitedByAdminType: string;
  DateCreated: Date;
  DateUpdated: Date | null;
  DateDeleted: Date | null;
}

export interface ManagementUsersCooperativesRow extends RowDataPacket {
  Id: string;
  ManagerId: string;
  CooperativeId: string;
  Role: string;
  IsDefault: number;
  DateCreated: Date;
  DateUpdated: Date | null;
  DateDeleted: Date | null;
}

export interface ManagementUserPermissionRow extends RowDataPacket {
  Id: string;
  ManagerId: string;
  CooperativeId: string;
  PermissionKey: string;
}

// ─── ManagementUsers lookups ──────────────────────────────────────────────────

export async function findManagerByEmail(
  email: string,
): Promise<ManagementUserRow | null> {
  logger.info({ email }, "Repository: findManagerByEmail");
  const [rows] = await pool.execute<ManagementUserRow[]>(
    "SELECT * FROM ManagementUsers WHERE Email = ? AND DateDeleted IS NULL",
    [email],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findManagerById(
  id: string,
): Promise<ManagementUserRow | null> {
  logger.info({ managerId: id }, "Repository: findManagerById");
  const [rows] = await pool.execute<ManagementUserRow[]>(
    "SELECT * FROM ManagementUsers WHERE Id = ? AND DateDeleted IS NULL",
    [id],
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── ManagementUsersCooperatives lookups ──────────────────────────────────────

export async function findManagerCooperativeLink(
  managerId: string,
  cooperativeId: string,
): Promise<ManagementUsersCooperativesRow | null> {
  logger.info(
    { managerId, cooperativeId },
    "Repository: findManagerCooperativeLink",
  );
  const [rows] = await pool.execute<ManagementUsersCooperativesRow[]>(
    "SELECT * FROM ManagementUsersCooperatives WHERE ManagerId = ? AND CooperativeId = ? AND DateDeleted IS NULL",
    [managerId, cooperativeId],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findRootManagerForCooperative(
  cooperativeId: string,
): Promise<ManagementUsersCooperativesRow | null> {
  logger.info({ cooperativeId }, "Repository: findRootManagerForCooperative");
  const [rows] = await pool.execute<ManagementUsersCooperativesRow[]>(
    "SELECT * FROM ManagementUsersCooperatives WHERE CooperativeId = ? AND Role = 'RootManager' AND DateDeleted IS NULL",
    [cooperativeId],
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createManager(data: {
  id: string;
  fullName: string;
  email: string;
  hashedPassword: string;
  invitedByAdminId: string;
  invitedByAdminType: string;
}): Promise<void> {
  logger.info({ email: data.email }, "Repository: createManager");
  await pool.execute<ResultSetHeader>(
    `INSERT INTO ManagementUsers
       (Id, FullName, Email, Password, IsActive, DefaultPasswordChanged, DateInvited, InvitedByAdminId, InvitedByAdminType, DateCreated)
     VALUES (?, ?, ?, ?, 1, 0, NOW(6), ?, ?, NOW(6))`,
    [
      data.id,
      data.fullName,
      data.email,
      data.hashedPassword,
      data.invitedByAdminId,
      data.invitedByAdminType,
    ],
  );
}

export async function createManagerCooperativeLink(data: {
  id: string;
  managerId: string;
  cooperativeId: string;
  role: string;
  isDefault: boolean;
}): Promise<void> {
  logger.info(
    {
      managerId: data.managerId,
      cooperativeId: data.cooperativeId,
      role: data.role,
    },
    "Repository: createManagerCooperativeLink",
  );
  await pool.execute<ResultSetHeader>(
    `INSERT INTO ManagementUsersCooperatives (Id, ManagerId, CooperativeId, Role, IsDefault, DateCreated)
     VALUES (?, ?, ?, ?, ?, NOW(6))`,
    [
      data.id,
      data.managerId,
      data.cooperativeId,
      data.role,
      data.isDefault ? 1 : 0,
    ],
  );
}

export async function insertManagerPermissions(
  managerId: string,
  cooperativeId: string,
  permissionKeys: string[],
): Promise<void> {
  logger.info(
    { managerId, cooperativeId, count: permissionKeys.length },
    "Repository: insertManagerPermissions",
  );
  const { v4: uuidv4 } = require("uuid");
  for (const key of permissionKeys) {
    const id = uuidv4();
    await pool.execute(
      "INSERT INTO ManagementUserPermissions (Id, ManagerId, CooperativeId, PermissionKey, DateCreated) VALUES (?, ?, ?, ?, NOW(6))",
      [id, managerId, cooperativeId, key],
    );
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listManagersForCooperative(
  cooperativeId: string,
  page: number,
  pageSize: number,
): Promise<(ManagementUserRow & ManagementUsersCooperativesRow)[]> {
  logger.info(
    { cooperativeId, page, pageSize },
    "Repository: listManagersForCooperative",
  );
  const offset = (page - 1) * pageSize;
  const [rows] = await pool.execute<
    (ManagementUserRow & ManagementUsersCooperativesRow)[]
  >(
    `SELECT mu.Id, mu.FullName, mu.Email, mu.IsActive, mu.DefaultPasswordChanged, mu.DateInvited, mu.DateCreated,
            muc.Role, muc.IsDefault, muc.Id AS LinkId
     FROM ManagementUsersCooperatives muc
     JOIN ManagementUsers mu ON mu.Id = muc.ManagerId
     WHERE muc.CooperativeId = ? AND muc.DateDeleted IS NULL AND mu.DateDeleted IS NULL
     ORDER BY muc.DateCreated DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    [cooperativeId],
  );
  return rows;
}

export async function countManagersForCooperative(
  cooperativeId: string,
): Promise<number> {
  logger.info({ cooperativeId }, "Repository: countManagersForCooperative");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM ManagementUsersCooperatives muc
     JOIN ManagementUsers mu ON mu.Id = muc.ManagerId
     WHERE muc.CooperativeId = ? AND muc.DateDeleted IS NULL AND mu.DateDeleted IS NULL`,
    [cooperativeId],
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function getManagerPermissions(
  managerId: string,
  cooperativeId: string,
): Promise<string[]> {
  logger.info(
    { managerId, cooperativeId },
    "Repository: getManagerPermissions",
  );
  const [rows] = await pool.execute<ManagementUserPermissionRow[]>(
    "SELECT PermissionKey FROM ManagementUserPermissions WHERE ManagerId = ? AND CooperativeId = ? AND DateDeleted IS NULL",
    [managerId, cooperativeId],
  );
  return rows.map((r) => r.PermissionKey);
}

export async function replaceManagerPermissions(
  managerId: string,
  cooperativeId: string,
  permissionKeys: string[],
): Promise<void> {
  logger.info(
    { managerId, cooperativeId, count: permissionKeys.length },
    "Repository: replaceManagerPermissions",
  );
  await pool.execute(
    "DELETE FROM ManagementUserPermissions WHERE ManagerId = ? AND CooperativeId = ?",
    [managerId, cooperativeId],
  );
  await insertManagerPermissions(managerId, cooperativeId, permissionKeys);
}

// ─── Status updates ───────────────────────────────────────────────────────────

export async function softDeleteManagerCooperativeLink(
  managerId: string,
  cooperativeId: string,
): Promise<void> {
  logger.info(
    { managerId, cooperativeId },
    "Repository: softDeleteManagerCooperativeLink",
  );
  await pool.execute(
    "UPDATE ManagementUsersCooperatives SET DateDeleted = NOW(6), DateUpdated = NOW(6) WHERE ManagerId = ? AND CooperativeId = ? AND DateDeleted IS NULL",
    [managerId, cooperativeId],
  );
}

export async function updateManagerCooperativeRole(
  managerId: string,
  cooperativeId: string,
  role: string,
): Promise<void> {
  logger.info(
    { managerId, cooperativeId, role },
    "Repository: updateManagerCooperativeRole",
  );
  await pool.execute(
    "UPDATE ManagementUsersCooperatives SET Role = ?, DateUpdated = NOW(6) WHERE ManagerId = ? AND CooperativeId = ? AND DateDeleted IS NULL",
    [role, managerId, cooperativeId],
  );
}
