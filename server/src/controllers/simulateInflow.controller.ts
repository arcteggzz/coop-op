import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import { embedlyRequest } from "../utils/embedlyClient";
import { ValidationError } from "../middlewares/errorHandler";

const simulateInflowSchema = Joi.object({
  accountNumber: Joi.string().required(),
  amount: Joi.number().positive().required(),
});

// ─── POST /api/simulate-inflow ────────────────────────────────────────────────

export async function simulateInflowHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // 1. Staging/development guard
  if (env.nodeEnv !== "staging" && env.nodeEnv !== "development") {
    res.status(403).json({
      success: false,
      error: "This endpoint is only available in staging/development",
    });
    return;
  }

  // 2. Validate body
  const { error, value } = simulateInflowSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return next(
      new ValidationError(error.details.map((d) => d.message).join(", ")),
    );
  }

  const { accountNumber, amount } = value as {
    accountNumber: string;
    amount: number;
  };

  logger.info(
    { accountNumber, amount },
    "SimulateInflow: calling Embedly simulate-inflow",
  );

  // 3. Call Embedly simulate-inflow
  const response = await embedlyRequest(
    "POST",
    env.embedly.urls.simmulateInflow,
    {
      BeneficiaryAccountName: "Coop Op Wallet",
      BeneficiaryAccountNumber: accountNumber,
      Narration: "Coop Op Inflow",
      Amount: String(amount),
    },
  );

  logger.info(
    { accountNumber, amount },
    "SimulateInflow: Embedly simulate-inflow successful",
  );

  res.status(200).json({ success: true, data: response.data });
}
