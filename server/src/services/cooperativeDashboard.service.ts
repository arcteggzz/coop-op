import { env } from "../config/env";
import { logger } from "../utils/logger";
import { NotFoundError, ConflictError } from "../middlewares/errorHandler";
import { embedlyRequest } from "../utils/embedlyClient";
import { publishToQueue } from "../utils/queue";
import * as embedlyRepo from "../repositories/embedly.repository";
import { countManagersForCooperative } from "../repositories/managers.repository";
import { countMembersForCooperative } from "../repositories/members.repository";
import * as cooperativeRepo from "../repositories/cooperatives.repository";

interface EmbedlyWalletLiveData {
  availableBalance: number;
  ledgerBalance: number;
  virtualAccount: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
  };
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export async function getCooperativeSummary(cooperativeId: string) {
  logger.info({ cooperativeId }, "Service: getCooperativeSummary");

  const [memberCount, managerCount, walletCount] = await Promise.all([
    countMembersForCooperative(cooperativeId),
    countManagersForCooperative(cooperativeId),
    embedlyRepo.countCooperativeWalletsByCooperativeId(cooperativeId),
  ]);

  return {
    memberCount,
    managerCount,
    walletCount,
    loansCount: 0,
    duesCollected: 0,
  };
}

// ─── Wallets ──────────────────────────────────────────────────────────────────

export async function getCooperativeWallets(cooperativeId: string) {
  logger.info({ cooperativeId }, "Service: getCooperativeWallets");

  const wallets =
    await embedlyRepo.findCooperativeWalletsByCooperativeId(cooperativeId);

  return wallets.map((w) => ({
    id: w.Id,
    walletName: w.WalletName ?? "Cooperative Wallet",
    accountNumber: w.AccountNumber,
    bankName: env.embedly.bankName,
    walletId: w.WalletId,
    dateCreated: w.DateCreated,
  }));
}

// ─── Live Balance ─────────────────────────────────────────────────────────────

export async function getCooperativeWalletBalance(accountNumber: string) {
  logger.info({ accountNumber }, "Service: getCooperativeWalletBalance");

  const response = await embedlyRequest<{ data: EmbedlyWalletLiveData }>(
    "GET",
    `${env.embedly.urls.getWalletByAccountNumber}/${accountNumber}`,
  );

  return {
    availableBalance: response.data.data.availableBalance,
  };
}

// ─── Create Wallet ────────────────────────────────────────────────────────────

export async function createCooperativeWallet(
  cooperativeId: string,
  walletName: string,
) {
  logger.info(
    { cooperativeId, walletName },
    "Service: createCooperativeWallet (dashboard)",
  );

  const cooperative = await cooperativeRepo.findCooperativeById(cooperativeId);
  if (!cooperative) throw new NotFoundError("Cooperative not found");

  const currentCount =
    await embedlyRepo.countCooperativeWalletsByCooperativeId(cooperativeId);
  if (currentCount >= env.cooperative.maxWallets) {
    throw new ConflictError(
      `This cooperative has reached the maximum of ${env.cooperative.maxWallets} wallets`,
      "MAX_COOPERATIVE_WALLETS_REACHED",
    );
  }

  await publishToQueue("create-cooperative-wallet", {
    cooperativeId,
    walletName,
  });
  logger.info(
    { cooperativeId, walletName },
    "Service: cooperative wallet creation queued",
  );
}
