import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middlewares/errorHandler';
import { AuthManagerRequest } from '../middlewares/managerAuthMiddleware';
import * as service from '../services/managementManagers.service';
import {
  inviteManagerSchema,
  updateManagerPermissionsSchema,
} from '../validations/managementManagers.validation';

export async function inviteManager(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const { id: callingManagerId } = (req as AuthManagerRequest).managerUser;

    const { error, value } = inviteManagerSchema.validate(req.body, { abortEarly: false });
    if (error) throw new ValidationError(error.message);

    const manager = await service.inviteManager(value, cooperativeId, callingManagerId);
    res.status(201).json({ success: true, data: { manager } });
  } catch (err) {
    next(err);
  }
}

export async function listManagers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const page = parseInt((req.query.page as string) || '1', 10);
    const pageSize = parseInt((req.query.pageSize as string) || '20', 10);

    const result = await service.listManagers(cooperativeId, { page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getManager(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cooperativeId, managerId } = req.params as { cooperativeId: string; managerId: string };
    const manager = await service.getManager(cooperativeId, managerId);
    res.status(200).json({ success: true, data: { manager } });
  } catch (err) {
    next(err);
  }
}

export async function updateManagerPermissions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, managerId } = req.params as { cooperativeId: string; managerId: string };

    const { error, value } = updateManagerPermissionsSchema.validate(req.body, { abortEarly: false });
    if (error) throw new ValidationError(error.message);

    const result = await service.updateManagerPermissions(cooperativeId, managerId, value.permissions);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function revokeManager(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cooperativeId, managerId } = req.params as { cooperativeId: string; managerId: string };
    await service.revokeManager(cooperativeId, managerId);
    res.status(200).json({ success: true, message: 'Manager access revoked' });
  } catch (err) {
    next(err);
  }
}
