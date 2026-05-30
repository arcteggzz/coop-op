import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import {
  NotFoundError,
  ConflictError,
  AppError,
} from "../middlewares/errorHandler";
import { embedlyRequest } from "../utils/embedlyClient";
import * as repo from "../repositories/levies.repository";
import * as cooperativeRepo from "../repositories/cooperatives.repository";
import * as embedlyRepo from "../repositories/embedly.repository";
import * as embedlyTransactionRepo from "../repositories/embedlyTransaction.repository";

function toDateOnly(d: string): string {
  return d.split("T")[0];
}

// ─── Levy: create ─────────────────────────────────────────────────────────────

export async function createLevy(
  dto: {
    name: string;
    description?: string | null;
    defaultAmount: number;
    levyAccountNumber: string;
    dueDate: string;
  },
  cooperativeId: string,
  callerId: string,
  callerType: "Admin" | "Manager",
) {
  logger.info({ cooperativeId, name: dto.name }, "Service: createLevy");

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  const wallet = await repo.findEmbedlyWalletByAccountNumber(
    dto.levyAccountNumber,
  );
  if (!wallet || wallet.OwnerId !== cooperativeId) {
    throw new NotFoundError("Treasury wallet not found for this cooperative");
  }

  const id = uuidv4();
  await repo.createLevy({
    id,
    cooperativeId,
    name: dto.name,
    description: dto.description ?? null,
    defaultAmount: dto.defaultAmount,
    levyAccountNumber: dto.levyAccountNumber,
    dueDate: toDateOnly(dto.dueDate),
    createdById: callerId,
    createdByType: callerType,
  });

  logger.info({ id, cooperativeId }, "Service: createLevy — created");

  return {
    id,
    cooperativeId,
    name: dto.name,
    description: dto.description ?? null,
    defaultAmount: dto.defaultAmount,
    levyAccountNumber: dto.levyAccountNumber,
    dueDate: toDateOnly(dto.dueDate),
    isActive: true,
  };
}

// ─── Levy: list (coop-scoped) ─────────────────────────────────────────────────

export async function listLevies(
  cooperativeId: string,
  query: { page: number; pageSize: number; isActive?: boolean },
) {
  logger.info({ cooperativeId, query }, "Service: listLevies");

  const [data, totalCount] = await Promise.all([
    repo.listLevies(cooperativeId, query.page, query.pageSize, query.isActive),
    repo.countLevies(cooperativeId, query.isActive),
  ]);

  return {
    data: data.map(mapLevy),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / query.pageSize),
  };
}

// ─── Levy: list all (admin global overview) ───────────────────────────────────

export async function listAllLevies(
  filters: { isActive?: boolean; cooperativeId?: string },
  query: { page: number; pageSize: number },
) {
  logger.info({ filters, query }, "Service: listAllLevies");

  const [data, totalCount] = await Promise.all([
    repo.listAllLevies(filters, query.page, query.pageSize),
    repo.countAllLevies(filters),
  ]);

  return {
    data: data.map((l) => ({
      ...mapLevy(l),
      cooperativeName: l.CooperativeName,
    })),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / query.pageSize),
  };
}

// ─── Levy: get one with summary ───────────────────────────────────────────────

export async function getLevyWithSummary(
  cooperativeId: string,
  levyId: string,
) {
  logger.info({ cooperativeId, levyId }, "Service: getLevyWithSummary");

  const levy = await repo.findLevyById(levyId);
  if (!levy || levy.CooperativeId !== cooperativeId) {
    throw new NotFoundError("Levy not found");
  }

  const summary = await repo.getLevySummary(levyId);

  return {
    ...mapLevyFull(levy),
    summary: {
      total: summary ? Number(summary.total) : 0,
      paid: summary ? Number(summary.paid) : 0,
      pending: summary ? Number(summary.pending) : 0,
      waived: summary ? Number(summary.waived) : 0,
      totalExpected: summary ? Number(summary.totalExpected) : 0,
      totalCollected: summary ? Number(summary.totalCollected) : 0,
    },
  };
}

// ─── Levy: update ─────────────────────────────────────────────────────────────

