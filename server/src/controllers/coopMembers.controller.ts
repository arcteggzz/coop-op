import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ValidationError } from "../middlewares/errorHandler";
import { AuthAdminRequest } from "../middlewares/adminAuthMiddleware";
import { inviteMemberSchema } from "../validations/coopMembers.validation";
import * as service from "../services/members.service";

// ─── POST /api/coop-admin/cooperatives/:cooperativeId/members/invite ──────────
export async function inviteMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const { adminUser } = req as AuthAdminRequest;
    logger.info(
      { cooperativeId, callerAdminId: adminUser.id },
      "Controller: POST /cooperatives/:cooperativeId/members/invite",
    );

    const { error, value } = inviteMemberSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const member = await service.inviteMember(
      value,
      cooperativeId,
      adminUser.id,
    );
    res.status(201).json({ success: true, data: { member } });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/coop-admin/cooperatives/:cooperativeId/members ──────────────────
export async function listMembers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info(
      { cooperativeId },
      "Controller: GET /cooperatives/:cooperativeId/members",
    );

    const page = parseInt((req.query["page"] as string) || "1", 10);
    const pageSize = parseInt((req.query["pageSize"] as string) || "20", 10);

    const result = await service.listMembers(cooperativeId, { page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/coop-admin/cooperatives/:cooperativeId/members/:memberId ─────────
export async function getMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, memberId } = req.params as {
      cooperativeId: string;
      memberId: string;
    };
    logger.info(
      { cooperativeId, memberId },
      "Controller: GET /cooperatives/:cooperativeId/members/:memberId",
    );

    const member = await service.getMember(cooperativeId, memberId);
    res.status(200).json({ success: true, data: { member } });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/coop-admin/cooperatives/:cooperativeId/members/:memberId/revoke
export async function revokeMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, memberId } = req.params as {
      cooperativeId: string;
      memberId: string;
    };
    logger.info(
      { cooperativeId, memberId },
      "Controller: PATCH /cooperatives/:cooperativeId/members/:memberId/revoke",
    );

    await service.revokeMember(cooperativeId, memberId);
    res.status(200).json({ success: true, message: "Member access revoked" });
  } catch (err) {
    next(err);
  }
}
