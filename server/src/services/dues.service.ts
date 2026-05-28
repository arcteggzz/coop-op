import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import {
  NotFoundError,
  ConflictError,
  AppError,
} from "../middlewares/errorHandler";
import { embedlyRequest } from "../utils/embedlyClient";
import * as repo from "../repositories/dues.repository";
import * as cooperativeRepo from "../repositories/cooperatives.repository";
import * as embedlyRepo from "../repositories/embedly.repository";
import * as embedlyTransactionRepo from "../repositories/embedlyTransaction.repository";

// Strips ISO timestamp down to YYYY-MM-DD for MySQL DATE columns
function toDateOnly(d: string): string {
  return d.split("T")[0];
}

// ─── Schedule: create ─────────────────────────────────────────────────────────

export async function createDueSchedule(
  dto: {
    name: string;
    description?: string | null;
    amount: number;
    frequency: string;
    startDate: string;
    endDate?: string | null;
    dueAccountNumber: string;
  },
  cooperativeId: string,
  callerId: string,
  callerType: "Admin" | "Manager",
) {
  logger.info({ cooperativeId, name: dto.name }, "Service: createDueSchedule");

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  const wallet = await repo.findEmbedlyWalletByAccountNumber(
    dto.dueAccountNumber,
  );
  if (!wallet || wallet.OwnerId !== cooperativeId) {
    throw new NotFoundError("Treasury wallet not found for this cooperative");
  }

  const id = uuidv4();
  await repo.createDueSchedule({
    id,
    cooperativeId,
    name: dto.name,
    description: dto.description ?? null,
    amount: dto.amount,
    frequency: dto.frequency,
    startDate: toDateOnly(dto.startDate),
    endDate: dto.endDate ? toDateOnly(dto.endDate) : null,
    dueAccountNumber: dto.dueAccountNumber,
    createdById: callerId,
    createdByType: callerType,
  });

  logger.info({ id, cooperativeId }, "Service: createDueSchedule — created");

  return {
    id,
    cooperativeId,
    name: dto.name,
    description: dto.description ?? null,
    amount: dto.amount,
    frequency: dto.frequency,
    startDate: dto.startDate,
    endDate: dto.endDate ?? null,
    dueAccountNumber: dto.dueAccountNumber,
    isActive: true,
  };
}

// ─── Schedule: list ───────────────────────────────────────────────────────────

export async function listDueSchedules(
  cooperativeId: string,
  query: { page: number; pageSize: number; isActive?: boolean },
) {
  logger.info({ cooperativeId, query }, "Service: listDueSchedules");

  const [data, totalCount] = await Promise.all([
    repo.listDueSchedules(
      cooperativeId,
      query.page,
      query.pageSize,
      query.isActive,
    ),
    repo.countDueSchedules(cooperativeId, query.isActive),
  ]);

  return {
    data: data.map(mapSchedule),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / query.pageSize),
  };
}

// ─── Schedule: get one ────────────────────────────────────────────────────────

export async function getDueSchedule(
  cooperativeId: string,
  scheduleId: string,
) {
  logger.info({ cooperativeId, scheduleId }, "Service: getDueSchedule");

  const schedule = await repo.findDueScheduleById(scheduleId);
  if (!schedule || schedule.CooperativeId !== cooperativeId) {
    throw new NotFoundError("Due schedule not found");
  }

  return mapScheduleFull(schedule);
}

// ─── Schedule: update ─────────────────────────────────────────────────────────

export async function updateDueSchedule(
  cooperativeId: string,
  scheduleId: string,
  dto: {
    name?: string;
    description?: string | null;
    amount?: number;
    frequency?: string;
    startDate?: string;
    endDate?: string | null;
    dueAccountNumber?: string;
    isActive?: boolean;
  },
) {
  logger.info({ cooperativeId, scheduleId }, "Service: updateDueSchedule");

  const schedule = await repo.findDueScheduleById(scheduleId);
  if (!schedule || schedule.CooperativeId !== cooperativeId) {
    throw new NotFoundError("Due schedule not found");
  }

  if (dto.dueAccountNumber) {
    const wallet = await repo.findEmbedlyWalletByAccountNumber(
      dto.dueAccountNumber,
    );
    if (!wallet || wallet.OwnerId !== cooperativeId) {
      throw new NotFoundError("Treasury wallet not found for this cooperative");
    }
  }

  await repo.updateDueSchedule(scheduleId, {
    ...dto,
    startDate: dto.startDate ? toDateOnly(dto.startDate) : undefined,
    endDate: dto.endDate ? toDateOnly(dto.endDate) : dto.endDate,
  });
  logger.info({ scheduleId }, "Service: updateDueSchedule — updated");

  const updated = await repo.findDueScheduleById(scheduleId);
  return mapScheduleFull(updated!);
}