export async function updateLevy(
  cooperativeId: string,
  levyId: string,
  dto: {
    name?: string;
    description?: string | null;
    defaultAmount?: number;
    levyAccountNumber?: string;
    dueDate?: string;
    isActive?: boolean;
  },
) {
  logger.info({ cooperativeId, levyId }, "Service: updateLevy");

  const levy = await repo.findLevyById(levyId);
  if (!levy || levy.CooperativeId !== cooperativeId) {
    throw new NotFoundError("Levy not found");
  }

  if (dto.levyAccountNumber) {
    const wallet = await repo.findEmbedlyWalletByAccountNumber(
      dto.levyAccountNumber,
    );
    if (!wallet || wallet.OwnerId !== cooperativeId) {
      throw new NotFoundError("Treasury wallet not found for this cooperative");
    }
  }

  await repo.updateLevy(levyId, {
    ...dto,
    dueDate: dto.dueDate ? toDateOnly(dto.dueDate) : undefined,
  });
  logger.info({ levyId }, "Service: updateLevy — updated");

  const updated = await repo.findLevyById(levyId);
  return mapLevyFull(updated!);
}

// ─── Levy: soft delete ────────────────────────────────────────────────────────

export async function softDeleteLevy(cooperativeId: string, levyId: string) {
  logger.info({ cooperativeId, levyId }, "Service: softDeleteLevy");

  const levy = await repo.findLevyById(levyId);
  if (!levy || levy.CooperativeId !== cooperativeId) {
    throw new NotFoundError("Levy not found");
  }

  await repo.softDeleteLevy(levyId);
  logger.info({ levyId }, "Service: softDeleteLevy — deleted");
}

// ─── Levy: assign to members ──────────────────────────────────────────────────

export async function assignLevy(
  cooperativeId: string,
  levyId: string,
  dto: {
    assignTo: "all" | "specific";
    memberIds?: string[];
    amountOverrides?: { memberId: string; amount: number }[];
  },
  callerId: string,
  callerType: "Admin" | "Manager",
) {
  logger.info(
    { cooperativeId, levyId, assignTo: dto.assignTo },
    "Service: assignLevy",
  );

  const levy = await repo.findLevyById(levyId);
  if (!levy || levy.CooperativeId !== cooperativeId) {
    throw new NotFoundError("Levy not found");
  }

  let targetMemberIds: string[];

  if (dto.assignTo === "all") {
    const members = await repo.fetchActiveMembersForCooperative(cooperativeId);
    targetMemberIds = members.map((m) => m.Id);
  } else {
    if (!dto.memberIds || dto.memberIds.length === 0) {
      throw new AppError(
        "memberIds is required when assignTo is 'specific'",
        400,
        "MISSING_MEMBER_IDS",
      );
    }
    // Validate all specified members belong to this cooperative
    const validationChecks = await Promise.all(
      dto.memberIds.map((id) =>
        repo.findMemberInCooperative(id, cooperativeId),
      ),
    );
    const invalidIds = dto.memberIds.filter((_, i) => !validationChecks[i]);
    if (invalidIds.length > 0) {
      throw new NotFoundError(
        `Members not found in this cooperative: ${invalidIds.join(", ")}`,
      );
    }
    targetMemberIds = dto.memberIds;
  }

  // Skip already-assigned members
  const existing = await repo.findExistingAssignments(levyId, targetMemberIds);
  const existingSet = new Set(existing.map((e) => e.MemberId));
  const toAssign = targetMemberIds.filter((id) => !existingSet.has(id));
  const skipped = targetMemberIds.length - toAssign.length;

  // Build amount override map
  const overrideMap = new Map<string, number>();
  if (dto.amountOverrides) {
    for (const o of dto.amountOverrides) {
      overrideMap.set(o.memberId, o.amount);
    }
  }

  if (toAssign.length > 0) {
    const rows = toAssign.map((memberId) => ({
      id: uuidv4(),
      levyId,
      memberId,
      cooperativeId,
      amount: overrideMap.get(memberId) ?? Number(levy.DefaultAmount),
      levyAccountNumber: levy.LevyAccountNumber,
    }));
    await repo.bulkInsertLevyAssignments(rows);
  }

  logger.info(
    { levyId, assigned: toAssign.length, skipped, callerType, callerId },
    "Service: assignLevy — assignments created",
  );

  return { levyId, assigned: toAssign.length, skipped };
}

// ─── LevyAssignments: list ────────────────────────────────────────────────────

export async function listLevyAssignments(
  cooperativeId: string,
  levyId: string,
  query: { page: number; pageSize: number; status?: string },
) {
  logger.info({ cooperativeId, levyId, query }, "Service: listLevyAssignments");

  const levy = await repo.findLevyById(levyId);
  if (!levy || levy.CooperativeId !== cooperativeId) {
    throw new NotFoundError("Levy not found");
  }

  const [data, totalCount] = await Promise.all([
    repo.listLevyAssignments(
      levyId,
      cooperativeId,
      query.page,
      query.pageSize,
      query.status,
    ),
    repo.countLevyAssignments(levyId, cooperativeId, query.status),
  ]);

  return {
    data: data.map(mapAssignment),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / query.pageSize),
  };
}

