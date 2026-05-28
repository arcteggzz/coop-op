import axiosInstance from "./axiosInstance";

export interface CooperativeSummary {
  memberCount: number;
  managerCount: number;
  walletCount: number;
  loansCount: number;
  duesCollected: number;
}

export interface CooperativeWallet {
  id: string;
  walletName: string;
  accountNumber: string;
  bankName: string;
  walletId: string;
  dateCreated: string;
}

const base = (cooperativeId: string) =>
  `/api/management/cooperatives/${cooperativeId}`;

export async function getManagerCooperativeSummary(
  cooperativeId: string,
): Promise<CooperativeSummary> {
  const res = await axiosInstance.get<{ success: boolean; data: CooperativeSummary }>(
    `${base(cooperativeId)}/summary`,
  );
  return res.data.data;
}

export async function getManagerCooperativeWallets(
  cooperativeId: string,
): Promise<CooperativeWallet[]> {
  const res = await axiosInstance.get<{ success: boolean; data: CooperativeWallet[] }>(
    `${base(cooperativeId)}/wallets`,
  );
  return res.data.data;
}

export async function getManagerCooperativeWalletBalance(
  cooperativeId: string,
  accountNumber: string,
): Promise<{ availableBalance: number }> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: { availableBalance: number };
  }>(`${base(cooperativeId)}/wallets/balance`, {
    params: { accountNumber },
  });
  return res.data.data;
}

export async function createManagerCooperativeWallet(
  cooperativeId: string,
  walletName: string,
): Promise<void> {
  await axiosInstance.post(`${base(cooperativeId)}/create-wallet`, {
    walletName,
  });
}
