import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export interface AuthMemberRequest extends Request {
  memberUser: { id: string; email: string };
}

interface MemberJwtPayload {
  sub: string;
  type: string;
  email: string;
}

export function requireMemberAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.jwt.secret) as MemberJwtPayload;

    if (payload.type !== 'member') {
      throw new UnauthorizedError('Invalid token type');
    }

    (req as AuthMemberRequest).memberUser = { id: payload.sub, email: payload.email };
    logger.info({ memberId: payload.sub }, 'Member auth verified');
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}

// Validates that the calling member belongs to cooperativeId (from params or query).
export async function requireMemberCooperativeAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id: memberId } = (req as AuthMemberRequest).memberUser;
    const cooperativeId = (req.params.cooperativeId || req.query.cooperativeId) as string;

    if (!cooperativeId) {
      throw new ForbiddenError('cooperativeId is required', 'COOPERATIVE_ID_REQUIRED');
    }

    const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
      'SELECT Id FROM MemberUsersCooperatives WHERE MemberId = ? AND CooperativeId = ? AND DateDeleted IS NULL',
      [memberId, cooperativeId],
    );

    if (rows.length === 0) {
      throw new ForbiddenError(
        'You are not a member of this cooperative',
        'NOT_A_MEMBER_OF_THIS_COOPERATIVE',
      );
    }

    logger.info({ memberId, cooperativeId }, 'Member cooperative access verified');
    next();
  } catch (err) {
    next(err);
  }
}
