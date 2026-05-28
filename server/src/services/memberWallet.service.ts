import { env } from "../config/env";
import { logger } from "../utils/logger";
import { embedlyRequest } from "../utils/embedlyClient";
import { sendMail } from "../utils/mailer";
import * as memberRepo from "../repositories/members.repository";
import * as cooperativeRepo from "../repositories/cooperatives.repository";
import * as embedlyRepo from "../repositories/embedly.repository";

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function processCreateMemberWallet(
  memberId: string,
  cooperativeId: string,
): Promise<void> {
  logger.info(
    { memberId, cooperativeId },
    "Worker: processCreateMemberWallet started",
  );

  // 1. Validate member exists in this cooperative
  const member = await memberRepo.findMemberByIdAndCooperativeId(
    memberId,
    cooperativeId,
  );
  if (!member) {
    logger.error(
      { memberId, cooperativeId },
      "Worker: member not found — skipping wallet creation",
    );
    return;
  }

  // 2. Validate cooperative exists
  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) {
    logger.error(
      { cooperativeId },
      "Worker: cooperative not found — skipping wallet creation",
    );
    return;
  }

  // 3. Idempotency — one wallet per member per cooperative
  const existingWallet =
    await embedlyRepo.findEmbedlyWalletByOwnerAndCooperative(
      memberId,
      cooperativeId,
    );
  if (existingWallet) {
    logger.warn(
      { memberId, cooperativeId },
      "Worker: wallet already exists for member in this cooperative — skipping",
    );
    return;
  }

  const firstName = member.FirstName;
  const lastName = member.LastName;

  // 4. Create Embedly customer
  logger.info(
    { memberId, firstName, lastName },
    "Worker: calling Embedly Create Customer",
  );
  const customerResponse = await embedlyRequest<{ data: { id: string } }>(
    "POST",
    env.embedly.urls.createCustomer,
    {
      firstName,
      lastName,
      dob: env.embedly.customerDateOfBirth,
      customerTypeId: env.embedly.customerTypeId,
      alias: `CoopOp-Member-${memberId}`,
      countryId: env.embedly.countryId,
      city: env.embedly.customerCity,
      address: env.embedly.customerAddress,
    },
  );

  const embedlyCustomerId = customerResponse.data.data.id;
  logger.info(
    { memberId, embedlyCustomerId },
    "Worker: Embedly customer created",
  );

  // 5. Save EmbedlyCustomer record
  await embedlyRepo.createEmbedlyCustomer(
    "Member",
    memberId,
    cooperativeId,
    firstName,
    lastName,
    embedlyCustomerId,
  );
  logger.info(
    { memberId, embedlyCustomerId },
    "Worker: EmbedlyCustomer record saved",
  );

  // 6. Create Embedly wallet
  logger.info(
    { memberId, embedlyCustomerId },
    "Worker: calling Embedly Create Wallet",
  );
  const walletResponse = await embedlyRequest<{
    data: { id: string; virtualAccount: { accountNumber: string } };
  }>("POST", env.embedly.urls.createWallet, {
    customerId: embedlyCustomerId,
    currencyId: env.embedly.currencyId,
    name: `${firstName} ${lastName}`,
  });

  const walletId = walletResponse.data.data.id;
  const accountNumber = walletResponse.data.data.virtualAccount.accountNumber;
  const walletName = `${firstName} ${lastName}`;
  logger.info(
    { memberId, walletId, accountNumber, walletName },
    "Worker: Embedly wallet created",
  );

  // 7. Save EmbedlyWallet record
  await embedlyRepo.createEmbedlyWallet(
    "Member",
    memberId,
    cooperativeId,
    embedlyCustomerId,
    accountNumber,
    walletId,
    walletName,
  );
  logger.info(
    { memberId, walletId, accountNumber, walletName },
    "Worker: EmbedlyWallet record saved",
  );

  // 8. Email Member
  const memberSubject = env.email.subjects.memberWalletCreated;
  const memberBody =
    `Member Name: ${firstName} ${lastName}\n` +
    `Member ID: ${memberId}\n` +
    `Account Number: ${accountNumber}\n` +
    `Bank: Sterling Bank\n` +
    `Account Name: VC/${walletName}\n`;

  sendMail({
    to: member.Email,
    subject: memberSubject,
    text: memberBody,
    referenceId: memberId,
    template: env.email.subjects.memberWalletCreated,
  });

  logger.info(
    { memberId, walletName },
    "Worker: processCreateMemberWallet completed successfully",
  );
}
