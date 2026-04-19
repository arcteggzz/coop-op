import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export interface MemberUserRow extends RowDataPacket {
  Id: string;
  FirstName: string;
  LastName: string;
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

export interface MemberUsersCooperativesRow extends RowDataPacket {
  Id: string;
  MemberId: string;
  CooperativeId: string;
  IsDefault: number;
  DateCreated: Date;
  DateUpdated: Date | null;
  DateDeleted: Date | null;
}

// ─── Lookups ──────────────────────────────────────────────────────────────────

export async function findMemberByEmail(email: string): Promise<MemberUserRow | null> {
  logger.info({ email }, 'Repository: findMemberByEmail');
  const [rows] = await pool.execute<MemberUserRow[]>(
    'SELECT * FROM MemberUsers WHERE Email = ? AND DateDeleted IS NULL',
    [email],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findMemberById(id: string): Promise<MemberUserRow | null> {
  logger.info({ memberId: id }, 'Repository: findMemberById');
  const [rows] = await pool.execute<MemberUserRow[]>(
    'SELECT * FROM MemberUsers WHERE Id = ? AND DateDeleted IS NULL',
    [id],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findMemberByIdAndCooperativeId(
  memberId: string,
  cooperativeId: string,
): Promise<MemberUserRow | null> {
  logger.info({ memberId, cooperativeId }, 'Repository: findMemberByIdAndCooperativeId');
  const [rows] = await pool.execute<MemberUserRow[]>(
    `SELECT mu.* FROM MemberUsers mu
     JOIN MemberUsersCooperatives muc ON muc.MemberId = mu.Id
     WHERE mu.Id = ? AND muc.CooperativeId = ? AND mu.DateDeleted IS NULL AND muc.DateDeleted IS NULL`,
    [memberId, cooperativeId],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findMemberCooperativeLink(
  memberId: string,
  cooperativeId: string,
): Promise<MemberUsersCooperativesRow | null> {
  logger.info({ memberId, cooperativeId }, 'Repository: findMemberCooperativeLink');
  const [rows] = await pool.execute<MemberUsersCooperativesRow[]>(
    'SELECT * FROM MemberUsersCooperatives WHERE MemberId = ? AND CooperativeId = ? AND DateDeleted IS NULL',
    [memberId, cooperativeId],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function countMemberCooperatives(memberId: string): Promise<number> {
  logger.info({ memberId }, 'Repository: countMemberCooperatives');
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM MemberUsersCooperatives WHERE MemberId = ? AND DateDeleted IS NULL',
    [memberId],
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createMember(data: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  hashedPassword: string;
  invitedByAdminId: string;
  invitedByAdminType: string;
}): Promise<void> {
  logger.info({ email: data.email }, 'Repository: createMember');
  await pool.execute<ResultSetHeader>(
    `INSERT INTO MemberUsers
       (Id, FirstName, LastName, Email, Password, IsActive, DefaultPasswordChanged, DateInvited, InvitedByAdminId, InvitedByAdminType, DateCreated)
     VALUES (?, ?, ?, ?, ?, 1, 0, NOW(6), ?, ?, NOW(6))`,
    [data.id, data.firstName, data.lastName, data.email, data.hashedPassword, data.invitedByAdminId, data.invitedByAdminType],
  );
}

export async function createMemberCooperativeLink(data: {
  id: string;
  memberId: string;
  cooperativeId: string;
  isDefault: boolean;
}): Promise<void> {
  logger.info({ memberId: data.memberId, cooperativeId: data.cooperativeId }, 'Repository: createMemberCooperativeLink');
  await pool.execute<ResultSetHeader>(
    `INSERT INTO MemberUsersCooperatives (Id, MemberId, CooperativeId, IsDefault, DateCreated)
     VALUES (?, ?, ?, ?, NOW(6))`,
    [data.id, data.memberId, data.cooperativeId, data.isDefault ? 1 : 0],
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listMembersForCooperative(
  cooperativeId: string,
  page: number,
  pageSize: number,
): Promise<MemberUserRow[]> {
  logger.info({ cooperativeId, page, pageSize }, 'Repository: listMembersForCooperative');
  const offset = (page - 1) * pageSize;
  const [rows] = await pool.execute<MemberUserRow[]>(
    `SELECT mu.Id, mu.FirstName, mu.LastName, mu.Email, mu.IsActive, mu.DefaultPasswordChanged, mu.DateInvited, mu.DateCreated
     FROM MemberUsersCooperatives muc
     JOIN MemberUsers mu ON mu.Id = muc.MemberId
     WHERE muc.CooperativeId = ? AND muc.DateDeleted IS NULL AND mu.DateDeleted IS NULL
     ORDER BY muc.DateCreated DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    [cooperativeId],
  );
  return rows;
}

export async function countMembersForCooperative(cooperativeId: string): Promise<number> {
  logger.info({ cooperativeId }, 'Repository: countMembersForCooperative');
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM MemberUsersCooperatives muc
     JOIN MemberUsers mu ON mu.Id = muc.MemberId
     WHERE muc.CooperativeId = ? AND muc.DateDeleted IS NULL AND mu.DateDeleted IS NULL`,
    [cooperativeId],
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

// ─── Status updates ───────────────────────────────────────────────────────────

export async function softDeleteMemberCooperativeLink(
  memberId: string,
  cooperativeId: string,
): Promise<void> {
  logger.info({ memberId, cooperativeId }, 'Repository: softDeleteMemberCooperativeLink');
  await pool.execute(
    'UPDATE MemberUsersCooperatives SET DateDeleted = NOW(6), DateUpdated = NOW(6) WHERE MemberId = ? AND CooperativeId = ? AND DateDeleted IS NULL',
    [memberId, cooperativeId],
  );
}
