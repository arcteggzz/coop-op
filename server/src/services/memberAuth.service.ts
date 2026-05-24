import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ForbiddenError } from '../middlewares/errorHandler';
import { sendMail } from '../utils/mailer';
import * as repo from '../repositories/members.repository';
import * as cooperativeRepo from '../repositories/cooperatives.repository';

// ─── OTP store (in-memory, 10-minute TTL) ────────────────────────────────────
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Login ───────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  logger.info({ email }, 'Service: member login');

  const member = await repo.findMemberByEmail(email);
  if (!member || member.IsActive !== 1) {
    logger.warn({ email }, 'Service: member login — member not found or inactive');
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const passwordMatch = await bcrypt.compare(password, member.Password);
  if (!passwordMatch) {
    logger.warn({ email }, 'Service: member login — password mismatch');
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const cooperativeRows = await repo.findMemberCooperativesForLogin(member.Id);

  const cooperatives = cooperativeRows.map((row) => ({
    cooperativeId: row.CooperativeId,
    cooperativeName: row.CooperativeName,
    isDefault: row.IsDefault === 1,
  }));

  const token = jwt.sign(
    { sub: member.Id, type: 'member', email: member.Email },
    env.jwt.secret,
    { expiresIn: `${env.jwt.expirationDays}d` },
  );

  logger.info({ memberId: member.Id }, 'Service: member login — success');

  return {
    token,
    requiresPasswordChange: member.DefaultPasswordChanged === 0,
    member: {
      id: member.Id,
      fullName: `${member.FirstName} ${member.LastName}`,
      email: member.Email,
      isActive: member.IsActive === 1,
      defaultPasswordChanged: member.DefaultPasswordChanged === 1,
      dateInvited: member.DateInvited,
    },
    cooperatives,
  };
}

// ─── Request OTP ─────────────────────────────────────────────────────────────
export async function requestOtp(email: string): Promise<void> {
  logger.info({ email }, 'Service: member requestOtp');

  const member = await repo.findMemberByEmail(email);
  if (!member || member.IsActive !== 1) {
    logger.warn({ email }, 'Service: member requestOtp — member not found or inactive');
    throw new NotFoundError('Member not found');
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(email, { otp, expiresAt });

  logger.info({ email }, 'Service: member requestOtp — OTP generated');

  await sendMail({
    to: email,
    subject: env.email.subjects.adminOtp,
    text: `Hello ${member.FirstName},\n\nYour OTP for password change is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    template: 'MEMBER_OTP',
    referenceId: member.Id,
  });

  logger.info({ email }, 'Service: member requestOtp — OTP email sent');
}

// ─── Verify OTP and change password ──────────────────────────────────────────
export async function verifyOtpAndChangePassword(
  email: string,
  otp: string,
  newPassword: string,
): Promise<void> {
  logger.info({ email }, 'Service: member verifyOtpAndChangePassword');

  const stored = otpStore.get(email);
  if (!stored || Date.now() > stored.expiresAt) {
    logger.warn({ email }, 'Service: member verifyOtpAndChangePassword — OTP not found or expired');
    otpStore.delete(email);
    throw new AppError('OTP is invalid or has expired', 400, 'INVALID_OR_EXPIRED_OTP');
  }

  if (stored.otp !== otp) {
    logger.warn({ email }, 'Service: member verifyOtpAndChangePassword — OTP mismatch');
    throw new AppError('OTP is invalid or has expired', 400, 'INVALID_OR_EXPIRED_OTP');
  }

  const member = await repo.findMemberByEmail(email);
  if (!member) throw new NotFoundError('Member not found');

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await repo.updateMemberPassword(member.Id, hashedPassword);

  otpStore.delete(email);
  logger.info({ memberId: member.Id }, 'Service: member verifyOtpAndChangePassword — password updated');
}

// ─── Get Dashboard ────────────────────────────────────────────────────────────
export async function getDashboard(memberId: string, cooperativeId: string) {
  logger.info({ memberId, cooperativeId }, 'Service: member getDashboard');

  const member = await repo.findMemberById(memberId);
  if (!member || member.IsActive !== 1) {
    throw new ForbiddenError('Member account is inactive', 'MEMBER_INACTIVE');
  }

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError('Cooperative not found');

  const cooperativeRows = await repo.findMemberCooperativesForLogin(memberId);
  const cooperatives = cooperativeRows.map((row) => ({
    cooperativeId: row.CooperativeId,
    cooperativeName: row.CooperativeName,
    isDefault: row.IsDefault === 1,
  }));

  logger.info({ memberId, cooperativeId }, 'Service: member getDashboard — success');

  return {
    member: {
      id: member.Id,
      fullName: `${member.FirstName} ${member.LastName}`,
      email: member.Email,
    },
    activeCooperative: {
      cooperativeId: cooperative.Id,
      cooperativeName: cooperative.Name,
    },
    cooperatives,
  };
}
