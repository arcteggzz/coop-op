import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ValidationError } from "../middlewares/errorHandler";
import { AuthAdminRequest } from "../middlewares/adminAuthMiddleware";
import {
  createCooperativeSchema,
  updateCooperativeSchema,
  createCooperativeWalletSchema,
} from "../validations/coopCooperatives.validation";
import * as service from "../services/cooperatives.service";

// ─── POST /api/coop-admin/cooperatives ────────────────────────────────────────
export async function createCooperative(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { adminUser } = req as AuthAdminRequest;
    logger.info(
      { callerAdminId: adminUser.id },
      "Controller: POST /api/coop-admin/cooperatives",
    );

    const { error, value } = createCooperativeSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const cooperative = await service.createCooperative(value, adminUser.id);
    res.status(201).json({ success: true, data: { cooperative } });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/coop-admin/cooperatives ─────────────────────────────────────────
export async function listCooperatives(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Controller: GET /api/coop-admin/cooperatives");

    const page = parseInt((req.query["page"] as string) || "1", 10);
    const pageSize = parseInt((req.query["pageSize"] as string) || "20", 10);
    const name = req.query["name"] as string | undefined;

    const result = await service.listCooperatives({ page, pageSize, name });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/coop-admin/cooperatives/:cooperativeId ──────────────────────────
export async function getCooperative(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info(
      { cooperativeId },
      "Controller: GET /api/coop-admin/cooperatives/:cooperativeId",
    );

    const cooperative = await service.getCooperativeById(cooperativeId);
    res.status(200).json({ success: true, data: { cooperative } });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/coop-admin/cooperatives/:cooperativeId ────────────────────────
export async function updateCooperative(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info(
      { cooperativeId },
      "Controller: PATCH /api/coop-admin/cooperatives/:cooperativeId",
    );

    const { error, value } = updateCooperativeSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const cooperative = await service.updateCooperative(cooperativeId, value);
    res.status(200).json({ success: true, data: { cooperative } });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/coop-admin/cooperatives/:cooperativeId/create-wallet ───────────
export async function createCooperativeWallet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info(
      { cooperativeId },
      "Controller: POST /api/coop-admin/cooperatives/:cooperativeId/create-wallet",
    );

    const { error, value } = createCooperativeWalletSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const cooperative = await service.createCooperativeWallet(
      cooperativeId,
      value.walletName,
    );
    res.status(202).json({ success: true, data: { cooperative } });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/coop-admin/cooperatives/:cooperativeId ───────────────────────
export async function deleteCooperative(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const { adminUser } = req as AuthAdminRequest;
    logger.info(
      { cooperativeId, callerAdminId: adminUser.id },
      "Controller: DELETE /api/coop-admin/cooperatives/:cooperativeId",
    );

    await service.deleteCooperative(cooperativeId);
    res.status(200).json({ success: true, message: "Cooperative deleted" });
  } catch (err) {
    next(err);
  }
}
