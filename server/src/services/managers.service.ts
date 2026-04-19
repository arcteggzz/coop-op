import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import {
  NotFoundError,
  ConflictError,
  AppError,
  ForbiddenError,
} from "../middlewares/errorHandler";
import { sendMail } from "../utils/mailer";
import * as repo from "../repositories/managers.repository";
import * as cooperativeRepo from "../repositories/cooperatives.repository";

// ─── Invite Manager ───────────────────────────────────────────────────────────

export async function inviteManager(
  dto: {
    fullName: string;
    email: string;
    role: string;
    permissions?: string[];
  },
  cooperativeId: string,
  callingAdminId: string,
) {
  logger.info(
    { email: dto.email, role: dto.role, cooperativeId },
    "Service: inviteManager",
  );

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  // Only one RootManager per cooperative
  if (dto.role === "RootManager") {
    const existingRoot =
      await repo.findRootManagerForCooperative(cooperativeId);
    if (existingRoot) {
      logger.warn(
        { cooperativeId },
        "Service: inviteManager — RootManager already exists",
      );
      throw new ConflictError(
        "This cooperative already has a RootManager. Use transfer-root to reassign.",
        "ROOT_MANAGER_EXISTS",
      );
    }
  }

  let managerId: string;
  let isNewManager = false;

  const existingManager = await repo.findManagerByEmail(dto.email);
  if (existingManager) {
    managerId = existingManager.Id;
    logger.info(
      { managerId, cooperativeId },
      "Service: inviteManager — reusing existing ManagementUser",
    );

    const existingLink = await repo.findManagerCooperativeLink(
      managerId,
      cooperativeId,
    );
    if (existingLink) {
      throw new ConflictError(
        "Manager is already a manager of this cooperative",
        "MANAGER_ALREADY_IN_COOPERATIVE",
      );
    }
  } else {
    managerId = uuidv4();
    isNewManager = true;
    const hashedPassword = await bcrypt.hash(env.auth.defaultPassword, 10);
    await repo.createManager({
      id: managerId,
      fullName: dto.fullName,
      email: dto.email,
      hashedPassword,
      invitedByAdminId: callingAdminId,
      invitedByAdminType: "Admin",
    });
    logger.info(
      { managerId },
      "Service: inviteManager — ManagementUser created",
    );
  }

  const linkId = uuidv4();
  await repo.createManagerCooperativeLink({
    id: linkId,
    managerId,
    cooperativeId,
    role: dto.role,
    isDefault: isNewManager,
  });
  logger.info(
    { managerId, cooperativeId, role: dto.role },
    "Service: inviteManager — cooperative link created",
  );

  if (dto.role === "Support" && dto.permissions && dto.permissions.length > 0) {
    await repo.insertManagerPermissions(
      managerId,
      cooperativeId,
      dto.permissions,
    );
    logger.info(
      { managerId, cooperativeId },
      "Service: inviteManager — permissions inserted",
    );
  }

  if (isNewManager) {
    await sendMail({
      to: dto.email,
      subject: env.email.subjects.adminInvite,
      text: `Hello ${dto.fullName},\n\nYou have been invited to manage ${cooperative.Name} on Coop-op.\n\nEmail: ${dto.email}\nRole: ${dto.role}\nDefault Password: ${env.auth.defaultPassword}\n\nPlease change your password on first login.`,
      template: "MANAGER_INVITE",
      referenceId: managerId,
    });
    logger.info({ managerId }, "Service: inviteManager — invite email sent");
  }

  const manager = await repo.findManagerById(managerId);
  return {
    id: manager!.Id,
    fullName: manager!.FullName,
    email: manager!.Email,
    role: dto.role,
    cooperativeId,
    dateInvited: manager!.DateInvited,
  };
}

// ─── List Managers ────────────────────────────────────────────────────────────

export async function listManagers(
  cooperativeId: string,
  query: { page: number; pageSize: number },
) {
  logger.info({ cooperativeId, query }, "Service: listManagers");

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  const [data, totalCount] = await Promise.all([
    repo.listManagersForCooperative(cooperativeId, query.page, query.pageSize),
    repo.countManagersForCooperative(cooperativeId),
  ]);

  const totalPages = Math.ceil(totalCount / query.pageSize);
  logger.info({ cooperativeId, totalCount }, "Service: listManagers — result");

  return {
    data: data.map((m) => ({
      id: m.Id,
      fullName: m.FullName,
      email: m.Email,
      role: m.Role,
      isActive: m.IsActive === 1,
      isDefault: m.IsDefault === 1,
      dateInvited: m.DateInvited,
      dateCreated: m.DateCreated,
    })),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages,
  };
}

// ─── Get Manager by ID ────────────────────────────────────────────────────────

