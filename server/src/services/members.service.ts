import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { NotFoundError, ConflictError } from "../middlewares/errorHandler";
import { sendMail } from "../utils/mailer";
import { publishToQueue } from "../utils/queue";
import * as repo from "../repositories/members.repository";
import * as cooperativeRepo from "../repositories/cooperatives.repository";

const CREATE_MEMBER_WALLET_QUEUE = "create-member-wallet";

// ─── Invite Member ────────────────────────────────────────────────────────────

export async function inviteMember(
  dto: { firstName: string; lastName: string; email: string },
  cooperativeId: string,
  callingAdminId: string,
  callerType: "Admin" | "Manager" = "Admin",
) {
  logger.info({ email: dto.email, cooperativeId }, "Service: inviteMember");

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  let memberId: string;
  let isNewMember = false;

  const existingMember = await repo.findMemberByEmail(dto.email);
  if (existingMember) {
    memberId = existingMember.Id;
    logger.info(
      { memberId, cooperativeId },
      "Service: inviteMember — reusing existing MemberUser",
    );

    const existingLink = await repo.findMemberCooperativeLink(
      memberId,
      cooperativeId,
    );
    if (existingLink) {
      throw new ConflictError(
        "Member is already part of this cooperative",
        "MEMBER_ALREADY_IN_COOPERATIVE",
      );
    }
  } else {
    memberId = uuidv4();
    isNewMember = true;
    const hashedPassword = await bcrypt.hash(env.auth.defaultPassword, 10);
    await repo.createMember({
      id: memberId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      hashedPassword,
      invitedByAdminId: callingAdminId,
      invitedByAdminType: callerType,
    });
    logger.info({ memberId }, "Service: inviteMember — MemberUser created");
  }

  // IsDefault = true only if this is the member's first cooperative
  const existingCoopCount = await repo.countMemberCooperatives(memberId);
  const isDefault = existingCoopCount === 0;

  const linkId = uuidv4();
  await repo.createMemberCooperativeLink({
    id: linkId,
    memberId,
    cooperativeId,
    isDefault,
  });
  logger.info(
    { memberId, cooperativeId, isDefault },
    "Service: inviteMember — cooperative link created",
  );

  // Wallet creation is per member per cooperative — publish for every new link
  await publishToQueue(CREATE_MEMBER_WALLET_QUEUE, { memberId, cooperativeId });
  logger.info(
    { memberId, cooperativeId },
    "Service: inviteMember — wallet creation queued",
  );

  if (isNewMember) {
    sendMail({
      to: dto.email,
      subject: env.email.subjects.memberInvite,
      text: `Hello ${dto.firstName} ${dto.lastName},\n\nYou have been invited to join ${cooperative.Name} on Coop-op.\n\nEmail: ${dto.email}\nDefault Password: ${env.auth.defaultPassword}\n\nPlease change your password on first login.`,
      template: "MEMBER_INVITE",
      referenceId: memberId,
    });
    logger.info({ memberId }, "Service: inviteMember — invite email sent");
  } else {
    sendMail({
      to: dto.email,
      subject: env.email.subjects.memberInvite,
      text: `Hello ${dto.firstName} ${dto.lastName},\n\nYou have been invited to join ${cooperative.Name} on Coop-op.\nYou can login with your existing email and the password you set previously.\n\nIf you don't remember your password, please use the "Forgot Password" feature to reset it.`,
      template: "MEMBER_INVITE",
      referenceId: memberId,
    });
    logger.info({ memberId }, "Service: inviteMember — invite email sent");
  }

  const member = await repo.findMemberById(memberId);
  return {
    id: member!.Id,
    firstName: member!.FirstName,
    lastName: member!.LastName,
    email: member!.Email,
    cooperativeId,
    isDefault,
  };
}

// ─── List Members ─────────────────────────────────────────────────────────────

export async function listMembers(
  cooperativeId: string,
  query: { page: number; pageSize: number },
) {
  logger.info({ cooperativeId, query }, "Service: listMembers");

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  const [data, totalCount] = await Promise.all([
    repo.listMembersForCooperative(cooperativeId, query.page, query.pageSize),
    repo.countMembersForCooperative(cooperativeId),
  ]);

  const totalPages = Math.ceil(totalCount / query.pageSize);
  logger.info({ cooperativeId, totalCount }, "Service: listMembers — result");

  return {
    data: data.map((m) => ({
      id: m.Id,
      firstName: m.FirstName,
      lastName: m.LastName,
      email: m.Email,
      isActive: m.IsActive === 1,
      dateInvited: m.DateInvited,
      dateCreated: m.DateCreated,
      accountNumber: m.AccountNumber ?? null,
    })),
    page: query.page,
    pageSize: query.pageSize,
    totalCount,
    totalPages,
  };
}

// ─── Get Member by ID ─────────────────────────────────────────────────────────

export async function getMember(cooperativeId: string, memberId: string) {
  logger.info({ cooperativeId, memberId }, "Service: getMember");

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  const member = await repo.findMemberById(memberId);
  if (!member) throw new NotFoundError("Member not found");

  const link = await repo.findMemberCooperativeLink(memberId, cooperativeId);
  if (!link) throw new NotFoundError("Member is not part of this cooperative");

  logger.info({ cooperativeId, memberId }, "Service: getMember — found");

  return {
    id: member.Id,
    firstName: member.FirstName,
    lastName: member.LastName,
    email: member.Email,
    isActive: member.IsActive === 1,
    isDefault: link.IsDefault === 1,
    cooperativeId,
    dateInvited: member.DateInvited,
    dateCreated: member.DateCreated,
  };
}

// ─── Revoke Member ────────────────────────────────────────────────────────────

export async function revokeMember(cooperativeId: string, memberId: string) {
  logger.info({ cooperativeId, memberId }, "Service: revokeMember");

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  const member = await repo.findMemberById(memberId);
  if (!member) throw new NotFoundError("Member not found");

  const link = await repo.findMemberCooperativeLink(memberId, cooperativeId);
  if (!link) throw new NotFoundError("Member is not part of this cooperative");

  await repo.softDeleteMemberCooperativeLink(memberId, cooperativeId);
  logger.info(
    { cooperativeId, memberId },
    "Service: revokeMember — access revoked",
  );
}