// ─── LevyAssignments: record manual payment ───────────────────────────────────

export async function recordLevyPayment(
  cooperativeId: string,
  assignmentId: string,
  dto: { paidAmount: number; notes?: string | null },
  callerId: string,
  callerType: "Admin" | "Manager",
) {
  logger.info({ cooperativeId, assignmentId }, "Service: recordLevyPayment");

  const assignment = await repo.findAssignmentById(assignmentId);
  if (!assignment || assignment.CooperativeId !== cooperativeId) {
    throw new NotFoundError("Levy assignment not found");
  }

  if (assignment.Status === "Paid") {
    throw new ConflictError(
      "This levy assignment has already been paid",
      "LEVY_ALREADY_PAID",
    );
  }

  const now = new Date().toISOString();
  await repo.updateLevyAssignment(assignmentId, {
    status: "Paid",
    paidDate: now,
    paidAmount: dto.paidAmount,
    notes: dto.notes ?? null,
    recordedById: callerId,
    recordedByType: callerType,
  });

  logger.info(
    { assignmentId, callerType, callerId },
    "Service: recordLevyPayment — recorded",
  );

  return {
    id: assignmentId,
    memberId: assignment.MemberId,
    status: "Paid",
    paidDate: now,
    paidAmount: dto.paidAmount,
  };
}

// ─── LevyAssignments: waive ───────────────────────────────────────────────────

export async function waiveLevyAssignment(
  cooperativeId: string,
  assignmentId: string,
  dto: { notes?: string | null },
  callerId: string,
  callerType: "Admin" | "Manager",
) {
  logger.info({ cooperativeId, assignmentId }, "Service: waiveLevyAssignment");

  const assignment = await repo.findAssignmentById(assignmentId);
  if (!assignment || assignment.CooperativeId !== cooperativeId) {
    throw new NotFoundError("Levy assignment not found");
  }

  if (assignment.Status === "Paid") {
    throw new ConflictError(
      "This levy assignment has already been paid",
      "LEVY_ALREADY_PAID",
    );
  }

  await repo.updateLevyAssignment(assignmentId, {
    status: "Waived",
    notes: dto.notes ?? null,
    recordedById: callerId,
    recordedByType: callerType,
  });

  logger.info(
    { assignmentId, callerType, callerId },
    "Service: waiveLevyAssignment — waived",
  );

  return {
    id: assignmentId,
    memberId: assignment.MemberId,
    status: "Waived",
  };
}

// ─── Member: list assignments ─────────────────────────────────────────────────

export async function listMemberAssignments(
  memberId: string,
  cooperativeId: string,
  query: { page: number; pageSize: number; status?: string },
) {
  logger.info(
    { memberId, cooperativeId, query },
    "Service: listMemberAssignments",
  );

  const [data, totalCount] = await Promise.all([
    repo.listMemberAssignments(
      memberId,
      cooperativeId,
      query.page,
      query.pageSize,
      query.status,
    ),
    repo.countMemberAssignments(memberId, cooperativeId, query.status),
  ]);

  return {
    data: data.map((a) => ({
      id: a.Id,
      levyId: a.LevyId,
      levyName: a.LevyName,
      amount: Number(a.Amount),
      dueDate: a.LevyDueDate,
      status: a.Status,
      paidDate: a.PaidDate ?? null,
      paidAmount: a.PaidAmount != null ? Number(a.PaidAmount) : null,
    })),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / query.pageSize),
  };
}

// ─── Member: get single assignment ───────────────────────────────────────────

export async function getMemberAssignment(
  memberId: string,
  cooperativeId: string,
  assignmentId: string,
) {
  logger.info(
    { memberId, cooperativeId, assignmentId },
    "Service: getMemberAssignment",
  );

  const assignment = await repo.findMemberAssignment(
    assignmentId,
    memberId,
    cooperativeId,
  );
  if (!assignment) {
    throw new NotFoundError("Levy assignment not found");
  }

  return {
    id: assignment.Id,
    levyId: assignment.LevyId,
    levyName: assignment.LevyName,
    amount: Number(assignment.Amount),
    dueDate: assignment.LevyDueDate,
    status: assignment.Status,
    paidDate: assignment.PaidDate ?? null,
    paidAmount:
      assignment.PaidAmount != null ? Number(assignment.PaidAmount) : null,
  };
}

