import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { AppError, NotFoundError } from "../middlewares/errorHandler";
import { sendMail } from "../utils/mailer";
import * as repo from "../repositories/adminAuth.repository";

// ─── OTP store (in-memory, 10-minute TTL) ────────────────────────────────────
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Login ───────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  logger.info({ email }, "Service: login");

  const admin = await repo.findAdminByEmail(email);
  if (!admin) {
    logger.warn({ email }, "Service: login — admin not found");
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const passwordMatch = await bcrypt.compare(password, admin.Password);
  if (!passwordMatch) {
    logger.warn({ email }, "Service: login — password mismatch");
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const token = jwt.sign(
    { sub: admin.Id, type: "admin", role: admin.Role, email: admin.Email },
    env.jwt.secret,
    { expiresIn: `${env.jwt.expirationDays}d` },
  );

  const requiresPasswordChange = admin.DefaultPasswordChanged === 0;
  logger.info({ adminId: admin.Id }, "Service: login — success");

  return {
    token,
    requiresPasswordChange,
    admin: {
      id: admin.Id,
      fullName: admin.FullName,
      email: admin.Email,
      role: admin.Role,
      isActive: admin.IsActive === 1,
      defaultPasswordChanged: admin.DefaultPasswordChanged === 1,
      dateInvited: admin.DateInvited,
    },
  };
}

// ─── Request OTP ─────────────────────────────────────────────────────────────
export async function requestOtp(email: string): Promise<void> {
  logger.info({ email }, "Service: requestOtp");

  const admin = await repo.findAdminByEmail(email);
  if (!admin) {
    logger.warn({ email }, "Service: requestOtp — admin not found");
    throw new NotFoundError("Admin not found");
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(email, { otp, expiresAt });

  logger.info({ email }, "Service: requestOtp — OTP generated and stored");

  await sendMail({
    to: email,
    subject: env.email.subjects.adminOtp,
    text: `Hello ${admin.FullName},\n\nYour OTP for password change is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    template: "ADMIN_OTP",
    referenceId: admin.Id,
  });

  logger.info({ email }, "Service: requestOtp — OTP email sent");
}

// ─── Verify OTP and change password ──────────────────────────────────────────
export async function verifyOtpAndChangePassword(
  email: string,
  otp: string,
  newPassword: string,
): Promise<void> {
  logger.info({ email }, "Service: verifyOtpAndChangePassword");

  const stored = otpStore.get(email);
  if (!stored || Date.now() > stored.expiresAt) {
    logger.warn(
      { email },
      "Service: verifyOtpAndChangePassword — OTP not found or expired",
    );
    otpStore.delete(email);
    throw new AppError(
      "OTP is invalid or has expired",
      400,
      "INVALID_OR_EXPIRED_OTP",
    );
  }

  if (stored.otp !== otp) {
    logger.warn(
      { email },
      "Service: verifyOtpAndChangePassword — OTP mismatch",
    );
    throw new AppError(
      "OTP is invalid or has expired",
      400,
      "INVALID_OR_EXPIRED_OTP",
    );
  }

  const admin = await repo.findAdminByEmail(email);
  if (!admin) {
    throw new NotFoundError("Admin not found");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await repo.updateAdminPassword(admin.Id, hashedPassword);

  otpStore.delete(email);
  logger.info(
    { adminId: admin.Id },
    "Service: verifyOtpAndChangePassword — password updated",
  );
}
