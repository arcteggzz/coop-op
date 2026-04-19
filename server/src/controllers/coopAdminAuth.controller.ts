import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ValidationError, AppError } from "../middlewares/errorHandler";
import {
  loginSchema,
  requestOtpSchema,
  verifyOtpAndChangePasswordSchema,
} from "../validations/coopAdminAuth.validation";
import * as service from "../services/adminAuth.service";

// ─── POST /api/coop-admin/login ───────────────────────────────────────────────
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Controller: POST /api/coop-admin/login");

    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    const result = await service.login(value.email, value.password);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/coop-admin/request-otp ────────────────────────────────────────
export async function requestOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Controller: POST /api/coop-admin/request-otp");

    const { error, value } = requestOtpSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

    await service.requestOtp(value.email);
    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/coop-admin/verify-otp-and-change-password ─────────────────────
export async function verifyOtpAndChangePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info(
      "Controller: POST /api/coop-admin/verify-otp-and-change-password",
    );

    const { error, value } = verifyOtpAndChangePasswordSchema.validate(
      req.body,
      {
        abortEarly: false,
      },
    );
    if (error) {
      const messages = error.details.map((d) => d.message);
      // Surface PASSWORD_MISMATCH as a distinct error code
      if (messages.some((m) => m.includes("Passwords do not match"))) {
        throw new AppError("Passwords do not match", 400, "PASSWORD_MISMATCH");
      }
      throw new ValidationError(messages.join("; "));
    }

    await service.verifyOtpAndChangePassword(
      value.email,
      value.otp,
      value.newPassword,
    );
    res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
}
