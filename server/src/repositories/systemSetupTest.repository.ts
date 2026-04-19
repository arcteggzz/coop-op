import { pool } from '../config/database';
import { Note } from '../models/note';
import { ResultSetHeader } from 'mysql2';
import { logger } from '../utils/logger';

export async function getAllNotes(): Promise<Note[]> {
  logger.info('Repository: fetching all notes');
  const [rows] = await pool.execute<Note[] & import('mysql2').RowDataPacket[]>(
    'SELECT * FROM Notes WHERE DateDeleted IS NULL ORDER BY DateCreated DESC',
  );
  return rows;
}

export async function getNoteById(id: number): Promise<Note | null> {
  logger.info({ id }, 'Repository: fetching single note');
  const [rows] = await pool.execute<Note[] & import('mysql2').RowDataPacket[]>(
    'SELECT * FROM Notes WHERE Id = ? AND DateDeleted IS NULL',
    [id],
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createNote(title: string, content: string): Promise<Note> {
  logger.info({ title }, 'Repository: creating note');
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO Notes (Title, Content, IsCompleted, DateCreated) VALUES (?, ?, 0, NOW(6))',
    [title, content],
  );
  const insertedId = result.insertId;
  const note = await getNoteById(insertedId);
  return note!;
}

export async function markNoteCompleted(id: number): Promise<void> {
  logger.info({ id }, 'Repository: marking note as completed');
  await pool.execute(
    'UPDATE Notes SET IsCompleted = 1, DateUpdated = NOW(6) WHERE Id = ?',
    [id],
  );
}
