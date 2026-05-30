import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ValidationError } from "../middlewares/errorHandler";
import { AuthAdminRequest } from "../middlewares/adminAuthMiddleware";
import {
  createLevySchema,
  updateLevySchema,
  assignLevySchema,
  recordLevyPaymentSchema,
  waiveLevyAssignmentSchema,
} from "../validations/levies.validation";
import * as service from "../services/levies.service";

// ─── POST /api/coop-admin/cooperatives/:cooperativeId/levies ──────────────────
export async function createLevy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const { adminUser } = req as AuthAdminRequest;
    logger.info(
      { cooperativeId, callerAdminId: adminUser.id },
      "Controller: POST /cooperatives/:cooperativeId/levies",
    );

    const { error, value } = createLevySchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const levy = await service.createLevy(value, cooperativeId, adminUser.id, "Admin");
    res.status(201).json({ success: true, data: { levy } });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/coop-admin/cooperatives/:cooperativeId/levies ───────────────────
export async function listLevies(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info(
      { cooperativeId },
      "Controller: GET /cooperatives/:cooperativeId/levies",
    );

    const page = parseInt((req.query["page"] as string) || "1", 10);
    const pageSize = parseInt((req.query["pageSize"] as string) || "20", 10);
    const isActiveRaw = req.query["isActive"] as string | undefined;
    const isActive =
      isActiveRaw !== undefined ? isActiveRaw === "true" : undefined;

    const result = await service.listLevies(cooperativeId, {
      page,
      pageSize,
      isActive,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/coop-admin/cooperatives/:cooperativeId/levies/:levyId ───────────
export async function getLevyWithSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, levyId } = req.params as {
      cooperativeId: string;
      levyId: string;
    };
    logger.info(
      { cooperativeId, levyId },
      "Controller: GET /cooperatives/:cooperativeId/levies/:levyId",
    );

    const levy = await service.getLevyWithSummary(cooperativeId, levyId);
    res.status(200).json({ success: true, data: { levy } });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/coop-admin/cooperatives/:cooperativeId/levies/:levyId ─────────
export async function updateLevy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, levyId } = req.params as {
      cooperativeId: string;
      levyId: string;
    };
    const { adminUser } = req as AuthAdminRequest;
    logger.info(
      { cooperativeId, levyId, callerAdminId: adminUser.id },
      "Controller: PATCH /cooperatives/:cooperativeId/levies/:levyId",
    );

    const { error, value } = updateLevySchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const levy = await service.updateLevy(cooperativeId, levyId, value);
    res.status(200).json({ success: true, data: { levy } });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/coop-admin/cooperatives/:cooperativeId/levies/:levyId ─────────
export async function softDeleteLevy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, levyId } = req.params as {
      cooperativeId: string;
      levyId: string;
    };
    const { adminUser } = req as AuthAdminRequest;
    logger.info(
      { cooperativeId, levyId, callerAdminId: adminUser.id },
      "Controller: DELETE /cooperatives/:cooperativeId/levies/:levyId",
    );

    await service.softDeleteLevy(cooperativeId, levyId);
    res.status(200).json({ success: true, message: "Levy deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/coop-admin/cooperatives/:cooperativeId/levies/:levyId/assign ───
export async function assignLevy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, levyId } = req.params as {
      cooperativeId: string;
      levyId: string;
    };
    const { adminUser } = req as AuthAdminRequest;
    logger.info(
      { cooperativeId, levyId, callerAdminId: adminUser.id },
      "Controller: POST /cooperatives/:cooperativeId/levies/:levyId/assign",
    );

    const { error, value } = assignLevySchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const result = await service.assignLevy(
      cooperativeId,
      levyId,
      value,
      adminUser.id,
      "Admin",
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/coop-admin/cooperatives/:cooperativeId/levies/:levyId/assignments
export async function listLevyAssignments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, levyId } = req.params as {
      cooperativeId: string;
      levyId: string;
    };
    logger.info(
      { cooperativeId, levyId },
      "Controller: GET /cooperatives/:cooperativeId/levies/:levyId/assignments",
    );

    const page = parseInt((req.query["page"] as string) || "1", 10);
    const pageSize = parseInt((req.query["pageSize"] as string) || "20", 10);
    const status = req.query["status"] as string | undefined;

    const result = await service.listLevyAssignments(cooperativeId, levyId, {
      page,
      pageSize,
      status,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/coop-admin/cooperatives/:cooperativeId/levies/assignments/:assignmentId/record
export async function recordLevyPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, assignmentId } = req.params as {
      cooperativeId: string;
      assignmentId: string;
    };
    const { adminUser } = req as AuthAdminRequest;
    logger.info(
      { cooperativeId, assignmentId, callerAdminId: adminUser.id },
      "Controller: PATCH /levies/assignments/:assignmentId/record",
    );

    const { error, value } = recordLevyPaymentSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const result = await service.recordLevyPayment(
      cooperativeId,
      assignmentId,
      value,
      adminUser.id,
      "Admin",
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/coop-admin/cooperatives/:cooperativeId/levies/assignments/:assignmentId/waive
export async function waiveLevyAssignment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, assignmentId } = req.params as {
      cooperativeId: string;
      assignmentId: string;
    };
    const { adminUser } = req as AuthAdminRequest;
    logger.info(
      { cooperativeId, assignmentId, callerAdminId: adminUser.id },
      "Controller: PATCH /levies/assignments/:assignmentId/waive",
    );

    const { error, value } = waiveLevyAssignmentSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const result = await service.waiveLevyAssignment(
      cooperativeId,
      assignmentId,
      value,
      adminUser.id,
      "Admin",
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/coop-admin/levies (global overview — all cooperatives) ───────────
export async function listAllLevies(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info({}, "Controller: GET /api/coop-admin/levies — global overview");

    const page = parseInt((req.query["page"] as string) || "1", 10);
    const pageSize = parseInt((req.query["pageSize"] as string) || "20", 10);
    const isActiveRaw = req.query["isActive"] as string | undefined;
    const isActive =
      isActiveRaw !== undefined ? isActiveRaw === "true" : undefined;
    const cooperativeId = req.query["cooperativeId"] as string | undefined;

    const result = await service.listAllLevies(
      { isActive, cooperativeId },
      { page, pageSize },
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
