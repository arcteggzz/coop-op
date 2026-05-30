import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { AuthMemberRequest } from "../middlewares/memberAuthMiddleware";
import * as service from "../services/levies.service";

// ─── GET /api/member/levies/:cooperativeId ────────────────────────────────────
export async function listMemberAssignments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    const { memberUser } = req as AuthMemberRequest;
    logger.info(
      { cooperativeId, memberId: memberUser.id },
      "Controller: GET /member/levies/:cooperativeId",
    );

    const page = parseInt((req.query["page"] as string) || "1", 10);
    const pageSize = parseInt((req.query["pageSize"] as string) || "20", 10);
    const status = req.query["status"] as string | undefined;

    const result = await service.listMemberAssignments(
      memberUser.id,
      cooperativeId,
      { page, pageSize, status },
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/member/levies/:cooperativeId/:assignmentId ─────────────────────
export async function getMemberAssignment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, assignmentId } = req.params as {
      cooperativeId: string;
      assignmentId: string;
    };
    const { memberUser } = req as AuthMemberRequest;
    logger.info(
      { cooperativeId, assignmentId, memberId: memberUser.id },
      "Controller: GET /member/levies/:cooperativeId/:assignmentId",
    );

    const result = await service.getMemberAssignment(
      memberUser.id,
      cooperativeId,
      assignmentId,
    );
    res.status(200).json({ success: true, data: { assignment: result } });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/member/levies/:cooperativeId/:assignmentId/pay ─────────────────
export async function payLevyFromWallet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cooperativeId, assignmentId } = req.params as {
      cooperativeId: string;
      assignmentId: string;
    };
    const { memberUser } = req as AuthMemberRequest;
    logger.info(
      { cooperativeId, assignmentId, memberId: memberUser.id },
      "Controller: POST /member/levies/:cooperativeId/:assignmentId/pay",
    );

    const result = await service.payLevyFromWallet(
      memberUser.id,
      cooperativeId,
      assignmentId,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
