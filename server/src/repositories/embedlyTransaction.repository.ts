import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { RowDataPacket } from 'mysql2';

export interface EmbedlyTransaction {
  Id: string;
  SenderWalletAccount: string;
  ReceiverAccount: string;
  Amount: number;
  TransactionReference: string;
  IsSuccessful: boolean;
  TransactionType: string;
  DateCreated: Date;
  DateUpdated: Date | null;
  DateDeleted: Date | null;
}

export async function saveEmbedlyTransaction(
  senderWalletAccount: string,
  receiverAccount: string,
  amount: number,
  transactionReference: string,
  isSuccessful: boolean,
  transactionType: 'WalletToWallet' | 'Payout',
): Promise<EmbedlyTransaction> {
  const id = uuidv4();
  logger.info(
    { id, senderWalletAccount, receiverAccount, amount, transactionType },
    'Repository: saveEmbedlyTransaction',
  );
  await pool.execute(
    `INSERT INTO EmbedlyTransactions
       (Id, SenderWalletAccount, ReceiverAccount, Amount, TransactionReference, IsSuccessful, TransactionType, DateCreated)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(6))`,
    [id, senderWalletAccount, receiverAccount, amount, transactionReference, isSuccessful ? 1 : 0, transactionType],
  );
  const [rows] = await pool.execute<EmbedlyTransaction[] & RowDataPacket[]>(
    'SELECT * FROM EmbedlyTransactions WHERE Id = ?',
    [id],
  );
  return rows[0];
}