// ─── Schedule: delete ─────────────────────────────────────────────────────────

export async function deleteDueSchedule(
  cooperativeId: string,
  scheduleId: string,
) {
  logger.info({ cooperativeId, scheduleId }, "Service: deleteDueSchedule");

  const schedule = await repo.findDueScheduleById(scheduleId);
  if (!schedule || schedule.CooperativeId !== cooperativeId) {
    throw new NotFoundError("Due schedule not found");
  }

  await repo.softDeleteDueSchedule(scheduleId);
  logger.info({ scheduleId }, "Service: deleteDueSchedule — deleted");
}

// ─── Issue dues for a period ──────────────────────────────────────────────────

export async function issueDues(
  cooperativeId: string,
  scheduleId: string,
  dto: { periodLabel: string; dueDate: string; amount?: number },
  callerId: string,
  callerType: "Admin" | "Manager",
) {
  logger.info(
    { cooperativeId, scheduleId, periodLabel: dto.periodLabel },
    "Service: issueDues",
  );

  const schedule = await repo.findDueScheduleById(scheduleId);
  if (!schedule || schedule.CooperativeId !== cooperativeId) {
    throw new NotFoundError("Due schedule not found");
  }

  const alreadyIssued = await repo.checkPeriodAlreadyIssued(
    scheduleId,
    dto.periodLabel,
  );
  if (alreadyIssued) {
    throw new ConflictError(
      `Dues for period "${dto.periodLabel}" have already been issued`,
      "DUE_PERIOD_ALREADY_ISSUED",
    );
  }

  const members = await repo.fetchActiveMembersForCooperative(cooperativeId);
  const amount = dto.amount ?? Number(schedule.Amount);

  if (members.length > 0) {
    const rows = members.map((m) => ({
      id: uuidv4(),
      dueScheduleId: scheduleId,
      memberId: m.Id,
      cooperativeId,
      periodLabel: dto.periodLabel,
      dueDate: toDateOnly(dto.dueDate),
      amount,
      dueAccountNumber: schedule.DueAccountNumber,
    }));
    await repo.bulkInsertDuePayments(rows);
  }

  logger.info(
    {
      scheduleId,
      periodLabel: dto.periodLabel,
      membersIssued: members.length,
      callerType,
      callerId,
    },
    "Service: issueDues — payments created",
  );

  return {
    periodLabel: dto.periodLabel,
    dueDate: dto.dueDate,
    amount,
    membersIssued: members.length,
  };
}

// ─── Payments: list ───────────────────────────────────────────────────────────

export async function listDuePayments(
  cooperativeId: string,
  filters: repo.DuePaymentFilters,
  query: { page: number; pageSize: number },
) {
  logger.info({ cooperativeId, filters, query }, "Service: listDuePayments");

  const [data, totalCount] = await Promise.all([
    repo.listDuePayments(cooperativeId, filters, query.page, query.pageSize),
    repo.countDuePayments(cooperativeId, filters),
  ]);

  return {
    data: data.map(mapPaymentList),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / query.pageSize),
  };
}

// ─── Payments: record manual ──────────────────────────────────────────────────

export async function recordManualPayment(
  cooperativeId: string,
  paymentId: string,
  dto: { paidAmount: number; notes?: string | null },
  callerId: string,
  callerType: "Admin" | "Manager",
) {
  logger.info({ cooperativeId, paymentId }, "Service: recordManualPayment");

  const payment = await repo.findDuePaymentByIdAndCooperative(
    paymentId,
    cooperativeId,
  );
  if (!payment) throw new NotFoundError("Due payment not found");

  if (payment.Status === "Paid") {
    throw new ConflictError(
      "This due payment has already been paid",
      "DUE_ALREADY_PAID",
    );
  }

  await repo.updateDuePayment(paymentId, {
    status: "Paid",
    paidDate: new Date().toISOString(),
    paidAmount: dto.paidAmount,
    notes: dto.notes ?? null,
    recordedById: callerId,
    recordedByType: callerType,
  });

  logger.info(
    { paymentId, callerType, callerId },
    "Service: recordManualPayment — recorded",
  );

  return {
    id: paymentId,
    memberId: payment.MemberId,
    periodLabel: payment.PeriodLabel,
    status: "Paid",
    paidAmount: dto.paidAmount,
  };
}

