import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { ManagerRole } from '../constants/managerPermissions';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export interface AuthManagerRequest extends Request {
  managerUser: { id: string; email: string };
  managerCooperativeRole?: ManagerRole;
}

interface ManagerJwtPayload {
  sub: string;
  type: string;
  email: string;
}

export function requireManagerAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.jwt.secret) as ManagerJwtPayload;

    if (payload.type !== 'manager') {
      throw new UnauthorizedError('Invalid token type');
    }

    (req as AuthManagerRequest).managerUser = { id: payload.sub, email: payload.email };
    logger.info({ managerId: payload.sub }, 'Manager auth verified');
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}

// Validates that the calling manager belongs to :cooperativeId and attaches their role.
export async function requireManagerCooperativeAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id: managerId } = (req as AuthManagerRequest).managerUser;
    const { cooperativeId } = req.params;

    const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
      'SELECT Role FROM ManagementUsersCooperatives WHERE ManagerId = ? AND CooperativeId = ? AND DateDeleted IS NULL',
      [managerId, cooperativeId],
    );

    if (rows.length === 0) {
      throw new ForbiddenError(
        'You are not a manager of this cooperative',
        'NOT_A_MANAGER_OF_THIS_COOPERATIVE',
      );
    }

    (req as AuthManagerRequest).managerCooperativeRole = rows[0].Role as ManagerRole;
    logger.info({ managerId, cooperativeId, role: rows[0].Role }, 'Manager cooperative access verified');
    next();
  } catch (err) {
    next(err);
  }
}

// Must run after requireManagerCooperativeAccess.
// RootManager/SuperManager always pass; Support checks the permissions table.
export function requireManagerPermission(permKey: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: managerId } = (req as AuthManagerRequest).managerUser;
      const { cooperativeId } = req.params;
      const role = (req as AuthManagerRequest).managerCooperativeRole;

      if (role === 'RootManager' || role === 'SuperManager') {
        return next();
      }

      const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
        'SELECT Id FROM ManagementUserPermissions WHERE ManagerId = ? AND CooperativeId = ? AND PermissionKey = ? AND DateDeleted IS NULL',
        [managerId, cooperativeId, permKey],
      );

      if (rows.length === 0) {
        throw new ForbiddenError('You do not have permission to perform this action');
      }

      logger.info({ managerId, cooperativeId, permKey }, 'Manager permission check passed');
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Must run after requireManagerCooperativeAccess.
export function requireManagerRole(...roles: ManagerRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = (req as AuthManagerRequest).managerCooperativeRole;
    if (!role || !roles.includes(role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
}
