import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

// ─── Row interfaces ───────────────────────────────────────────────────────────

export interface DueScheduleRow extends RowDataPacket {
  Id: string;
  CooperativeId: string;
  Name: string;
  Description: string | null;
  Amount: number;
  Frequency: "Monthly" | "Quarterly" | "Biannual" | "Annual" | "OneTime";
  StartDate: string;
  EndDate: string | null;
  DueAccountNumber: string;
  IsActive: number;
  CreatedById: string;
  CreatedByType: string;
  CreatedByName?: string | null;
  DateCreated: Date;
  DateUpdated: Date | null;
  DateDeleted: Date | null;
}

export interface DueScheduleWithCoopRow extends DueScheduleRow {
  CooperativeName: string;
}

export interface DuePaymentRow extends RowDataPacket {
  Id: string;
  DueScheduleId: string;
  MemberId: string;
  CooperativeId: string;
  PeriodLabel: string;
  DueDate: string;
  Amount: number;
  DueAccountNumber: string | null;
  MemberAccountNumber: string | null;
  Status: "Pending" | "Paid" | "Waived" | "Overdue";
  PaidDate: Date | null;
  PaidAmount: number | null;
  Notes: string | null;
  RecordedById: string | null;
  RecordedByType: string | null;
  DateCreated: Date;
  DateUpdated: Date | null;
}

export interface DuePaymentListRow extends DuePaymentRow {
  ScheduleName: string;
  MemberFullName: string;
}

export interface ActiveMemberRow extends RowDataPacket {
  Id: string;
}

// ─── EmbedlyWallets lookup (dues-scoped) ──────────────────────────────────────

export interface EmbedlyWalletAccountRow extends RowDataPacket {
  Id: string;
  OwnerId: string;
  CooperativeId: string;
  AccountNumber: string;
  WalletType: string;
  WalletName: string | null;
}