// ─── Payments: waive ─────────────────────────────────────────────────────────

export async function waiveDuePayment(
  cooperativeId: string,
  paymentId: string,
  dto: { notes?: string | null },
  callerId: string,
  callerType: "Admin" | "Manager",
) {
  logger.info({ cooperativeId, paymentId }, "Service: waiveDuePayment");

  const payment = await repo.findDuePaymentByIdAndCooperative(
    paymentId,
    cooperativeId,
  );
  if (!payment) throw new NotFoundError("Due payment not found");

  if (payment.Status === "Paid") {
    throw new ConflictError(
      "This due payment has already been paid",
      "DUE_ALREADY_PAID",
    );
  }

  await repo.updateDuePayment(paymentId, {
    status: "Waived",
    notes: dto.notes ?? null,
    recordedById: callerId,
    recordedByType: callerType,
  });

  logger.info(
    { paymentId, callerType, callerId },
    "Service: waiveDuePayment — waived",
  );

  return {
    id: paymentId,
    memberId: payment.MemberId,
    periodLabel: payment.PeriodLabel,
    status: "Waived",
  };
}

// ─── Global: list all schedules (admin overview) ──────────────────────────────

export async function listAllDueSchedules(
  filters: { isActive?: boolean; cooperativeId?: string },
  query: { page: number; pageSize: number },
) {
  logger.info({ filters, query }, "Service: listAllDueSchedules");

  const [data, totalCount] = await Promise.all([
    repo.listAllDueSchedules(filters, query.page, query.pageSize),
    repo.countAllDueSchedules(filters),
  ]);

  return {
    data: data.map((s) => ({
      id: s.Id,
      cooperativeId: s.CooperativeId,
      cooperativeName: s.CooperativeName,
      name: s.Name,
      amount: Number(s.Amount),
      frequency: s.Frequency,
      startDate: s.StartDate,
      endDate: s.EndDate ?? null,
      dueAccountNumber: s.DueAccountNumber,
      isActive: s.IsActive === 1,
      dateCreated: s.DateCreated,
    })),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / query.pageSize),
  };
}

// ─── Member: list active schedules ────────────────────────────────────────────

export async function listMemberDueSchedules(cooperativeId: string) {
  logger.info({ cooperativeId }, "Service: listMemberDueSchedules");

  const data = await repo.listDueSchedules(cooperativeId, 1, 200, true);
  return {
    data: data.map(mapSchedule),
  };
}

// ─── Member: list payments ────────────────────────────────────────────────────

export async function listMemberDuePayments(
  memberId: string,
  cooperativeId: string,
  filters: { scheduleId?: string; periodLabel?: string; status?: string },
  query: { page: number; pageSize: number },
) {
  logger.info(
    { memberId, cooperativeId, filters, query },
    "Service: listMemberDuePayments",
  );

  const [data, totalCount] = await Promise.all([
    repo.listMemberDuePayments(
      memberId,
      cooperativeId,
      filters,
      query.page,
      query.pageSize,
    ),
    repo.countMemberDuePayments(memberId, cooperativeId, filters),
  ]);

  return {
    data: data.map((p) => ({
      id: p.Id,
      scheduleId: p.DueScheduleId,
      scheduleName: p.ScheduleName,
      periodLabel: p.PeriodLabel,
      dueDate: p.DueDate,
      amount: Number(p.Amount),
      status: p.Status,
      paidDate: p.PaidDate ?? null,
      paidAmount: p.PaidAmount != null ? Number(p.PaidAmount) : null,
    })),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / query.pageSize),
  };
}

// ─── Member: outstanding payments ────────────────────────────────────────────

export async function listMemberOutstandingPayments(
  memberId: string,
  cooperativeId: string,
) {
  logger.info(
    { memberId, cooperativeId },
    "Service: listMemberOutstandingPayments",
  );

  const data = await repo.listMemberOutstandingPayments(
    memberId,
    cooperativeId,
  );
  const totalOutstanding = data.reduce((sum, p) => sum + Number(p.Amount), 0);

  return {
    data: data.map((p) => ({
      id: p.Id,
      scheduleId: p.DueScheduleId,
      scheduleName: p.ScheduleName,
      periodLabel: p.PeriodLabel,
      dueDate: p.DueDate,
      amount: Number(p.Amount),
      status: p.Status,
    })),
    totalOutstanding,
  };
}

// ─── Member: pay from wallet ──────────────────────────────────────────────────

