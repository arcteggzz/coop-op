import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../middlewares/errorHandler";
import * as service from "../services/managementAuth.service";
import {
  loginSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from "../validations/managementAuth.validation";

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
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

export async function requestOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
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

export async function verifyOtpAndChangePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { error, value } = verifyOtpSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(error.message);

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
