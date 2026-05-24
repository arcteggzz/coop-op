import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { NotFoundError, ConflictError } from "../middlewares/errorHandler";
import * as repo from "../repositories/cooperatives.repository";
import { countManagersForCooperative } from "../repositories/managers.repository";
import { countMembersForCooperative } from "../repositories/members.repository";
import { publishToQueue } from "../utils/queue";

// ─── Create Cooperative ───────────────────────────────────────────────────────

export async function createCooperative(
  dto: { name: string },
  callingAdminId: string,
) {
  logger.info({ name: dto.name, callingAdminId }, "Service: createCooperative");

  const existing = await repo.findCooperativeByName(dto.name);
  if (existing) {
    logger.warn(
      { name: dto.name },
      "Service: createCooperative — name already exists",
    );
    throw new ConflictError(
      "A cooperative with this name already exists",
      "COOPERATIVE_NAME_EXISTS",
    );
  }

  const id = uuidv4();
  await repo.createCooperative({
    id,
    name: dto.name,
    createdByAdminId: callingAdminId,
    createdByAdminType: "Admin",
  });

  logger.info({ cooperativeId: id }, "Service: createCooperative — created");

  const cooperative = await repo.findCooperativeById(id);
  return {
    id: cooperative!.Id,
    name: cooperative!.Name,
    createdByAdminId: cooperative!.CreatedByAdminId,
    dateCreated: cooperative!.DateCreated,
  };
}

// ─── List Cooperatives ────────────────────────────────────────────────────────

export async function listCooperatives(query: {
  page: number;
  pageSize: number;
  name?: string;
}) {
  logger.info({ query }, "Service: listCooperatives");
  const filters = { name: query.name };
  const [data, totalCount] = await Promise.all([
    repo.listCooperatives(filters, query.page, query.pageSize),
    repo.countCooperatives(filters),
  ]);

  const totalPages = Math.ceil(totalCount / query.pageSize);
  logger.info(
    { totalCount, page: query.page },
    "Service: listCooperatives — result",
  );

  return {
    data: data.map((c) => ({
      id: c.Id,
      name: c.Name,
      createdByAdminId: c.CreatedByAdminId,
      createdByAdminName: c.CreatedByAdminName ?? null,
      memberCount: Number(c.MemberCount) ?? 0,
      managerCount: Number(c.ManagerCount) ?? 0,
      dateCreated: c.DateCreated,
    })),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages,
  };
}

// ─── Get Cooperative by ID ────────────────────────────────────────────────────

export async function getCooperativeById(cooperativeId: string) {
  logger.info({ cooperativeId }, "Service: getCooperativeById");
  const cooperative = await repo.findCooperativeById(cooperativeId);
  if (!cooperative) {
    logger.warn({ cooperativeId }, "Service: getCooperativeById — not found");
    throw new NotFoundError("Cooperative not found");
  }

  const [properties, managerCount, memberCount] = await Promise.all([
    repo.findCooperativePropertiesById(cooperativeId),
    countManagersForCooperative(cooperativeId),
    countMembersForCooperative(cooperativeId),
  ]);
  logger.info({ cooperativeId }, "Service: getCooperativeById — found");

  return {
    id: cooperative.Id,
    name: cooperative.Name,
    createdByAdminId: cooperative.CreatedByAdminId,
    createdByAdminName: cooperative.CreatedByAdminName ?? null,
    dateCreated: cooperative.DateCreated,
    dateUpdated: cooperative.DateUpdated,
    managerCount,
    memberCount,
    properties: properties.map((p) => ({
      id: p.Id,
      key: p.Key,
      value: p.Value,
      groupName: p.GroupName,
      isActive: p.IsActive === 1,
    })),
  };
}

// ─── Update Cooperative ───────────────────────────────────────────────────────

export async function updateCooperative(
  cooperativeId: string,
  dto: { name: string },
) {
  logger.info({ cooperativeId, name: dto.name }, "Service: updateCooperative");
  const cooperative = await repo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  const nameConflict = await repo.findCooperativeByName(dto.name);
  if (nameConflict && nameConflict.Id !== cooperativeId) {
    throw new ConflictError(
      "A cooperative with this name already exists",
      "COOPERATIVE_NAME_EXISTS",
    );
  }

  await repo.updateCooperativeName(cooperativeId, dto.name);
  logger.info({ cooperativeId }, "Service: updateCooperative — updated");

  return { id: cooperativeId, name: dto.name };
}

// ─── Create Cooperative Wallet ────────────────────────────────────────────────

export async function createCooperativeWallet(
  cooperativeId: string,
  walletName: string,
) {
  logger.info(
    { cooperativeId, walletName },
    "Service: createCooperativeWallet",
  );

  const cooperative = await repo.findCooperativeById(cooperativeId);
  if (!cooperative) {
    logger.warn(
      { cooperativeId },
      "Service: createCooperativeWallet — cooperative not found",
    );
    throw new NotFoundError("Cooperative not found");
  }

  await publishToQueue("create-cooperative-wallet", {
    cooperativeId,
    walletName,
  });
  logger.info(
    { cooperativeId, walletName },
    "Service: createCooperativeWallet — wallet creation queued",
  );

  return {
    id: cooperative.Id,
    name: cooperative.Name,
    dateCreated: cooperative.DateCreated,
  };
}

// ─── Delete Cooperative ───────────────────────────────────────────────────────

export async function deleteCooperative(cooperativeId: string) {
  logger.info({ cooperativeId }, "Service: deleteCooperative");
  const cooperative = await repo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  await repo.softDeleteCooperative(cooperativeId);
  logger.info({ cooperativeId }, "Service: deleteCooperative — soft deleted");
}
