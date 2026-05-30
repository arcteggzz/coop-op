import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ValidationError } from "../middlewares/errorHandler";
import { AuthManagerRequest } from "../middlewares/managerAuthMiddleware";
import {
  createDueScheduleSchema,
  updateDueScheduleSchema,
  issueDuesSchema,
  recordPaymentSchema,
  waivePaymentSchema,
} from "../validations/dues.validation";
import * as service from "../services/dues.service";

// ─── POST /api/management/dues/:cooperativeId/schedules ───────────────────────
export async function createDueSchedule(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const { managerUser } = req as AuthManagerRequest;
    logger.info(
      { cooperativeId, callerManagerId: managerUser.id },
      "Controller: POST /management/dues/:cooperativeId/schedules",
    );

    const { error, value } = createDueScheduleSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const schedule = await service.createDueSchedule(
      value,
      cooperativeId,
      managerUser.id,
      "Manager",
    );
    res.status(201).json({ success: true, data: { schedule } });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/management/dues/:cooperativeId/schedules ────────────────────────
export async function listDueSchedules(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info(
      { cooperativeId },
      "Controller: GET /management/dues/:cooperativeId/schedules",
    );

    const page = parseInt((req.query["page"] as string) || "1", 10);
    const pageSize = parseInt((req.query["pageSize"] as string) || "20", 10);
    const isActiveRaw = req.query["isActive"] as string | undefined;
    const isActive =
      isActiveRaw !== undefined ? isActiveRaw === "true" : undefined;

    const result = await service.listDueSchedules(cooperativeId, {
      page,
      pageSize,
      isActive,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/management/dues/:cooperativeId/schedules/:scheduleId ────────────
export async function getDueSchedule(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, scheduleId } = req.params as {
      cooperativeId: string;
      scheduleId: string;
    };
    logger.info(
      { cooperativeId, scheduleId },
      "Controller: GET /management/dues/:cooperativeId/schedules/:scheduleId",
    );

    const schedule = await service.getDueSchedule(cooperativeId, scheduleId);
    res.status(200).json({ success: true, data: { schedule } });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/management/dues/:cooperativeId/schedules/:scheduleId ──────────
export async function updateDueSchedule(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, scheduleId } = req.params as {
      cooperativeId: string;
      scheduleId: string;
    };
    const { managerUser } = req as AuthManagerRequest;
    logger.info(
      { cooperativeId, scheduleId, callerManagerId: managerUser.id },
      "Controller: PATCH /management/dues/:cooperativeId/schedules/:scheduleId",
    );

    const { error, value } = updateDueScheduleSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const schedule = await service.updateDueSchedule(
      cooperativeId,
      scheduleId,
      value,
    );
    res.status(200).json({ success: true, data: { schedule } });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/management/dues/:cooperativeId/schedules/:scheduleId ─────────
export async function deleteDueSchedule(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, scheduleId } = req.params as {
      cooperativeId: string;
      scheduleId: string;
    };
    const { managerUser } = req as AuthManagerRequest;
    logger.info(
      { cooperativeId, scheduleId, callerManagerId: managerUser.id },
      "Controller: DELETE /management/dues/:cooperativeId/schedules/:scheduleId",
    );

    await service.deleteDueSchedule(cooperativeId, scheduleId);
    res.status(200).json({ success: true, message: "Due schedule deleted" });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/management/dues/:cooperativeId/schedules/:scheduleId/issue ─────
export async function issueDues(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, scheduleId } = req.params as {
      cooperativeId: string;
      scheduleId: string;
    };
    const { managerUser } = req as AuthManagerRequest;
    logger.info(
      { cooperativeId, scheduleId, callerManagerId: managerUser.id },
      "Controller: POST /management/dues/:cooperativeId/schedules/:scheduleId/issue",
    );

    const { error, value } = issueDuesSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const result = await service.issueDues(
      cooperativeId,
      scheduleId,
      value,
      managerUser.id,
      "Manager",
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/management/dues/:cooperativeId/payments ─────────────────────────
export async function listDuePayments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info(
      { cooperativeId },
      "Controller: GET /management/dues/:cooperativeId/payments",
    );

    const page = parseInt((req.query["page"] as string) || "1", 10);
    const pageSize = parseInt((req.query["pageSize"] as string) || "20", 10);
    const filters = {
      scheduleId: req.query["scheduleId"] as string | undefined,
      memberId: req.query["memberId"] as string | undefined,
      periodLabel: req.query["periodLabel"] as string | undefined,
      status: req.query["status"] as string | undefined,
    };

    const result = await service.listDuePayments(cooperativeId, filters, {
      page,
      pageSize,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/management/dues/:cooperativeId/payments/:paymentId/record ─────
export async function recordPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, paymentId } = req.params as {
      cooperativeId: string;
      paymentId: string;
    };
    const { managerUser } = req as AuthManagerRequest;
    logger.info(
      { cooperativeId, paymentId, callerManagerId: managerUser.id },
      "Controller: PATCH /management/dues/:cooperativeId/payments/:paymentId/record",
    );

    const { error, value } = recordPaymentSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const result = await service.recordManualPayment(
      cooperativeId,
      paymentId,
      value,
      managerUser.id,
      "Manager",
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/management/dues/:cooperativeId/schedules/:scheduleId/member-summary/:memberId
export async function getMemberScheduleSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, scheduleId, memberId } = req.params as {
      cooperativeId: string;
      scheduleId: string;
      memberId: string;
    };
    logger.info(
      { cooperativeId, scheduleId, memberId },
      "Controller: GET /management/dues/:cooperativeId/schedules/:scheduleId/member-summary/:memberId",
    );

    const result = await service.getMemberScheduleSummary(
      cooperativeId,
      scheduleId,
      memberId,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/management/dues/:cooperativeId/dashboard-summary ────────────────
export async function getDashboardSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info(
      { cooperativeId },
      "Controller: GET /management/dues/:cooperativeId/dashboard-summary",
    );

    const memberId = req.query["memberId"] as string | undefined;
    const result = await service.getDueDashboardSummary(
      cooperativeId,
      memberId,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/management/dues/:cooperativeId/payments/:paymentId/waive ──────
export async function waivePayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, paymentId } = req.params as {
      cooperativeId: string;
      paymentId: string;
    };
    const { managerUser } = req as AuthManagerRequest;
    logger.info(
      { cooperativeId, paymentId, callerManagerId: managerUser.id },
      "Controller: PATCH /management/dues/:cooperativeId/payments/:paymentId/waive",
    );

    const { error, value } = waivePaymentSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const result = await service.waiveDuePayment(
      cooperativeId,
      paymentId,
      value,
      managerUser.id,
      "Manager",
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