// ─── Member: pay from wallet ──────────────────────────────────────────────────

export async function payLevyFromWallet(
  memberId: string,
  cooperativeId: string,
  assignmentId: string,
) {
  logger.info(
    { memberId, cooperativeId, assignmentId },
    "Service: payLevyFromWallet",
  );

  const assignment = await repo.findMemberAssignment(
    assignmentId,
    memberId,
    cooperativeId,
  );
  if (!assignment) {
    throw new NotFoundError("Levy assignment not found");
  }

  if (assignment.Status === "Paid" || assignment.Status === "Waived") {
    throw new ConflictError(
      "This levy has already been paid or waived",
      "LEVY_ALREADY_PAID",
    );
  }

  // Fetch member wallet
  const memberWallet =
    await embedlyRepo.findMemberEmbedlyWalletByOwnerAndCooperative(
      memberId,
      cooperativeId,
    );
  if (!memberWallet) {
    throw new AppError(
      "Member wallet not found",
      400,
      "MEMBER_WALLET_NOT_FOUND",
    );
  }

  // Check balance
  const balanceResponse = await embedlyRequest<{
    data: { availableBalance: number };
  }>(
    "GET",
    `${env.embedly.urls.getWalletByAccountNumber}/${memberWallet.AccountNumber}`,
  );
  const availableBalance = balanceResponse.data.data.availableBalance;
  const amountToPay = Number(assignment.Amount);

  if (availableBalance < amountToPay) {
    throw new AppError(
      "Insufficient wallet balance to pay this levy",
      400,
      "INSUFFICIENT_WALLET_BALANCE",
    );
  }

  const levyAccountNumber = assignment.LevyAccountNumber ?? "";
  const remarks = `Levy payment: ${assignment.LevyName}`;
  const txRef = `COOP-LEVY-${assignmentId}`;

  // Execute wallet-to-wallet transfer
  await embedlyRequest("PUT", env.embedly.urls.walletToWallet, {
    fromAccount: memberWallet.AccountNumber,
    toAccount: levyAccountNumber,
    amount: amountToPay,
    transactionReference: txRef,
    remarks,
  });

  // Save transaction record
  await embedlyTransactionRepo.saveEmbedlyTransaction(
    memberWallet.AccountNumber,
    levyAccountNumber,
    amountToPay,
    txRef,
    true,
    "WalletToWallet",
  );

  logger.info(
    { assignmentId, memberId, amount: amountToPay },
    "Service: payLevyFromWallet — wallet transfer completed",
  );

  const now = new Date().toISOString();
  await repo.updateLevyAssignment(assignmentId, {
    status: "Paid",
    paidDate: now,
    paidAmount: amountToPay,
    recordedById: memberId,
    recordedByType: "Member",
  });

  logger.info(
    { assignmentId },
    "Service: payLevyFromWallet — assignment recorded",
  );

  return {
    id: assignmentId,
    levyName: assignment.LevyName,
    status: "Paid",
    paidDate: now,
    paidAmount: amountToPay,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapLevy(l: repo.LevyRow) {
  return {
    id: l.Id,
    cooperativeId: l.CooperativeId,
    name: l.Name,
    defaultAmount: Number(l.DefaultAmount),
    levyAccountNumber: l.LevyAccountNumber,
    dueDate: l.DueDate,
    isActive: l.IsActive === 1,
    createdByName: l.CreatedByName ?? null,
    createdByType: l.CreatedByType ?? null,
    assignedCount: Number(l.AssignedCount ?? 0),
    dateCreated: l.DateCreated,
  };
}

function mapLevyFull(l: repo.LevyRow) {
  return {
    ...mapLevy(l),
    description: l.Description ?? null,
    dateUpdated: l.DateUpdated ?? null,
  };
}

function mapAssignment(a: repo.LevyAssignmentListRow) {
  return {
    id: a.Id,
    levyId: a.LevyId,
    memberId: a.MemberId,
    memberFullName: a.MemberFullName,
    levyName: a.LevyName,
    amount: Number(a.Amount),
    levyAccountNumber: a.LevyAccountNumber ?? null,
    status: a.Status,
    paidDate: a.PaidDate ?? null,
    paidAmount: a.PaidAmount != null ? Number(a.PaidAmount) : null,
    notes: a.Notes ?? null,
    dateCreated: a.DateCreated,
  };
}
