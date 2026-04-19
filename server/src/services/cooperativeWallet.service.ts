import { env } from "../config/env";
import { logger } from "../utils/logger";
import { embedlyRequest } from "../utils/embedlyClient";
import { sendMail } from "../utils/mailer";
import * as cooperativeRepo from "../repositories/cooperatives.repository";
import * as embedlyWalletRepo from "../repositories/embedly.repository";
import * as embedlyCustomerRepo from "../repositories/embedly.repository";
import * as managerRepo from "../repositories/managers.repository";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitCooperativeName(name: string): {
  firstName: string;
  lastName: string;
} {
  const parts = name.trim().split(/\s+/);
  const length = parts.length;

  if (length === 1) {
    return { firstName: name, lastName: "Cooperative" };
  } else if (length === 2) {
    return { firstName: parts[0], lastName: parts[1] };
  } else if (length === 3) {
    return { firstName: `${parts[0]}-${parts[1]}`, lastName: parts[2] };
  } else if (length === 4) {
    return {
      firstName: `${parts[0]}-${parts[1]}`,
      lastName: `${parts[2]}-${parts[3]}`,
    };
  } else {
    // 5 and above
    return {
      firstName: `${parts[0]}-${parts[1]}`,
      lastName: parts.slice(2).join("-"),
    };
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function processCreateCooperativeWallet(
  cooperativeId: string,
  walletName?: string,
): Promise<void> {
  logger.info(
    { cooperativeId, walletName },
    "Worker: processCreateCooperativeWallet started",
  );

  // 1. Validate cooperative exists
  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) {
    logger.error(
      { cooperativeId },
      "Worker: cooperative not found — skipping wallet creation",
    );
    return;
  }

  // 2. Idempotency — for the signup flow (no walletName), skip if any wallet already exists.
  //    For additional wallets (walletName provided), skip only if wallet with same name exists.
  if (!walletName) {
    const existingWallet =
      await embedlyWalletRepo.findEmbedlyWalletByOwnerId(cooperativeId);
    if (existingWallet) {
      logger.warn(
        { cooperativeId },
        "Worker: wallet already exists for cooperative (signup flow) — skipping",
      );
      return;
    }
  } else {
    const existingByName =
      await embedlyWalletRepo.findEmbedlyWalletByOwnerIdAndWalletName(
        cooperativeId,
        walletName,
      );
    if (existingByName) {
      logger.warn(
        { cooperativeId, walletName },
        "Worker: wallet with this name already exists for cooperative — skipping",
      );
      return;
    }
  }

  const resolvedWalletName = walletName ?? cooperative.Name;
  const { firstName, lastName } = splitCooperativeName(cooperative.Name);

  // 3. Create Embedly customer
  logger.info(
    { cooperativeId, firstName, lastName },
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
      alias: `CoopOp-${cooperative.Name}`,
      countryId: env.embedly.countryId,
      city: env.embedly.customerCity,
      address: env.embedly.customerAddress,
    },
  );

  const embedlyCustomerId = customerResponse.data.data.id;
  logger.info(
    { cooperativeId, embedlyCustomerId },
    "Worker: Embedly customer created",
  );

  // 4. Save EmbedlyCustomer record — OwnerId and CooperativeId are both cooperativeId
  await embedlyCustomerRepo.createEmbedlyCustomer(
    "Cooperative",
    cooperativeId,
    cooperativeId,
    firstName,
    lastName,
    embedlyCustomerId,
  );
  logger.info(
    { cooperativeId, embedlyCustomerId },
    "Worker: EmbedlyCustomer record saved",
  );

  // 5. Create Embedly wallet
  logger.info(
    { cooperativeId, embedlyCustomerId },
    "Worker: calling Embedly Create Wallet",
  );
  const walletResponse = await embedlyRequest<{
    data: { id: string; virtualAccount: { accountNumber: string } };
  }>("POST", env.embedly.urls.createWallet, {
    customerId: embedlyCustomerId,
    currencyId: env.embedly.currencyId,
    name: resolvedWalletName,
  });

  const walletId = walletResponse.data.data.id;
  const accountNumber = walletResponse.data.data.virtualAccount.accountNumber;
  logger.info(
    { cooperativeId, walletId, accountNumber },
    "Worker: Embedly wallet created",
  );

  // 6. Save EmbedlyWallet record — OwnerId and CooperativeId are both cooperativeId
  await embedlyWalletRepo.createEmbedlyWallet(
    "Cooperative",
    cooperativeId,
    cooperativeId,
    embedlyCustomerId,
    accountNumber,
    walletId,
    resolvedWalletName,
  );
  logger.info(
    { cooperativeId, walletId, accountNumber },
    "Worker: EmbedlyWallet record saved",
  );

  // 7. Send email to cooperative's RootManager
  const rootManagerLink =
    await managerRepo.findRootManagerForCooperative(cooperativeId);
  if (rootManagerLink) {
    const rootManager = await managerRepo.findManagerById(
      rootManagerLink.ManagerId,
    );
    if (rootManager) {
      const subject = env.email.subjects.cooperativeWalletCreated;
      const body =
        `Cooperative Name: ${cooperative.Name}\n` +
        `Cooperative ID: ${cooperative.Id}\n` +
        `Account Number: ${accountNumber}\n` +
        `Bank: Sterling Bank\n` +
        `Account Name: VC/${cooperative.Name}`;

      sendMail({
        to: rootManager.Email,
        subject,
        text: body,
        referenceId: cooperativeId,
        template: subject,
      }).catch((error) => {
        logger.error(
          { cooperativeId, error },
          "Worker: failed to send wallet creation email",
        );
      });

      logger.info(
        { cooperativeId, to: rootManager.Email },
        "Worker: wallet creation email queued for cooperative RootManager",
      );
    } else {
      logger.warn(
        { cooperativeId, managerId: rootManagerLink.ManagerId },
        "Worker: RootManager user record not found — skipping email",
      );
    }
  } else {
    logger.warn(
      { cooperativeId },
      "Worker: no RootManager found for cooperative — skipping email",
    );
  }

  logger.info(
    { cooperativeId },
    "Worker: processCreateCooperativeWallet completed successfully",
  );
}
