import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

export interface CooperativeRow extends RowDataPacket {
  Id: string;
  Name: string;
  CreatedByAdminId: string;
  CreatedByAdminType: string;
  DateCreated: Date;
  DateUpdated: Date | null;
  DateDeleted: Date | null;
}

export interface CooperativePropertyRow extends RowDataPacket {
  Id: string;
  CooperativeId: string;
  Key: string | null;
  Value: string | null;
  GroupName: string | null;
  IsActive: number;
  CreatedBy: string;
  DateCreated: Date;
  DateUpdated: Date | null;
  DateDeleted: Date | null;
}

// ─── Lookups ──────────────────────────────────────────────────────────────────

export async function findCooperativeByName(
  name: string,
): Promise<CooperativeRow | null> {
  logger.info({ name }, "Repository: findCooperativeByName");
  const [rows] = await pool.execute<CooperativeRow[]>(
    "SELECT * FROM Cooperatives WHERE Name = ? AND DateDeleted IS NULL",
    [name],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findCooperativeById(
  id: string,
): Promise<CooperativeRow | null> {
  logger.info({ cooperativeId: id }, "Repository: findCooperativeById");
  const [rows] = await pool.execute<CooperativeRow[]>(
    "SELECT * FROM Cooperatives WHERE Id = ? AND DateDeleted IS NULL",
    [id],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findCooperativePropertiesById(
  cooperativeId: string,
): Promise<CooperativePropertyRow[]> {
  logger.info({ cooperativeId }, "Repository: findCooperativePropertiesById");
  const [rows] = await pool.execute<CooperativePropertyRow[]>(
    "SELECT * FROM CooperativesProperties WHERE CooperativeId = ? AND DateDeleted IS NULL",
    [cooperativeId],
  );
  return rows;
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listCooperatives(
  filters: { name?: string },
  page: number,
  pageSize: number,
): Promise<CooperativeRow[]> {
  logger.info({ filters, page, pageSize }, "Repository: listCooperatives");
  const conditions: string[] = ["DateDeleted IS NULL"];
  const params: (string | number)[] = [];

  if (filters.name) {
    conditions.push("Name LIKE ?");
    params.push(`%${filters.name}%`);
  }

  const where = conditions.join(" AND ");
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.execute<CooperativeRow[]>(
    `SELECT Id, Name, CreatedByAdminId, CreatedByAdminType, DateCreated, DateUpdated
     FROM Cooperatives WHERE ${where} ORDER BY DateCreated DESC LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );
  return rows;
}

export async function countCooperatives(filters: {
  name?: string;
}): Promise<number> {
  logger.info({ filters }, "Repository: countCooperatives");
  const conditions: string[] = ["DateDeleted IS NULL"];
  const params: (string | number)[] = [];

  if (filters.name) {
    conditions.push("Name LIKE ?");
    params.push(`%${filters.name}%`);
  }

  const where = conditions.join(" AND ");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM Cooperatives WHERE ${where}`,
    params,
  );
  return (rows[0] as RowDataPacket & { total: number }).total;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createCooperative(data: {
  id: string;
  name: string;
  createdByAdminId: string;
  createdByAdminType: string;
}): Promise<void> {
  logger.info({ name: data.name }, "Repository: createCooperative");
  await pool.execute<ResultSetHeader>(
    `INSERT INTO Cooperatives (Id, Name, CreatedByAdminId, CreatedByAdminType, DateCreated)
     VALUES (?, ?, ?, ?, NOW(6))`,
    [data.id, data.name, data.createdByAdminId, data.createdByAdminType],
  );
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateCooperativeName(
  id: string,
  name: string,
): Promise<void> {
  logger.info({ cooperativeId: id, name }, "Repository: updateCooperativeName");
  await pool.execute(
    "UPDATE Cooperatives SET Name = ?, DateUpdated = NOW(6) WHERE Id = ?",
    [name, id],
  );
}

// ─── Soft delete ──────────────────────────────────────────────────────────────

export async function softDeleteCooperative(id: string): Promise<void> {
  logger.info({ cooperativeId: id }, "Repository: softDeleteCooperative");
  await pool.execute(
    "UPDATE Cooperatives SET DateDeleted = NOW(6), DateUpdated = NOW(6) WHERE Id = ?",
    [id],
  );
}
