import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ValidationError } from "../middlewares/errorHandler";
import { AuthAdminRequest } from "../middlewares/adminAuthMiddleware";
import {
  inviteManagerSchema,
  updateManagerPermissionsSchema,
} from "../validations/coopManagers.validation";
import * as service from "../services/managers.service";

// ─── POST /api/coop-admin/cooperatives/:cooperativeId/managers/invite ───────────────────────────
export async function inviteManager(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const { adminUser } = req as AuthAdminRequest;
    logger.info(
      { cooperativeId, callerAdminId: adminUser.id },
      "Controller: POST /cooperatives/:cooperativeId/managers/invite",
    );

    const { error, value } = inviteManagerSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const manager = await service.inviteManager(
      value,
      cooperativeId,
      adminUser.id,
    );
    res.status(201).json({ success: true, data: { manager } });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/coop-admin/cooperatives/:cooperativeId/managers ───────────────────────────────────
export async function listManagers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info(
      { cooperativeId },
      "Controller: GET /cooperatives/:cooperativeId/managers",
    );

    const page = parseInt((req.query["page"] as string) || "1", 10);
    const pageSize = parseInt((req.query["pageSize"] as string) || "20", 10);

    const result = await service.listManagers(cooperativeId, {
      page,
      pageSize,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/coop-admin/cooperatives/:cooperativeId/managers/:managerId ──────
export async function getManager(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, managerId } = req.params as {
      cooperativeId: string;
      managerId: string;
    };
    logger.info(
      { cooperativeId, managerId },
      "Controller: GET /cooperatives/:cooperativeId/managers/:managerId",
    );

    const manager = await service.getManager(cooperativeId, managerId);
    res.status(200).json({ success: true, data: { manager } });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/coop-admin/cooperatives/:cooperativeId/managers/:managerId/permissions
export async function updateManagerPermissions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, managerId } = req.params as {
      cooperativeId: string;
      managerId: string;
    };
    logger.info(
      { cooperativeId, managerId },
      "Controller: PATCH /cooperatives/:cooperativeId/managers/:managerId/permissions",
    );

    const { error, value } = updateManagerPermissionsSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const result = await service.updateManagerPermissions(
      cooperativeId,
      managerId,
      value.permissions,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/coop-admin/cooperatives/:cooperativeId/managers/:managerId/revoke
export async function revokeManager(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, managerId } = req.params as {
      cooperativeId: string;
      managerId: string;
    };
    logger.info(
      { cooperativeId, managerId },
      "Controller: PATCH /cooperatives/:cooperativeId/managers/:managerId/revoke",
    );

    await service.revokeManager(cooperativeId, managerId);
    res.status(200).json({ success: true, message: "Manager access revoked" });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/coop-admin/cooperatives/:cooperativeId/managers/:managerId/transfer-root
export async function transferRoot(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, managerId } = req.params as {
      cooperativeId: string;
      managerId: string;
    };
    logger.info(
      { cooperativeId, targetManagerId: managerId },
      "Controller: PATCH /cooperatives/:cooperativeId/managers/:managerId/transfer-root",
    );

    await service.transferRoot(cooperativeId, managerId);
    res
      .status(200)
      .json({ success: true, message: "RootManager role transferred" });
  } catch (err) {
    next(err);
  }
}
