import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

// ─── Row interfaces ───────────────────────────────────────────────────────────

export interface LevyRow extends RowDataPacket {
  Id: string;
  CooperativeId: string;
  Name: string;
  Description: string | null;
  DefaultAmount: number;
  LevyAccountNumber: string;
  DueDate: string;
  IsActive: number;
  CreatedById: string;
  CreatedByType: string;
  CreatedByName?: string | null;
  AssignedCount?: number;
  DateCreated: Date;
  DateUpdated: Date | null;
  DateDeleted: Date | null;
}

export interface LevyWithCoopRow extends LevyRow {
  CooperativeName: string;
}

export interface LevyAssignmentRow extends RowDataPacket {
  Id: string;
  LevyId: string;
  MemberId: string;
  CooperativeId: string;
  Amount: number;
  LevyAccountNumber: string | null;
  Status: "Pending" | "Paid" | "Waived";
  PaidDate: Date | null;
  PaidAmount: number | null;
  Notes: string | null;
  RecordedById: string | null;
  RecordedByType: string | null;
  DateCreated: Date;
  DateUpdated: Date | null;
}

export interface LevyAssignmentListRow extends LevyAssignmentRow {
  MemberFullName: string;
  LevyName: string;
  LevyDueDate: string;
}

export interface LevySummaryRow extends RowDataPacket {
  total: number;
  paid: number;
  pending: number;
  waived: number;
  totalExpected: number;
  totalCollected: number;
}

export interface ActiveMemberRow extends RowDataPacket {
  Id: string;
}

export interface EmbedlyWalletAccountRow extends RowDataPacket {
  Id: string;
  OwnerId: string;
  CooperativeId: string;
  AccountNumber: string;
  WalletType: string;
  WalletName: string | null;
}

// ─── EmbedlyWallets lookup ────────────────────────────────────────────────────

