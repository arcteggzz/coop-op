import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middlewares/errorHandler';
import { AuthManagerRequest } from '../middlewares/managerAuthMiddleware';
import * as service from '../services/managementMembers.service';
import { inviteMemberSchema } from '../validations/managementMembers.validation';

export async function inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const { id: callingManagerId } = (req as AuthManagerRequest).managerUser;

    const { error, value } = inviteMemberSchema.validate(req.body, { abortEarly: false });
    if (error) throw new ValidationError(error.message);

    const member = await service.inviteMember(value, cooperativeId, callingManagerId);
    res.status(201).json({ success: true, data: { member } });
  } catch (err) {
    next(err);
  }
}

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const page = parseInt((req.query.page as string) || '1', 10);
    const pageSize = parseInt((req.query.pageSize as string) || '20', 10);

    const result = await service.listMembers(cooperativeId, { page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cooperativeId, memberId } = req.params as { cooperativeId: string; memberId: string };
    const member = await service.getMember(cooperativeId, memberId);
    res.status(200).json({ success: true, data: { member } });
  } catch (err) {
    next(err);
  }
}

export async function revokeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cooperativeId, memberId } = req.params as { cooperativeId: string; memberId: string };
    await service.revokeMember(cooperativeId, memberId);
    res.status(200).json({ success: true, message: 'Member access revoked' });
  } catch (err) {
    next(err);
  }
}
