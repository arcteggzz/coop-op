import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { AdminRole } from '../constants/adminPermissions';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export interface AuthAdminRequest extends Request {
  adminUser: { id: string; role: AdminRole; email: string };
}

interface AdminJwtPayload {
  sub: string;
  type: string;
  role: AdminRole;
  email: string;
}

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.jwt.secret) as AdminJwtPayload;

    if (payload.type !== 'admin') {
      throw new UnauthorizedError('Invalid token type');
    }

    (req as AuthAdminRequest).adminUser = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };

    logger.info({ adminId: payload.sub, role: payload.role }, 'Admin auth verified');
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}

// Middleware factory: RootAdmin/SuperAdmin always pass; Admin must have the permission key in AdminPermissions.
export function requireAdminPermission(permKey: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, role } = (req as AuthAdminRequest).adminUser;

      if (role === 'RootAdmin' || role === 'SuperAdmin') {
        return next();
      }

      const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
        'SELECT Id FROM AdminPermissions WHERE AdminId = ? AND PermissionKey = ? AND DateDeleted IS NULL',
        [id, permKey],
      );

      if (rows.length === 0) {
        throw new ForbiddenError('You do not have permission to perform this action');
      }

      logger.info({ adminId: id, permKey }, 'Admin permission check passed');
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Middleware factory: only allow specific roles (e.g. RootAdmin, SuperAdmin).
export function requireAdminRole(...roles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { role } = (req as AuthAdminRequest).adminUser;
    if (!roles.includes(role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
}