export async function findEmbedlyWalletByAccountNumber(
  accountNumber: string,
): Promise<EmbedlyWalletAccountRow | null> {
  logger.info(
    { accountNumber },
    "Repository: findEmbedlyWalletByAccountNumber (levies)",
  );
  const [rows] = await pool.execute<EmbedlyWalletAccountRow[]>(
    "SELECT Id, OwnerId, CooperativeId, AccountNumber, WalletType, WalletName FROM EmbedlyWallets WHERE AccountNumber = ? LIMIT 1",
    [accountNumber],
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── Levies: create ───────────────────────────────────────────────────────────

export async function createLevy(data: {
  id: string;
  cooperativeId: string;
  name: string;
  description: string | null;
  defaultAmount: number;
  levyAccountNumber: string;
  dueDate: string;
  createdById: string;
  createdByType: string;
}): Promise<void> {
  logger.info(
    { cooperativeId: data.cooperativeId, name: data.name },
    "Repository: createLevy",
  );
  await pool.execute<ResultSetHeader>(
    `INSERT INTO Levies
       (Id, CooperativeId, Name, Description, DefaultAmount, LevyAccountNumber, DueDate, IsActive, CreatedById, CreatedByType, DateCreated)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW(6))`,
    [
      data.id,
      data.cooperativeId,
      data.name,
      data.description ?? null,
      data.defaultAmount,
      data.levyAccountNumber,
      data.dueDate,
      data.createdById,
      data.createdByType,
    ],
  );
}

// ─── Levies: find one ─────────────────────────────────────────────────────────

export async function findLevyById(
  levyId: string,
): Promise<LevyRow | null> {
  logger.info({ levyId }, "Repository: findLevyById");
  const [rows] = await pool.execute<LevyRow[]>(
    `SELECT l.*,
            COALESCE(au.FullName, mu.FullName) AS CreatedByName
     FROM Levies l
     LEFT JOIN AdminUsers au ON l.CreatedByType = 'Admin' AND au.Id = l.CreatedById AND au.DateDeleted IS NULL
     LEFT JOIN ManagementUsers mu ON l.CreatedByType = 'Manager' AND mu.Id = l.CreatedById AND mu.DateDeleted IS NULL
     WHERE l.Id = ? AND l.DateDeleted IS NULL`,
    [levyId],
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── Levies: list (coop-scoped) ───────────────────────────────────────────────

export async function listLevies(
  cooperativeId: string,
  page: number,
  pageSize: number,
  isActive?: boolean,
): Promise<LevyRow[]> {
  logger.info(
    { cooperativeId, page, pageSize, isActive },
    "Repository: listLevies",
  );
  const offset = (page - 1) * pageSize;
  const conditions: string[] = ["l.CooperativeId = ?", "l.DateDeleted IS NULL"];
  const params: (string | number | null)[] = [cooperativeId];

  if (isActive !== undefined) {
    conditions.push("l.IsActive = ?");
    params.push(isActive ? 1 : 0);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<LevyRow[]>(
    `SELECT l.*,
            COALESCE(au.FullName, mu.FullName) AS CreatedByName,
            COUNT(la.Id) AS AssignedCount
     FROM Levies l
     LEFT JOIN AdminUsers au ON l.CreatedByType = 'Admin' AND au.Id = l.CreatedById AND au.DateDeleted IS NULL
     LEFT JOIN ManagementUsers mu ON l.CreatedByType = 'Manager' AND mu.Id = l.CreatedById AND mu.DateDeleted IS NULL
     LEFT JOIN LevyAssignments la ON la.LevyId = l.Id
     WHERE ${where}
     GROUP BY l.Id
     ORDER BY l.DateCreated DESC LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );
  return rows;
}

export async function countLevies(
  cooperativeId: string,
  isActive?: boolean,
): Promise<number> {
  logger.info({ cooperativeId, isActive }, "Repository: countLevies");
  const conditions: string[] = ["CooperativeId = ?", "DateDeleted IS NULL"];
  const params: (string | number | null)[] = [cooperativeId];

  if (isActive !== undefined) {
    conditions.push("IsActive = ?");
    params.push(isActive ? 1 : 0);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM Levies WHERE ${where}`,
    params,
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

// ─── Levies: list all (admin global overview) ─────────────────────────────────

export async function listAllLevies(
  filters: { isActive?: boolean; cooperativeId?: string },
  page: number,
  pageSize: number,
): Promise<LevyWithCoopRow[]> {
  logger.info({ filters, page, pageSize }, "Repository: listAllLevies");
  const offset = (page - 1) * pageSize;
  const conditions: string[] = ["l.DateDeleted IS NULL"];
  const params: (string | number | null)[] = [];

  if (filters.isActive !== undefined) {
    conditions.push("l.IsActive = ?");
    params.push(filters.isActive ? 1 : 0);
  }
  if (filters.cooperativeId) {
    conditions.push("l.CooperativeId = ?");
    params.push(filters.cooperativeId);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<LevyWithCoopRow[]>(
    `SELECT l.*, c.Name AS CooperativeName,
            COALESCE(au.FullName, mu.FullName) AS CreatedByName,
            COUNT(la.Id) AS AssignedCount
     FROM Levies l
     JOIN Cooperatives c ON c.Id = l.CooperativeId
     LEFT JOIN AdminUsers au ON l.CreatedByType = 'Admin' AND au.Id = l.CreatedById AND au.DateDeleted IS NULL
     LEFT JOIN ManagementUsers mu ON l.CreatedByType = 'Manager' AND mu.Id = l.CreatedById AND mu.DateDeleted IS NULL
     LEFT JOIN LevyAssignments la ON la.LevyId = l.Id
     WHERE ${where}
     GROUP BY l.Id
     ORDER BY l.DateCreated DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );
  return rows;
}

export async function countAllLevies(filters: {
  isActive?: boolean;
  cooperativeId?: string;
}): Promise<number> {
  logger.info({ filters }, "Repository: countAllLevies");
  const conditions: string[] = ["l.DateDeleted IS NULL"];
  const params: (string | number | null)[] = [];

  if (filters.isActive !== undefined) {
    conditions.push("l.IsActive = ?");
    params.push(filters.isActive ? 1 : 0);
  }
  if (filters.cooperativeId) {
    conditions.push("l.CooperativeId = ?");
    params.push(filters.cooperativeId);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM Levies l WHERE ${where}`,
    params,
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

// ─── Levies: update ───────────────────────────────────────────────────────────

export async function updateLevy(
  levyId: string,
  fields: {
    name?: string;
    description?: string | null;
    defaultAmount?: number;
    levyAccountNumber?: string;
    dueDate?: string;
    isActive?: boolean;
  },
): Promise<void> {
  logger.info({ levyId, fields }, "Repository: updateLevy");
  const sets: string[] = [];
  const params: (string | number | null)[] = [];

  if (fields.name !== undefined) {
    sets.push("Name = ?");
    params.push(fields.name);
  }
  if (fields.description !== undefined) {
    sets.push("Description = ?");
    params.push(fields.description);
  }
  if (fields.defaultAmount !== undefined) {
    sets.push("DefaultAmount = ?");
    params.push(fields.defaultAmount);
  }
  if (fields.levyAccountNumber !== undefined) {
    sets.push("LevyAccountNumber = ?");
    params.push(fields.levyAccountNumber);
  }
  if (fields.dueDate !== undefined) {
    sets.push("DueDate = ?");
    params.push(fields.dueDate);
  }
  if (fields.isActive !== undefined) {
    sets.push("IsActive = ?");
    params.push(fields.isActive ? 1 : 0);
  }

  if (sets.length === 0) return;

  sets.push("DateUpdated = NOW(6)");
  params.push(levyId);

  await pool.execute(
    `UPDATE Levies SET ${sets.join(", ")} WHERE Id = ?`,
    params,
  );
}

// ─── Levies: soft delete ──────────────────────────────────────────────────────

export async function softDeleteLevy(levyId: string): Promise<void> {
  logger.info({ levyId }, "Repository: softDeleteLevy");
  await pool.execute(
    "UPDATE Levies SET DateDeleted = NOW(6), IsActive = 0, DateUpdated = NOW(6) WHERE Id = ?",
    [levyId],
  );
}

// ─── Levies: summary aggregate ────────────────────────────────────────────────

export async function getLevySummary(
  levyId: string,
): Promise<LevySummaryRow | null> {
  logger.info({ levyId }, "Repository: getLevySummary");
  const [rows] = await pool.execute<LevySummaryRow[]>(
    `SELECT
       COUNT(*) AS total,
       COUNT(CASE WHEN Status = 'Paid' THEN 1 END) AS paid,
       COUNT(CASE WHEN Status = 'Pending' THEN 1 END) AS pending,
       COUNT(CASE WHEN Status = 'Waived' THEN 1 END) AS waived,
       COALESCE(SUM(Amount), 0) AS totalExpected,
       COALESCE(SUM(CASE WHEN Status = 'Paid' THEN COALESCE(PaidAmount, Amount) ELSE 0 END), 0) AS totalCollected
     FROM LevyAssignments
     WHERE LevyId = ?`,
    [levyId],
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── LevyAssignments: find existing (for skip-dedup) ─────────────────────────

export async function findExistingAssignments(
  levyId: string,
  memberIds: string[],
): Promise<{ MemberId: string }[]> {
  if (memberIds.length === 0) return [];
  logger.info(
    { levyId, count: memberIds.length },
    "Repository: findExistingAssignments",
  );
  const placeholders = memberIds.map(() => "?").join(", ");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT MemberId FROM LevyAssignments WHERE LevyId = ? AND MemberId IN (${placeholders})`,
    [levyId, ...memberIds],
  );
  return rows as { MemberId: string }[];
}

// ─── LevyAssignments: bulk insert ────────────────────────────────────────────

export async function bulkInsertLevyAssignments(
  rows: {
    id: string;
    levyId: string;
    memberId: string;
    cooperativeId: string;
    amount: number;
    levyAccountNumber: string;
  }[],
): Promise<void> {
  if (rows.length === 0) return;
  logger.info({ count: rows.length }, "Repository: bulkInsertLevyAssignments");

  const placeholders = rows
    .map(() => "(?, ?, ?, ?, ?, ?, NOW(6))")
    .join(", ");
  const values: (string | number | null)[] = [];
  for (const r of rows) {
    values.push(
      r.id,
      r.levyId,
      r.memberId,
      r.cooperativeId,
      r.amount,
      r.levyAccountNumber,
    );
  }

  await pool.execute<ResultSetHeader>(
    `INSERT INTO LevyAssignments (Id, LevyId, MemberId, CooperativeId, Amount, LevyAccountNumber, DateCreated)
     VALUES ${placeholders}`,
    values,
  );
}

// ─── LevyAssignments: find one ────────────────────────────────────────────────

export async function findAssignmentById(
  assignmentId: string,
): Promise<LevyAssignmentListRow | null> {
  logger.info({ assignmentId }, "Repository: findAssignmentById");
  const [rows] = await pool.execute<LevyAssignmentListRow[]>(
    `SELECT la.*,
            CONCAT(mu.FirstName, ' ', mu.LastName) AS MemberFullName,
            l.Name AS LevyName,
            l.DueDate AS LevyDueDate
     FROM LevyAssignments la
     JOIN MemberUsers mu ON mu.Id = la.MemberId
     JOIN Levies l ON l.Id = la.LevyId
     WHERE la.Id = ?`,
    [assignmentId],
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── LevyAssignments: list (levy-scoped) ──────────────────────────────────────

export async function listLevyAssignments(
  levyId: string,
  cooperativeId: string,
  page: number,
  pageSize: number,
  status?: string,
): Promise<LevyAssignmentListRow[]> {
  logger.info(
    { levyId, cooperativeId, page, pageSize, status },
    "Repository: listLevyAssignments",
  );
  const offset = (page - 1) * pageSize;
  const conditions: string[] = [
    "la.LevyId = ?",
    "la.CooperativeId = ?",
  ];
  const params: (string | number | null)[] = [levyId, cooperativeId];

  if (status) {
    conditions.push("la.Status = ?");
    params.push(status);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<LevyAssignmentListRow[]>(
    `SELECT la.*,
            CONCAT(mu.FirstName, ' ', mu.LastName) AS MemberFullName,
            l.Name AS LevyName,
            l.DueDate AS LevyDueDate
     FROM LevyAssignments la
     JOIN MemberUsers mu ON mu.Id = la.MemberId
     JOIN Levies l ON l.Id = la.LevyId
     WHERE ${where}
     ORDER BY la.DateCreated DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );
  return rows;
}

export async function countLevyAssignments(
  levyId: string,
  cooperativeId: string,
  status?: string,
): Promise<number> {
  logger.info(
    { levyId, cooperativeId, status },
    "Repository: countLevyAssignments",
  );
  const conditions: string[] = ["LevyId = ?", "CooperativeId = ?"];
  const params: (string | number | null)[] = [levyId, cooperativeId];

  if (status) {
    conditions.push("Status = ?");
    params.push(status);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM LevyAssignments WHERE ${where}`,
    params,
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

// ─── LevyAssignments: update ──────────────────────────────────────────────────

export async function updateLevyAssignment(
  assignmentId: string,
  fields: {
    status?: string;
    paidDate?: string;
    paidAmount?: number | null;
    notes?: string | null;
    recordedById?: string | null;
    recordedByType?: string | null;
  },
): Promise<void> {
  logger.info({ assignmentId, fields }, "Repository: updateLevyAssignment");
  const sets: string[] = [];
  const params: (string | number | null)[] = [];

  if (fields.status !== undefined) {
    sets.push("Status = ?");
    params.push(fields.status);
  }
  if (fields.paidDate !== undefined) {
    sets.push("PaidDate = ?");
    params.push(
      fields.paidDate.replace("T", " ").replace("Z", "").split(".")[0],
    );
  }
  if (fields.paidAmount !== undefined) {
    sets.push("PaidAmount = ?");
    params.push(fields.paidAmount);
  }
  if (fields.notes !== undefined) {
    sets.push("Notes = ?");
    params.push(fields.notes);
  }
  if (fields.recordedById !== undefined) {
    sets.push("RecordedById = ?");
    params.push(fields.recordedById);
  }
  if (fields.recordedByType !== undefined) {
    sets.push("RecordedByType = ?");
    params.push(fields.recordedByType);
  }

  if (sets.length === 0) return;
  sets.push("DateUpdated = NOW(6)");
  params.push(assignmentId);

  await pool.execute(
    `UPDATE LevyAssignments SET ${sets.join(", ")} WHERE Id = ?`,
    params,
  );
}

// ─── LevyAssignments: member-scoped queries ───────────────────────────────────

export async function listMemberAssignments(
  memberId: string,
  cooperativeId: string,
  page: number,
  pageSize: number,
  status?: string,
): Promise<LevyAssignmentListRow[]> {
  logger.info(
    { memberId, cooperativeId, page, pageSize, status },
    "Repository: listMemberAssignments",
  );
  const offset = (page - 1) * pageSize;
  const conditions: string[] = ["la.MemberId = ?", "la.CooperativeId = ?"];
  const params: (string | number | null)[] = [memberId, cooperativeId];

  if (status) {
    conditions.push("la.Status = ?");
    params.push(status);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<LevyAssignmentListRow[]>(
    `SELECT la.*,
            CONCAT(mu.FirstName, ' ', mu.LastName) AS MemberFullName,
            l.Name AS LevyName,
            l.DueDate AS LevyDueDate
     FROM LevyAssignments la
     JOIN MemberUsers mu ON mu.Id = la.MemberId
     JOIN Levies l ON l.Id = la.LevyId
     WHERE ${where}
     ORDER BY l.DueDate ASC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );
  return rows;
}

export async function countMemberAssignments(
  memberId: string,
  cooperativeId: string,
  status?: string,
): Promise<number> {
  logger.info(
    { memberId, cooperativeId, status },
    "Repository: countMemberAssignments",
  );
  const conditions: string[] = ["MemberId = ?", "CooperativeId = ?"];
  const params: (string | number | null)[] = [memberId, cooperativeId];

  if (status) {
    conditions.push("Status = ?");
    params.push(status);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM LevyAssignments WHERE ${where}`,
    params,
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

export async function findMemberAssignment(
  assignmentId: string,
  memberId: string,
  cooperativeId: string,
): Promise<LevyAssignmentListRow | null> {
  logger.info(
    { assignmentId, memberId, cooperativeId },
    "Repository: findMemberAssignment",
  );
  const [rows] = await pool.execute<LevyAssignmentListRow[]>(
    `SELECT la.*,
            CONCAT(mu.FirstName, ' ', mu.LastName) AS MemberFullName,
            l.Name AS LevyName,
            l.DueDate AS LevyDueDate
     FROM LevyAssignments la
     JOIN MemberUsers mu ON mu.Id = la.MemberId
     JOIN Levies l ON l.Id = la.LevyId
     WHERE la.Id = ? AND la.MemberId = ? AND la.CooperativeId = ?`,
    [assignmentId, memberId, cooperativeId],
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── Active members helper (reused from dues pattern) ─────────────────────────

export async function fetchActiveMembersForCooperative(
  cooperativeId: string,
): Promise<ActiveMemberRow[]> {
  logger.info(
    { cooperativeId },
    "Repository: fetchActiveMembersForCooperative (levies)",
  );
  const [rows] = await pool.execute<ActiveMemberRow[]>(
    `SELECT mu.Id
     FROM MemberUsersCooperatives muc
     JOIN MemberUsers mu ON mu.Id = muc.MemberId
     WHERE muc.CooperativeId = ? AND muc.DateDeleted IS NULL AND mu.IsActive = 1 AND mu.DateDeleted IS NULL`,
    [cooperativeId],
  );
  return rows;
}

// ─── Validate member belongs to cooperative ───────────────────────────────────

export async function findMemberInCooperative(
  memberId: string,
  cooperativeId: string,
): Promise<{ MemberId: string } | null> {
  logger.info(
    { memberId, cooperativeId },
    "Repository: findMemberInCooperative (levies)",
  );
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT muc.MemberId
     FROM MemberUsersCooperatives muc
     JOIN MemberUsers mu ON mu.Id = muc.MemberId
     WHERE muc.MemberId = ? AND muc.CooperativeId = ? AND muc.DateDeleted IS NULL AND mu.IsActive = 1`,
    [memberId, cooperativeId],
  );
  return rows.length > 0 ? (rows[0] as { MemberId: string }) : null;
}
