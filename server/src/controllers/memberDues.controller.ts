import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { AuthMemberRequest } from "../middlewares/memberAuthMiddleware";
import * as service from "../services/dues.service";

// ─── GET /api/member/dues/:cooperativeId/schedules ────────────────────────────
export async function listDueSchedules(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info({ cooperativeId }, "Controller: GET /member/dues/:cooperativeId/schedules");

    const result = await service.listMemberDueSchedules(cooperativeId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/member/dues/:cooperativeId/payments ─────────────────────────────
export async function listDuePayments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const { memberUser } = req as AuthMemberRequest;
    logger.info(
      { cooperativeId, memberId: memberUser.id },
      "Controller: GET /member/dues/:cooperativeId/payments",
    );

    const page = parseInt((req.query["page"] as string) || "1", 10);
    const pageSize = parseInt((req.query["pageSize"] as string) || "20", 10);
    const filters = {
      scheduleId: req.query["scheduleId"] as string | undefined,
      periodLabel: req.query["periodLabel"] as string | undefined,
      status: req.query["status"] as string | undefined,
    };

    const result = await service.listMemberDuePayments(memberUser.id, cooperativeId, filters, { page, pageSize });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/member/dues/:cooperativeId/payments/outstanding ─────────────────
export async function listOutstandingPayments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const { memberUser } = req as AuthMemberRequest;
    logger.info(
      { cooperativeId, memberId: memberUser.id },
      "Controller: GET /member/dues/:cooperativeId/payments/outstanding",
    );

    const result = await service.listMemberOutstandingPayments(memberUser.id, cooperativeId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/member/dues/:cooperativeId/payments/:paymentId/pay ─────────────
export async function payFromWallet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, paymentId } = req.params as {
      cooperativeId: string;
      paymentId: string;
    };
    const { memberUser } = req as AuthMemberRequest;
    logger.info(
      { cooperativeId, paymentId, memberId: memberUser.id },
      "Controller: POST /member/dues/:cooperativeId/payments/:paymentId/pay",
    );

    const result = await service.payDueFromWallet(memberUser.id, cooperativeId, paymentId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
