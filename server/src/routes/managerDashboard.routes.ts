import { Router, Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ValidationError } from "../middlewares/errorHandler";
import {
  requireManagerAuth,
  requireManagerCooperativeAccess,
  requireManagerRole,
  AuthManagerRequest,
} from "../middlewares/managerAuthMiddleware";
import * as dashboardService from "../services/cooperativeDashboard.service";
import { createCooperativeWalletSchema } from "../validations/coopCooperatives.validation";

const router = Router({ mergeParams: true });

router.use(requireManagerAuth);
router.use(requireManagerCooperativeAccess);

// ─── GET /api/management/cooperatives/:cooperativeId/summary ──────────────────
router.get("/summary", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info(
      { cooperativeId },
      "Route: GET /api/management/cooperatives/:cooperativeId/summary",
    );
    const summary = await dashboardService.getCooperativeSummary(cooperativeId);
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/management/cooperatives/:cooperativeId/wallets ──────────────────
router.get("/wallets", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cooperativeId } = req.params as { cooperativeId: string };
    logger.info(
      { cooperativeId },
      "Route: GET /api/management/cooperatives/:cooperativeId/wallets",
    );
    const wallets = await dashboardService.getCooperativeWallets(cooperativeId);
    res.status(200).json({ success: true, data: wallets });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/management/cooperatives/:cooperativeId/wallets/balance ──────────
router.get(
  "/wallets/balance",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accountNumber } = req.query as { accountNumber?: string };
      if (!accountNumber) {
        res.status(400).json({
          success: false,
          error: { message: "accountNumber is required" },
        });
        return;
      }
      logger.info(
        { accountNumber },
        "Route: GET /api/management/cooperatives/:cooperativeId/wallets/balance",
      );
      const balance =
        await dashboardService.getCooperativeWalletBalance(accountNumber);
      res.status(200).json({ success: true, data: balance });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/management/cooperatives/:cooperativeId/create-wallet ───────────
router.post(
  "/create-wallet",
  requireManagerRole("RootManager", "SuperManager"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cooperativeId } = req.params as { cooperativeId: string };
      const { managerUser } = req as AuthManagerRequest;
      logger.info(
        { cooperativeId, managerId: managerUser.id },
        "Route: POST /api/management/cooperatives/:cooperativeId/create-wallet",
      );

      const { error, value } = createCooperativeWalletSchema.validate(req.body, {
        abortEarly: false,
      });
      if (error) throw new ValidationError(error.message);

      await dashboardService.createCooperativeWallet(
        cooperativeId,
        value.walletName,
      );
      res.status(202).json({
        success: true,
        data: {
          message:
            "Cooperative wallet will be created in the background. Refresh in a few minutes.",
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
