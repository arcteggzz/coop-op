import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ValidationError } from "../middlewares/errorHandler";
import { AuthManagerRequest } from "../middlewares/managerAuthMiddleware";
import {
  createLevySchema,
  updateLevySchema,
  assignLevySchema,
  recordLevyPaymentSchema,
  waiveLevyAssignmentSchema,
} from "../validations/levies.validation";
import * as service from "../services/levies.service";

// ─── POST /api/management/levies/:cooperativeId ───────────────────────────────
export async function createLevy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const { managerUser } = req as AuthManagerRequest;
    logger.info(
      { cooperativeId, callerManagerId: managerUser.id },
      "Controller: POST /management/levies/:cooperativeId",
    );

    const { error, value } = createLevySchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const levy = await service.createLevy(
      value,
      cooperativeId,
      managerUser.id,
      "Manager",
    );
    res.status(201).json({ success: true, data: { levy } });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/management/levies/:cooperativeId ────────────────────────────────
export async function listLevies(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info(
      { cooperativeId },
      "Controller: GET /management/levies/:cooperativeId",
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

// ─── GET /api/management/levies/:cooperativeId/:levyId ───────────────────────
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
      "Controller: GET /management/levies/:cooperativeId/:levyId",
    );

    const levy = await service.getLevyWithSummary(cooperativeId, levyId);
    res.status(200).json({ success: true, data: { levy } });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/management/levies/:cooperativeId/:levyId ─────────────────────
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
    const { managerUser } = req as AuthManagerRequest;
    logger.info(
      { cooperativeId, levyId, callerManagerId: managerUser.id },
      "Controller: PATCH /management/levies/:cooperativeId/:levyId",
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

// ─── DELETE /api/management/levies/:cooperativeId/:levyId ────────────────────
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
    const { managerUser } = req as AuthManagerRequest;
    logger.info(
      { cooperativeId, levyId, callerManagerId: managerUser.id },
      "Controller: DELETE /management/levies/:cooperativeId/:levyId",
    );

    await service.softDeleteLevy(cooperativeId, levyId);
    res.status(200).json({ success: true, message: "Levy deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/management/levies/:cooperativeId/:levyId/assign ───────────────
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
    const { managerUser } = req as AuthManagerRequest;
    logger.info(
      { cooperativeId, levyId, callerManagerId: managerUser.id },
      "Controller: POST /management/levies/:cooperativeId/:levyId/assign",
    );

    const { error, value } = assignLevySchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const result = await service.assignLevy(
      cooperativeId,
      levyId,
      value,
      managerUser.id,
      "Manager",
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/management/levies/:cooperativeId/:levyId/assignments ────────────
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
      "Controller: GET /management/levies/:cooperativeId/:levyId/assignments",
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

// ─── PATCH /api/management/levies/:cooperativeId/assignments/:assignmentId/record
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
    const { managerUser } = req as AuthManagerRequest;
    logger.info(
      { cooperativeId, assignmentId, callerManagerId: managerUser.id },
      "Controller: PATCH /management/levies/:cooperativeId/assignments/:assignmentId/record",
    );

    const { error, value } = recordLevyPaymentSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const result = await service.recordLevyPayment(
      cooperativeId,
      assignmentId,
      value,
      managerUser.id,
      "Manager",
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/management/levies/:cooperativeId/assignments/:assignmentId/waive
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
    const { managerUser } = req as AuthManagerRequest;
    logger.info(
      { cooperativeId, assignmentId, callerManagerId: managerUser.id },
      "Controller: PATCH /management/levies/:cooperativeId/assignments/:assignmentId/waive",
    );

    const { error, value } = waiveLevyAssignmentSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const result = await service.waiveLevyAssignment(
      cooperativeId,
      assignmentId,
      value,
      managerUser.id,
      "Manager",
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
