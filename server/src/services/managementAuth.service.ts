import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError, NotFoundError } from '../middlewares/errorHandler';
import { sendMail } from '../utils/mailer';
import * as repo from '../repositories/managers.repository';

// ─── OTP store (in-memory, 10-minute TTL) ────────────────────────────────────
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Login ───────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  logger.info({ email }, 'Service: management login');

  const manager = await repo.findManagerByEmail(email);
  if (!manager || manager.IsActive !== 1) {
    logger.warn({ email }, 'Service: management login — manager not found or inactive');
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const passwordMatch = await bcrypt.compare(password, manager.Password);
  if (!passwordMatch) {
    logger.warn({ email }, 'Service: management login — password mismatch');
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const cooperativeRows = await repo.findManagerCooperativesForLogin(manager.Id);

  const cooperatives = await Promise.all(
    cooperativeRows.map(async (row) => {
      const permissions =
        row.Role === 'Support'
          ? await repo.getManagerPermissions(manager.Id, row.CooperativeId)
          : [];
      return {
        cooperativeId: row.CooperativeId,
        cooperativeName: row.CooperativeName,
        role: row.Role,
        isDefault: row.IsDefault === 1,
        permissions,
      };
    }),
  );

  const token = jwt.sign(
    { sub: manager.Id, type: 'manager', email: manager.Email },
    env.jwt.secret,
    { expiresIn: `${env.jwt.expirationDays}d` },
  );

  logger.info({ managerId: manager.Id }, 'Service: management login — success');

  return {
    token,
    requiresPasswordChange: manager.DefaultPasswordChanged === 0,
    manager: {
      id: manager.Id,
      fullName: manager.FullName,
      email: manager.Email,
      isActive: manager.IsActive === 1,
      defaultPasswordChanged: manager.DefaultPasswordChanged === 1,
      dateInvited: manager.DateInvited,
    },
    cooperatives,
  };
}

// ─── Request OTP ─────────────────────────────────────────────────────────────
export async function requestOtp(email: string): Promise<void> {
  logger.info({ email }, 'Service: management requestOtp');

  const manager = await repo.findManagerByEmail(email);
  if (!manager || manager.IsActive !== 1) {
    logger.warn({ email }, 'Service: management requestOtp — manager not found or inactive');
    throw new NotFoundError('Manager not found');
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(email, { otp, expiresAt });

  logger.info({ email }, 'Service: management requestOtp — OTP generated');

  await sendMail({
    to: email,
    subject: env.email.subjects.adminOtp,
    text: `Hello ${manager.FullName},\n\nYour OTP for password change is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    template: 'MANAGER_OTP',
    referenceId: manager.Id,
  });

  logger.info({ email }, 'Service: management requestOtp — OTP email sent');
}

// ─── Verify OTP and change password ──────────────────────────────────────────
export async function verifyOtpAndChangePassword(
  email: string,
  otp: string,
  newPassword: string,
): Promise<void> {
  logger.info({ email }, 'Service: management verifyOtpAndChangePassword');

  const stored = otpStore.get(email);
  if (!stored || Date.now() > stored.expiresAt) {
    logger.warn({ email }, 'Service: management verifyOtpAndChangePassword — OTP not found or expired');
    otpStore.delete(email);
    throw new AppError('OTP is invalid or has expired', 400, 'INVALID_OR_EXPIRED_OTP');
  }

  if (stored.otp !== otp) {
    logger.warn({ email }, 'Service: management verifyOtpAndChangePassword — OTP mismatch');
    throw new AppError('OTP is invalid or has expired', 400, 'INVALID_OR_EXPIRED_OTP');
  }

  const manager = await repo.findManagerByEmail(email);
  if (!manager) throw new NotFoundError('Manager not found');

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await repo.updateManagerPassword(manager.Id, hashedPassword);

  otpStore.delete(email);
  logger.info({ managerId: manager.Id }, 'Service: management verifyOtpAndChangePassword — password updated');
}
