import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ValidationError } from '../middlewares/errorHandler';
import { AuthAdminRequest } from '../middlewares/adminAuthMiddleware';
import {
  inviteAdminSchema,
  updatePermissionsSchema,
} from '../validations/coopAdminManagement.validation';
import * as service from '../services/adminManagement.service';

// ─── POST /api/coop-admin/admins/invite ───────────────────────────────────────
export async function inviteAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { adminUser } = req as AuthAdminRequest;
    logger.info({ callerAdminId: adminUser.id }, 'Controller: POST /api/coop-admin/admins/invite');

    const { error, value } = inviteAdminSchema.validate(req.body, { abortEarly: false });
    if (error) throw new ValidationError(error.message);

    const admin = await service.inviteAdmin(value, adminUser.id);
    res.status(201).json({ success: true, data: { admin } });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/coop-admin/admins ───────────────────────────────────────────────
export async function listAdmins(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    logger.info('Controller: GET /api/coop-admin/admins');

    const page = parseInt((req.query['page'] as string) || '1', 10);
    const pageSize = parseInt((req.query['pageSize'] as string) || '20', 10);
    const role = req.query['role'] as string | undefined;
    const isActiveRaw = req.query['isActive'] as string | undefined;
    const isActive = isActiveRaw !== undefined ? parseInt(isActiveRaw, 10) : undefined;

    const result = await service.listAdmins({ page, pageSize, role, isActive });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/coop-admin/admins/:adminId ──────────────────────────────────────
export async function getAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { adminId } = req.params as { adminId: string };
    logger.info({ adminId }, 'Controller: GET /api/coop-admin/admins/:adminId');

    const admin = await service.getAdminById(adminId);
    res.status(200).json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/coop-admin/admins/:adminId/permissions ────────────────────────
export async function updatePermissions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { adminId } = req.params as { adminId: string };
    logger.info({ adminId }, 'Controller: PATCH /api/coop-admin/admins/:adminId/permissions');

    const { error, value } = updatePermissionsSchema.validate(req.body, { abortEarly: false });
    if (error) throw new ValidationError(error.message);

    const result = await service.updatePermissions(adminId, value.permissions);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/coop-admin/admins/:adminId/revoke ─────────────────────────────
export async function revokeAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { adminId } = req.params as { adminId: string };
    const { adminUser } = req as AuthAdminRequest;
    logger.info({ adminId, callerRole: adminUser.role }, 'Controller: PATCH /api/coop-admin/admins/:adminId/revoke');

    await service.revokeAdmin(adminId, adminUser.role);
    res.status(200).json({ success: true, message: 'Access revoked' });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/coop-admin/admins/:adminId/restore ────────────────────────────
export async function restoreAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { adminId } = req.params as { adminId: string };
    logger.info({ adminId }, 'Controller: PATCH /api/coop-admin/admins/:adminId/restore');

    await service.restoreAdmin(adminId);
    res.status(200).json({ success: true, message: 'Access restored' });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/coop-admin/admins/:adminId ───────────────────────────────────
export async function deleteAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { adminId } = req.params as { adminId: string };
    const { adminUser } = req as AuthAdminRequest;
    logger.info({ adminId, callerAdminId: adminUser.id }, 'Controller: DELETE /api/coop-admin/admins/:adminId');

    await service.deleteAdmin(adminId, adminUser.id);
    res.status(200).json({ success: true, message: 'Admin deleted' });
  } catch (err) {
    next(err);
  }
}