export async function findEmbedlyWalletByAccountNumber(
  accountNumber: string,
): Promise<EmbedlyWalletAccountRow | null> {
  logger.info(
    { accountNumber },
    "Repository: findEmbedlyWalletByAccountNumber",
  );
  const [rows] = await pool.execute<EmbedlyWalletAccountRow[]>(
    "SELECT Id, OwnerId, CooperativeId, AccountNumber, WalletType, WalletName FROM EmbedlyWallets WHERE AccountNumber = ? LIMIT 1",
    [accountNumber],
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── DueSchedules ─────────────────────────────────────────────────────────────

export async function createDueSchedule(data: {
  id: string;
  cooperativeId: string;
  name: string;
  description: string | null;
  amount: number;
  frequency: string;
  startDate: string;
  endDate: string | null;
  dueAccountNumber: string;
  createdById: string;
  createdByType: string;
}): Promise<void> {
  logger.info(
    { cooperativeId: data.cooperativeId, name: data.name },
    "Repository: createDueSchedule",
  );
  await pool.execute<ResultSetHeader>(
    `INSERT INTO DueSchedules
       (Id, CooperativeId, Name, Description, Amount, Frequency, StartDate, EndDate, DueAccountNumber, IsActive, CreatedById, CreatedByType, DateCreated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW(6))`,
    [
      data.id,
      data.cooperativeId,
      data.name,
      data.description ?? null,
      data.amount,
      data.frequency,
      data.startDate,
      data.endDate ?? null,
      data.dueAccountNumber,
      data.createdById,
      data.createdByType,
    ],
  );
}

export async function findDueScheduleById(
  scheduleId: string,
): Promise<DueScheduleRow | null> {
  logger.info({ scheduleId }, "Repository: findDueScheduleById");
  const [rows] = await pool.execute<DueScheduleRow[]>(
    `SELECT ds.*,
            COALESCE(au.FullName, mu.FullName) AS CreatedByName
     FROM DueSchedules ds
     LEFT JOIN AdminUsers au ON ds.CreatedByType = 'Admin' AND au.Id = ds.CreatedById AND au.DateDeleted IS NULL
     LEFT JOIN ManagementUsers mu ON ds.CreatedByType = 'Manager' AND mu.Id = ds.CreatedById AND mu.DateDeleted IS NULL
     WHERE ds.Id = ? AND ds.DateDeleted IS NULL`,
    [scheduleId],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function listDueSchedules(
  cooperativeId: string,
  page: number,
  pageSize: number,
  isActive?: boolean,
): Promise<DueScheduleRow[]> {
  logger.info(
    { cooperativeId, page, pageSize, isActive },
    "Repository: listDueSchedules",
  );
  const offset = (page - 1) * pageSize;
  const conditions: string[] = [
    "ds.CooperativeId = ?",
    "ds.DateDeleted IS NULL",
  ];
  const params: (string | number | null)[] = [cooperativeId];

  if (isActive !== undefined) {
    conditions.push("ds.IsActive = ?");
    params.push(isActive ? 1 : 0);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<DueScheduleRow[]>(
    `SELECT ds.*,
            COALESCE(au.FullName, mu.FullName) AS CreatedByName
     FROM DueSchedules ds
     LEFT JOIN AdminUsers au ON ds.CreatedByType = 'Admin' AND au.Id = ds.CreatedById AND au.DateDeleted IS NULL
     LEFT JOIN ManagementUsers mu ON ds.CreatedByType = 'Manager' AND mu.Id = ds.CreatedById AND mu.DateDeleted IS NULL
     WHERE ${where}
     ORDER BY ds.DateCreated DESC LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );
  return rows;
}

export async function countDueSchedules(
  cooperativeId: string,
  isActive?: boolean,
): Promise<number> {
  logger.info({ cooperativeId, isActive }, "Repository: countDueSchedules");
  const conditions: string[] = ["CooperativeId = ?", "DateDeleted IS NULL"];
  const params: (string | number | null)[] = [cooperativeId];

  if (isActive !== undefined) {
    conditions.push("IsActive = ?");
    params.push(isActive ? 1 : 0);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM DueSchedules WHERE ${where}`,
    params,
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

export async function updateDueSchedule(
  scheduleId: string,
  fields: {
    name?: string;
    description?: string | null;
    amount?: number;
    frequency?: string;
    startDate?: string;
    endDate?: string | null;
    dueAccountNumber?: string;
    isActive?: boolean;
  },
): Promise<void> {
  logger.info({ scheduleId, fields }, "Repository: updateDueSchedule");
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
  if (fields.amount !== undefined) {
    sets.push("Amount = ?");
    params.push(fields.amount);
  }
  if (fields.frequency !== undefined) {
    sets.push("Frequency = ?");
    params.push(fields.frequency);
  }
  if (fields.startDate !== undefined) {
    sets.push("StartDate = ?");
    params.push(fields.startDate);
  }
  if (fields.endDate !== undefined) {
    sets.push("EndDate = ?");
    params.push(fields.endDate);
  }
  if (fields.dueAccountNumber !== undefined) {
    sets.push("DueAccountNumber = ?");
    params.push(fields.dueAccountNumber);
  }
  if (fields.isActive !== undefined) {
    sets.push("IsActive = ?");
    params.push(fields.isActive ? 1 : 0);
  }

  if (sets.length === 0) return;

  sets.push("DateUpdated = NOW(6)");
  params.push(scheduleId);

  await pool.execute(
    `UPDATE DueSchedules SET ${sets.join(", ")} WHERE Id = ?`,
    params,
  );
}

export async function softDeleteDueSchedule(scheduleId: string): Promise<void> {
  logger.info({ scheduleId }, "Repository: softDeleteDueSchedule");
  await pool.execute(
    "UPDATE DueSchedules SET DateDeleted = NOW(6), IsActive = 0, DateUpdated = NOW(6) WHERE Id = ?",
    [scheduleId],
  );
}

// ─── Cross-cooperative listing (admin global view) ────────────────────────────

export async function listAllDueSchedules(
  filters: { isActive?: boolean; cooperativeId?: string },
  page: number,
  pageSize: number,
): Promise<DueScheduleWithCoopRow[]> {
  logger.info({ filters, page, pageSize }, "Repository: listAllDueSchedules");
  const offset = (page - 1) * pageSize;
  const conditions: string[] = ["ds.DateDeleted IS NULL"];
  const params: (string | number | null)[] = [];

  if (filters.isActive !== undefined) {
    conditions.push("ds.IsActive = ?");
    params.push(filters.isActive ? 1 : 0);
  }
  if (filters.cooperativeId) {
    conditions.push("ds.CooperativeId = ?");
    params.push(filters.cooperativeId);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<DueScheduleWithCoopRow[]>(
    `SELECT ds.*, c.Name AS CooperativeName
     FROM DueSchedules ds
     JOIN Cooperatives c ON c.Id = ds.CooperativeId
     WHERE ${where}
     ORDER BY ds.DateCreated DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );
  return rows;
}

export async function countAllDueSchedules(filters: {
  isActive?: boolean;
  cooperativeId?: string;
}): Promise<number> {
  logger.info({ filters }, "Repository: countAllDueSchedules");
  const conditions: string[] = ["ds.DateDeleted IS NULL"];
  const params: (string | number | null)[] = [];

  if (filters.isActive !== undefined) {
    conditions.push("ds.IsActive = ?");
    params.push(filters.isActive ? 1 : 0);
  }
  if (filters.cooperativeId) {
    conditions.push("ds.CooperativeId = ?");
    params.push(filters.cooperativeId);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM DueSchedules ds WHERE ${where}`,
    params,
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

// ─── DuePayments ──────────────────────────────────────────────────────────────

export async function checkPeriodAlreadyIssued(
  scheduleId: string,
  periodLabel: string,
): Promise<boolean> {
  logger.info(
    { scheduleId, periodLabel },
    "Repository: checkPeriodAlreadyIssued",
  );
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM DuePayments WHERE DueScheduleId = ? AND PeriodLabel = ?",
    [scheduleId, periodLabel],
  );
  return (rows[0] as RowDataPacket & { total: number }).total > 0;
}

export async function fetchActiveMembersForCooperative(
  cooperativeId: string,
): Promise<ActiveMemberRow[]> {
  logger.info(
    { cooperativeId },
    "Repository: fetchActiveMembersForCooperative",
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

export async function bulkInsertDuePayments(
  rows: {
    id: string;
    dueScheduleId: string;
    memberId: string;
    cooperativeId: string;
    periodLabel: string;
    dueDate: string;
    amount: number;
    dueAccountNumber: string;
  }[],
): Promise<void> {
  if (rows.length === 0) return;
  logger.info({ count: rows.length }, "Repository: bulkInsertDuePayments");

  const placeholders = rows
    .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, NOW(6))")
    .join(", ");
  const values: (string | number | null)[] = [];
  for (const r of rows) {
    values.push(
      r.id,
      r.dueScheduleId,
      r.memberId,
      r.cooperativeId,
      r.periodLabel,
      r.dueDate,
      r.amount,
      r.dueAccountNumber,
    );
  }

  await pool.execute<ResultSetHeader>(
    `INSERT INTO DuePayments (Id, DueScheduleId, MemberId, CooperativeId, PeriodLabel, DueDate, Amount, DueAccountNumber, DateCreated)
     VALUES ${placeholders}`,
    values,
  );
}

export async function findDuePaymentById(
  paymentId: string,
): Promise<DuePaymentRow | null> {
  logger.info({ paymentId }, "Repository: findDuePaymentById");
  const [rows] = await pool.execute<DuePaymentRow[]>(
    "SELECT * FROM DuePayments WHERE Id = ?",
    [paymentId],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findDuePaymentByIdAndCooperative(
  paymentId: string,
  cooperativeId: string,
): Promise<DuePaymentRow | null> {
  logger.info(
    { paymentId, cooperativeId },
    "Repository: findDuePaymentByIdAndCooperative",
  );
  const [rows] = await pool.execute<DuePaymentRow[]>(
    "SELECT * FROM DuePayments WHERE Id = ? AND CooperativeId = ?",
    [paymentId, cooperativeId],
  );
  return rows.length > 0 ? rows[0] : null;
}

export interface DuePaymentFilters {
  scheduleId?: string;
  memberId?: string;
  periodLabel?: string;
  status?: string;
}

export async function listDuePayments(
  cooperativeId: string,
  filters: DuePaymentFilters,
  page: number,
  pageSize: number,
): Promise<DuePaymentListRow[]> {
  logger.info(
    { cooperativeId, filters, page, pageSize },
    "Repository: listDuePayments",
  );
  const offset = (page - 1) * pageSize;
  const conditions: string[] = ["dp.CooperativeId = ?"];
  const params: (string | number | null)[] = [cooperativeId];

  if (filters.scheduleId) {
    conditions.push("dp.DueScheduleId = ?");
    params.push(filters.scheduleId);
  }
  if (filters.memberId) {
    conditions.push("dp.MemberId = ?");
    params.push(filters.memberId);
  }
  if (filters.periodLabel) {
    conditions.push("dp.PeriodLabel = ?");
    params.push(filters.periodLabel);
  }
  if (filters.status) {
    conditions.push("dp.Status = ?");
    params.push(filters.status);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<DuePaymentListRow[]>(
    `SELECT dp.*,
            ds.Name AS ScheduleName,
            CONCAT(mu.FirstName, ' ', mu.LastName) AS MemberFullName
     FROM DuePayments dp
     JOIN DueSchedules ds ON ds.Id = dp.DueScheduleId
     JOIN MemberUsers mu ON mu.Id = dp.MemberId
     WHERE ${where}
     ORDER BY dp.DateCreated DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );
  return rows;
}

export async function countDuePayments(
  cooperativeId: string,
  filters: DuePaymentFilters,
): Promise<number> {
  logger.info({ cooperativeId, filters }, "Repository: countDuePayments");
  const conditions: string[] = ["dp.CooperativeId = ?"];
  const params: (string | number | null)[] = [cooperativeId];

  if (filters.scheduleId) {
    conditions.push("dp.DueScheduleId = ?");
    params.push(filters.scheduleId);
  }
  if (filters.memberId) {
    conditions.push("dp.MemberId = ?");
    params.push(filters.memberId);
  }
  if (filters.periodLabel) {
    conditions.push("dp.PeriodLabel = ?");
    params.push(filters.periodLabel);
  }
  if (filters.status) {
    conditions.push("dp.Status = ?");
    params.push(filters.status);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM DuePayments dp WHERE ${where}`,
    params,
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

export async function updateDuePayment(
  paymentId: string,
  fields: {
    status?: string;
    paidDate?: string;
    paidAmount?: number | null;
    memberAccountNumber?: string | null;
    notes?: string | null;
    recordedById?: string | null;
    recordedByType?: string | null;
  },
): Promise<void> {
  logger.info({ paymentId, fields }, "Repository: updateDuePayment");
  const sets: string[] = [];
  const params: (string | number | null)[] = [];

  if (fields.status !== undefined) {
    sets.push("Status = ?");
    params.push(fields.status);
  }
  if (fields.paidDate !== undefined) {
    sets.push("PaidDate = ?");
    params.push(fields.paidDate);
  }
  if (fields.paidAmount !== undefined) {
    sets.push("PaidAmount = ?");
    params.push(fields.paidAmount);
  }
  if (fields.memberAccountNumber !== undefined) {
    sets.push("MemberAccountNumber = ?");
    params.push(fields.memberAccountNumber);
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
  params.push(paymentId);

  await pool.execute(
    `UPDATE DuePayments SET ${sets.join(", ")} WHERE Id = ?`,
    params,
  );
}

// ─── Member-scoped payment queries ───────────────────────────────────────────

export interface MemberDuePaymentListRow extends DuePaymentRow {
  ScheduleName: string;
}

export async function listMemberDuePayments(
  memberId: string,
  cooperativeId: string,
  filters: { scheduleId?: string; periodLabel?: string; status?: string },
  page: number,
  pageSize: number,
): Promise<MemberDuePaymentListRow[]> {
  logger.info(
    { memberId, cooperativeId, filters, page, pageSize },
    "Repository: listMemberDuePayments",
  );
  const offset = (page - 1) * pageSize;
  const conditions: string[] = ["dp.MemberId = ?", "dp.CooperativeId = ?"];
  const params: (string | number | null)[] = [memberId, cooperativeId];

  if (filters.scheduleId) {
    conditions.push("dp.DueScheduleId = ?");
    params.push(filters.scheduleId);
  }
  if (filters.periodLabel) {
    conditions.push("dp.PeriodLabel = ?");
    params.push(filters.periodLabel);
  }
  if (filters.status) {
    conditions.push("dp.Status = ?");
    params.push(filters.status);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<MemberDuePaymentListRow[]>(
    `SELECT dp.*, ds.Name AS ScheduleName
     FROM DuePayments dp
     JOIN DueSchedules ds ON ds.Id = dp.DueScheduleId
     WHERE ${where}
     ORDER BY dp.DateCreated DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );
  return rows;
}

export async function countMemberDuePayments(
  memberId: string,
  cooperativeId: string,
  filters: { scheduleId?: string; periodLabel?: string; status?: string },
): Promise<number> {
  logger.info(
    { memberId, cooperativeId, filters },
    "Repository: countMemberDuePayments",
  );
  const conditions: string[] = ["dp.MemberId = ?", "dp.CooperativeId = ?"];
  const params: (string | number | null)[] = [memberId, cooperativeId];

  if (filters.scheduleId) {
    conditions.push("dp.DueScheduleId = ?");
    params.push(filters.scheduleId);
  }
  if (filters.periodLabel) {
    conditions.push("dp.PeriodLabel = ?");
    params.push(filters.periodLabel);
  }
  if (filters.status) {
    conditions.push("dp.Status = ?");
    params.push(filters.status);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM DuePayments dp WHERE ${where}`,
    params,
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

export async function listMemberOutstandingPayments(
  memberId: string,
  cooperativeId: string,
): Promise<MemberDuePaymentListRow[]> {
  logger.info(
    { memberId, cooperativeId },
    "Repository: listMemberOutstandingPayments",
  );
  const [rows] = await pool.execute<MemberDuePaymentListRow[]>(
    `SELECT dp.*, ds.Name AS ScheduleName
     FROM DuePayments dp
     JOIN DueSchedules ds ON ds.Id = dp.DueScheduleId
     WHERE dp.MemberId = ? AND dp.CooperativeId = ? AND dp.Status IN ('Pending', 'Overdue')
     ORDER BY dp.DueDate ASC`,
    [memberId, cooperativeId],
  );
  return rows;
}
