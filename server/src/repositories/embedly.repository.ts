import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export interface EmbedlyCustomerRow extends RowDataPacket {
  Id: string;
  CustomerType: string;
  OwnerId: string;
  CooperativeId: string;
  FirstName: string;
  LastName: string;
  CustomerId: string;
  DateCreated: Date;
  DateUpdated: Date | null;
}

export interface EmbedlyWalletRow extends RowDataPacket {
  Id: string;
  WalletType: string;
  OwnerId: string;
  CooperativeId: string;
  CustomerId: string;
  AccountNumber: string;
  WalletId: string;
  WalletName: string | null;
  IsLocalRestricted: number;
  RestrictedBy: string | null;
  DateCreated: Date;
  DateUpdated: Date | null;
}

// ─── EmbedlyCustomers ─────────────────────────────────────────────────────────

export async function createEmbedlyCustomer(
  customerType: string,
  ownerId: string,
  cooperativeId: string,
  firstName: string,
  lastName: string,
  customerId: string,
): Promise<void> {
  logger.info({ customerType, ownerId, cooperativeId }, 'Repository: createEmbedlyCustomer');
  const { v4: uuidv4 } = require('uuid');
  await pool.execute<ResultSetHeader>(
    `INSERT INTO EmbedlyCustomers (Id, CustomerType, OwnerId, CooperativeId, FirstName, LastName, CustomerId, DateCreated)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(6))`,
    [uuidv4(), customerType, ownerId, cooperativeId, firstName, lastName, customerId],
  );
}

// ─── EmbedlyWallets ───────────────────────────────────────────────────────────

export async function findEmbedlyWalletByOwnerAndCooperative(
  ownerId: string,
  cooperativeId: string,
): Promise<EmbedlyWalletRow | null> {
  logger.info({ ownerId, cooperativeId }, 'Repository: findEmbedlyWalletByOwnerAndCooperative');
  const [rows] = await pool.execute<EmbedlyWalletRow[]>(
    'SELECT * FROM EmbedlyWallets WHERE OwnerId = ? AND CooperativeId = ?',
    [ownerId, cooperativeId],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createEmbedlyWallet(
  walletType: string,
  ownerId: string,
  cooperativeId: string,
  customerId: string,
  accountNumber: string,
  walletId: string,
  walletName?: string,
): Promise<void> {
  logger.info({ walletType, ownerId, cooperativeId }, 'Repository: createEmbedlyWallet');
  const { v4: uuidv4 } = require('uuid');
  await pool.execute<ResultSetHeader>(
    `INSERT INTO EmbedlyWallets (Id, WalletType, OwnerId, CooperativeId, CustomerId, AccountNumber, WalletId, WalletName, IsLocalRestricted, DateCreated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(6))`,
    [uuidv4(), walletType, ownerId, cooperativeId, customerId, accountNumber, walletId, walletName ?? null],
  );
}

export async function findEmbedlyWalletByOwnerId(
  ownerId: string,
): Promise<EmbedlyWalletRow | null> {
  logger.info({ ownerId }, 'Repository: findEmbedlyWalletByOwnerId');
  const [rows] = await pool.execute<EmbedlyWalletRow[]>(
    'SELECT * FROM EmbedlyWallets WHERE OwnerId = ? LIMIT 1',
    [ownerId],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function findEmbedlyWalletByOwnerIdAndWalletName(
  ownerId: string,
  walletName: string,
): Promise<EmbedlyWalletRow | null> {
  logger.info({ ownerId, walletName }, 'Repository: findEmbedlyWalletByOwnerIdAndWalletName');
  const [rows] = await pool.execute<EmbedlyWalletRow[]>(
    'SELECT * FROM EmbedlyWallets WHERE OwnerId = ? AND WalletName = ? LIMIT 1',
    [ownerId, walletName],
  );
  return rows.length > 0 ? rows[0] : null;
}
