import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../middlewares/errorHandler";
import { sendMail } from "../utils/mailer";
import * as repo from "../repositories/adminManagement.repository";

// ─── Invite Admin ─────────────────────────────────────────────────────────────
export async function inviteAdmin(
  dto: {
    fullName: string;
    email: string;
    role: string;
    permissions?: string[];
  },
  callingAdminId: string,
) {
  logger.info({ email: dto.email, role: dto.role }, "Service: inviteAdmin");

  const existing = await repo.findAdminByEmail(dto.email);
  if (existing) {
    logger.warn(
      { email: dto.email },
      "Service: inviteAdmin — email already exists",
    );
    throw new ConflictError(
      "Email is already registered",
      "EMAIL_ALREADY_EXISTS",
    );
  }

  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(env.auth.defaultPassword, 10);
  await repo.createAdmin({
    id,
    fullName: dto.fullName,
    email: dto.email,
    hashedPassword,
    role: dto.role,
    invitedByAdminId: callingAdminId,
  });

  if (dto.role === "Admin" && dto.permissions && dto.permissions.length > 0) {
    await repo.insertAdminPermissions(id, dto.permissions);
  }

  logger.info(
    { adminId: id },
    "Service: inviteAdmin — admin created, sending invite email",
  );

  await sendMail({
    to: dto.email,
    subject: env.email.subjects.adminInvite,
    text: `Hello ${dto.fullName},\n\nYou have been invited to the Coop-op Admin Portal.\n\nEmail: ${dto.email}\nRole: ${dto.role}\nDefault Password: ${env.auth.defaultPassword}\n\nLogin at: ${env.clientUrl}/admin/login\n\nPlease change your password on first login.`,
    template: "ADMIN_INVITE",
    referenceId: id,
  });

  logger.info({ adminId: id }, "Service: inviteAdmin — invite email sent");

  const newAdmin = await repo.findAdminById(id);
  return {
    id: newAdmin!.Id,
    fullName: newAdmin!.FullName,
    email: newAdmin!.Email,
    role: newAdmin!.Role,
    dateInvited: newAdmin!.DateInvited,
  };
}

// ─── List Admins ──────────────────────────────────────────────────────────────
export async function listAdmins(query: {
  page: number;
  pageSize: number;
  role?: string;
  isActive?: number;
}) {
  logger.info({ query }, "Service: listAdmins");
  const filters = { role: query.role, isActive: query.isActive };
  const [data, totalCount] = await Promise.all([
    repo.listAdmins(filters, query.page, query.pageSize),
    repo.countAdmins(filters),
  ]);

  const totalPages = Math.ceil(totalCount / query.pageSize);
  logger.info({ totalCount, page: query.page }, "Service: listAdmins — result");

  return {
    data: data.map((a) => ({
      id: a.Id,
      fullName: a.FullName,
      email: a.Email,
      role: a.Role,
      isActive: a.IsActive === 1,
      defaultPasswordChanged: a.DefaultPasswordChanged === 1,
      dateInvited: a.DateInvited,
      dateCreated: a.DateCreated,
    })),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages,
  };
}

// ─── Get Admin by ID ──────────────────────────────────────────────────────────
export async function getAdminById(adminId: string) {
  logger.info({ adminId }, "Service: getAdminById");
  const admin = await repo.findAdminById(adminId);
  if (!admin) {
    logger.warn({ adminId }, "Service: getAdminById — not found");
    throw new NotFoundError("Admin not found");
  }

  // Permissions only populated for Admin role; SuperAdmin/RootAdmin have implicit full access
  const permissions =
    admin.Role === "Admin" ? await repo.getAdminPermissions(adminId) : [];
  logger.info({ adminId }, "Service: getAdminById — found");

  return {
    id: admin.Id,
    fullName: admin.FullName,
    email: admin.Email,
    role: admin.Role,
    isActive: admin.IsActive === 1,
    defaultPasswordChanged: admin.DefaultPasswordChanged === 1,
    dateInvited: admin.DateInvited,
    dateCreated: admin.DateCreated,
    permissions,
  };
}

// ─── Update Permissions ───────────────────────────────────────────────────────
export async function updatePermissions(
  adminId: string,
  permissions: string[],
) {
  logger.info({ adminId }, "Service: updatePermissions");
  const admin = await repo.findAdminById(adminId);
  if (!admin) throw new NotFoundError("Admin not found");

  if (admin.Role === "SuperAdmin" || admin.Role === "RootAdmin") {
    logger.warn(
      { adminId, role: admin.Role },
      "Service: updatePermissions — cannot modify super/root",
    );
    throw new AppError(
      "Cannot modify permissions for SuperAdmin or RootAdmin",
      400,
      "CANNOT_MODIFY_SUPER_ADMIN_PERMISSIONS",
    );
  }

  await repo.replaceAdminPermissions(adminId, permissions);
  const updatedPermissions = await repo.getAdminPermissions(adminId);
  logger.info({ adminId }, "Service: updatePermissions — permissions replaced");

  return {
    id: admin.Id,
    fullName: admin.FullName,
    email: admin.Email,
    role: admin.Role,
    permissions: updatedPermissions,
  };
}

// ─── Revoke Admin ─────────────────────────────────────────────────────────────
export async function revokeAdmin(adminId: string, callingRole: string) {
  logger.info({ adminId, callingRole }, "Service: revokeAdmin");
  const target = await repo.findAdminById(adminId);
  if (!target) throw new NotFoundError("Admin not found");

  // SuperAdmin cannot revoke another SuperAdmin — only RootAdmin can
  if (callingRole === "SuperAdmin" && target.Role === "SuperAdmin") {
    logger.warn(
      { adminId },
      "Service: revokeAdmin — SuperAdmin cannot revoke SuperAdmin",
    );
    throw new ForbiddenError(
      "Insufficient permissions to revoke a SuperAdmin",
      "INSUFFICIENT_PERMISSIONS",
    );
  }

  await repo.setAdminIsActive(adminId, 0);
  logger.info({ adminId }, "Service: revokeAdmin — access revoked");
}

// ─── Restore Admin ────────────────────────────────────────────────────────────
export async function restoreAdmin(adminId: string) {
  logger.info({ adminId }, "Service: restoreAdmin");
  const admin = await repo.findAdminById(adminId);
  if (!admin) throw new NotFoundError("Admin not found");

  await repo.setAdminIsActive(adminId, 1);
  logger.info({ adminId }, "Service: restoreAdmin — access restored");
}

// ─── Delete Admin ─────────────────────────────────────────────────────────────
export async function deleteAdmin(adminId: string, callingAdminId: string) {
  logger.info({ adminId, callingAdminId }, "Service: deleteAdmin");

  if (adminId === callingAdminId) {
    throw new ForbiddenError(
      "Cannot delete your own account",
      "INSUFFICIENT_PERMISSIONS",
    );
  }

  const target = await repo.findAdminById(adminId);
  if (!target) throw new NotFoundError("Admin not found");

  if (target.Role === "RootAdmin") {
    throw new ForbiddenError(
      "Cannot delete a RootAdmin",
      "INSUFFICIENT_PERMISSIONS",
    );
  }

  await repo.softDeleteAdmin(adminId);
  logger.info({ adminId }, "Service: deleteAdmin — admin soft deleted");
}