export async function getManager(cooperativeId: string, managerId: string) {
  logger.info({ cooperativeId, managerId }, "Service: getManager");

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  const manager = await repo.findManagerById(managerId);
  if (!manager) throw new NotFoundError("Manager not found");

  const link = await repo.findManagerCooperativeLink(managerId, cooperativeId);
  if (!link) throw new NotFoundError("Manager is not part of this cooperative");

  const permissions =
    link.Role === "Support"
      ? await repo.getManagerPermissions(managerId, cooperativeId)
      : [];

  logger.info({ cooperativeId, managerId }, "Service: getManager — found");

  return {
    id: manager.Id,
    fullName: manager.FullName,
    email: manager.Email,
    role: link.Role,
    isActive: manager.IsActive === 1,
    isDefault: link.IsDefault === 1,
    cooperativeId,
    dateInvited: manager.DateInvited,
    dateCreated: manager.DateCreated,
    permissions,
  };
}

// ─── Update Manager Permissions ───────────────────────────────────────────────

export async function updateManagerPermissions(
  cooperativeId: string,
  managerId: string,
  permissions: string[],
) {
  logger.info(
    { cooperativeId, managerId },
    "Service: updateManagerPermissions",
  );

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  const manager = await repo.findManagerById(managerId);
  if (!manager) throw new NotFoundError("Manager not found");

  const link = await repo.findManagerCooperativeLink(managerId, cooperativeId);
  if (!link) throw new NotFoundError("Manager is not part of this cooperative");

  if (link.Role !== "Support") {
    logger.warn(
      { managerId, role: link.Role },
      "Service: updateManagerPermissions — not a Support manager",
    );
    throw new AppError(
      "Permissions can only be set for Support role managers",
      400,
      "CANNOT_MODIFY_NON_SUPPORT_PERMISSIONS",
    );
  }

  await repo.replaceManagerPermissions(managerId, cooperativeId, permissions);
  const updatedPermissions = await repo.getManagerPermissions(
    managerId,
    cooperativeId,
  );
  logger.info(
    { cooperativeId, managerId },
    "Service: updateManagerPermissions — replaced",
  );

  return {
    id: manager.Id,
    fullName: manager.FullName,
    email: manager.Email,
    role: link.Role,
    cooperativeId,
    permissions: updatedPermissions,
  };
}

// ─── Revoke Manager ───────────────────────────────────────────────────────────

export async function revokeManager(cooperativeId: string, managerId: string) {
  logger.info({ cooperativeId, managerId }, "Service: revokeManager");

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  const manager = await repo.findManagerById(managerId);
  if (!manager) throw new NotFoundError("Manager not found");

  const link = await repo.findManagerCooperativeLink(managerId, cooperativeId);
  if (!link) throw new NotFoundError("Manager is not part of this cooperative");

  if (link.Role === "RootManager") {
    throw new ForbiddenError(
      "Cannot revoke a RootManager. Use transfer-root first.",
      "CANNOT_REVOKE_ROOT_MANAGER",
    );
  }

  await repo.softDeleteManagerCooperativeLink(managerId, cooperativeId);
  logger.info(
    { cooperativeId, managerId },
    "Service: revokeManager — access revoked",
  );
}

// ─── Transfer Root ────────────────────────────────────────────────────────────

export async function transferRoot(
  cooperativeId: string,
  targetManagerId: string,
) {
  logger.info({ cooperativeId, targetManagerId }, "Service: transferRoot");

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  const targetManager = await repo.findManagerById(targetManagerId);
  if (!targetManager) throw new NotFoundError("Target manager not found");

  const targetLink = await repo.findManagerCooperativeLink(
    targetManagerId,
    cooperativeId,
  );
  if (!targetLink)
    throw new NotFoundError("Target manager is not part of this cooperative");

  if (targetLink.Role === "RootManager") {
    throw new ConflictError(
      "Target manager is already the RootManager",
      "ALREADY_ROOT_MANAGER",
    );
  }

  const currentRoot = await repo.findRootManagerForCooperative(cooperativeId);
  if (!currentRoot) {
    throw new AppError(
      "No current RootManager found for this cooperative",
      400,
      "NO_ROOT_MANAGER",
    );
  }

  // Demote current root → SuperManager, then promote target → RootManager
  await repo.updateManagerCooperativeRole(
    currentRoot.ManagerId,
    cooperativeId,
    "SuperManager",
  );
  await repo.updateManagerCooperativeRole(
    targetManagerId,
    cooperativeId,
    "RootManager",
  );
  logger.info(
    {
      cooperativeId,
      previousRoot: currentRoot.ManagerId,
      newRoot: targetManagerId,
    },
    "Service: transferRoot — complete",
  );
}