export async function payDueFromWallet(
  memberId: string,
  cooperativeId: string,
  paymentId: string,
) {
  logger.info(
    { memberId, cooperativeId, paymentId },
    "Service: payDueFromWallet",
  );

  const payment = await repo.findDuePaymentById(paymentId);
  if (
    !payment ||
    payment.MemberId !== memberId ||
    payment.CooperativeId !== cooperativeId
  ) {
    throw new NotFoundError("Due payment not found");
  }

  if (payment.Status === "Paid" || payment.Status === "Waived") {
    throw new ConflictError(
      "This due has already been paid or waived",
      "DUE_ALREADY_PAID",
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
  const amountToPay = Number(payment.Amount);

  if (availableBalance < amountToPay) {
    throw new AppError(
      "Insufficient wallet balance to pay this due",
      400,
      "INSUFFICIENT_WALLET_BALANCE",
    );
  }

  const dueAccountNumber = payment.DueAccountNumber ?? "";

  const remarks = `Due payment: ${payment.PeriodLabel}`;
  const txRef = `COOP-DUES-${paymentId}`;

  // Execute wallet-to-wallet transfer
  await embedlyRequest("PUT", env.embedly.urls.walletToWallet, {
    fromAccount: memberWallet.AccountNumber,
    toAccount: dueAccountNumber,
    amount: amountToPay,
    transactionReference: txRef,
    remarks,
  });

  // SAVE TRANSACTION RECORD
  await embedlyTransactionRepo.saveEmbedlyTransaction(
    memberWallet.AccountNumber,
    dueAccountNumber,
    amountToPay,
    txRef,
    true,
    "WalletToWallet",
  );

  logger.info(
    { paymentId, memberId, amount: amountToPay },
    "Service: payDueFromWallet — wallet transfer completed",
  );

  const now = new Date().toISOString();
  await repo.updateDuePayment(paymentId, {
    status: "Paid",
    paidDate: now,
    paidAmount: amountToPay,
    memberAccountNumber: memberWallet.AccountNumber,
    recordedById: memberId,
    recordedByType: "Member",
  });

  logger.info({ paymentId }, "Service: payDueFromWallet — payment recorded");

  return {
    id: paymentId,
    periodLabel: payment.PeriodLabel,
    status: "Paid",
    paidDate: now,
    paidAmount: amountToPay,
  };
}

// ─── Dashboard summary ────────────────────────────────────────────────────────

export async function getDueDashboardSummary(
  cooperativeId: string,
  memberId?: string,
) {
  logger.info({ cooperativeId, memberId }, "Service: getDueDashboardSummary");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  logger.info({ todayStr }, "Today's date string");

  const allSchedules = await repo.listActiveDueSchedules(cooperativeId);

  const toScheduleDateStr = (d: unknown): string =>
    (d instanceof Date ? d : new Date(d as string)).toISOString().split("T")[0];

  logger.info(
    {
      allSchedules: allSchedules.map((s) => {
        return {
          Id: s.Id,
          Name: s.Name,
          Amount: s.Amount,
          StartDate: s.StartDate,
          startDateIsGreaterThanToday:
            toScheduleDateStr(s.StartDate) > todayStr,
        };
      }),
    },
    "All Schedules",
  );

  const activeSchedules = allSchedules.filter(
    (s) => toScheduleDateStr(s.StartDate) <= todayStr,
  );
  const upcomingSchedules = allSchedules.filter(
    (s) => toScheduleDateStr(s.StartDate) > todayStr,
  );

  logger.info({ upcomingSchedules }, "Upcoming Schedules");
  logger.info({ activeSchedules }, "Active Schedules");

  const activeDues = await Promise.all(
    activeSchedules.map(async (schedule) => {
      const periodStats = await repo.getLatestPeriodStats(
        schedule.Id,
        cooperativeId,
      );

      let memberStatus: "paid" | "unpaid" | undefined;
      if (memberId && periodStats) {
        const mp = await repo.getMemberPaymentStatusForPeriod(
          schedule.Id,
          memberId,
          periodStats.PeriodLabel,
        );
        if (mp) {
          memberStatus =
            mp.Status === "Paid" || mp.Status === "Waived" ? "paid" : "unpaid";
        }
      }

      const totalExpected = periodStats ? Number(periodStats.totalExpected) : 0;
      const totalCollected = periodStats
        ? Number(periodStats.totalCollected)
        : 0;
      const paidOrWaivedCount = periodStats
        ? Number(periodStats.paidOrWaivedCount)
        : 0;
      const unpaidCount = periodStats ? Number(periodStats.unpaidCount) : 0;

      let daysLeft: number | null = null;
      let cycleStart: string | null = null;
      let cycleEnd: string | null = null;

      if (periodStats) {
        cycleStart = periodStats.cycleStart
          ? toScheduleDateStr(periodStats.cycleStart)
          : null;
        cycleEnd = periodStats.cycleEnd
          ? toScheduleDateStr(periodStats.cycleEnd)
          : null;
        if (cycleEnd) {
          const end = new Date(cycleEnd);
          daysLeft = Math.ceil(
            (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
        }
      }

      const percentageCollected =
        totalExpected > 0
          ? Math.round((totalCollected / totalExpected) * 100)
          : 0;

      return {
        dueId: schedule.Id,
        name: schedule.Name,
        amount: Number(schedule.Amount),
        cycleStart,
        cycleEnd,
        daysLeft,
        paidCount: paidOrWaivedCount,
        unpaidCount,
        totalExpected,
        totalCollected,
        percentageCollected,
        ...(memberId !== undefined
          ? { memberStatus: memberStatus ?? null }
          : {}),
      };
    }),
  );

  const activeMembersForCoop =
    upcomingSchedules.length > 0
      ? await repo.fetchActiveMembersForCooperative(cooperativeId)
      : [];
  const memberCount = activeMembersForCoop.length;

  const upcomingDues = upcomingSchedules.map((schedule) => {
    const start = new Date(schedule.StartDate);
    const daysUntilStart = Math.ceil(
      (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return {
      dueId: schedule.Id,
      name: schedule.Name,
      amount: Number(schedule.Amount),
      startDate: schedule.StartDate,
      daysUntilStart,
      memberCount,
    };
  });

  logger.info({ upcomingDues }, "Upcoming dues");
  logger.info({ activeDues }, "Active dues");

  let state: "active" | "upcoming" | "mixed" | "all_paid" | "no_dues";
  if (activeDues.length === 0 && upcomingDues.length === 0) {
    state = "no_dues";
  } else if (activeDues.length === 0) {
    state = "upcoming";
  } else if (upcomingDues.length > 0) {
    state = "mixed";
  } else {
    const allPaid = activeDues.every(
      (d) => d.unpaidCount === 0 && d.paidCount > 0,
    );
    state = allPaid ? "all_paid" : "active";
  }

  const totalExpected = activeDues.reduce((sum, d) => sum + d.totalExpected, 0);
  const totalCollected = activeDues.reduce(
    (sum, d) => sum + d.totalCollected,
    0,
  );
  const totalMembersBehind = activeDues.reduce(
    (sum, d) => sum + d.unpaidCount,
    0,
  );

  const now = new Date();
  const cycleLabel = now.toLocaleString("en-NG", {
    month: "long",
    year: "numeric",
  });

  return {
    cooperativeId,
    cycleLabel,
    state,
    aggregates: {
      totalExpected,
      totalCollected,
      totalMembersBehind,
      activeDuesCount: activeDues.length,
      upcomingDuesCount: upcomingDues.length,
    },
    activeDues,
    upcomingDues,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapSchedule(s: repo.DueScheduleRow) {
  return {
    id: s.Id,
    cooperativeId: s.CooperativeId,
    name: s.Name,
    amount: Number(s.Amount),
    frequency: s.Frequency,
    startDate: s.StartDate,
    endDate: s.EndDate ?? null,
    dueAccountNumber: s.DueAccountNumber,
    isActive: s.IsActive === 1,
    createdByName: s.CreatedByName ?? null,
    createdByType: s.CreatedByType ?? null,
    dateCreated: s.DateCreated,
  };
}

function mapScheduleFull(s: repo.DueScheduleRow) {
  return {
    ...mapSchedule(s),
    description: s.Description ?? null,
    dateUpdated: s.DateUpdated ?? null,
    // createdByName and createdByType are already included via mapSchedule spread
  };
}

function mapPaymentList(p: repo.DuePaymentListRow) {
  return {
    id: p.Id,
    scheduleId: p.DueScheduleId,
    scheduleName: p.ScheduleName,
    memberId: p.MemberId,
    memberFullName: p.MemberFullName,
    periodLabel: p.PeriodLabel,
    dueDate: p.DueDate,
    amount: Number(p.Amount),
    status: p.Status,
    paidDate: p.PaidDate ?? null,
    paidAmount: p.PaidAmount != null ? Number(p.PaidAmount) : null,
    dueAccountNumber: p.DueAccountNumber ?? null,
    memberAccountNumber: p.MemberAccountNumber ?? null,
    dateCreated: p.DateCreated,
  };
}
