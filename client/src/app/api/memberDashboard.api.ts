import axiosInstance from "./axiosInstance";

export interface MemberCooperativeRef {
  cooperativeId: string;
  cooperativeName: string;
  isDefault: boolean;
  memberSince?: string;
}

export interface MemberDashboardData {
  member: {
    id: string;
    fullName: string;
    email: string;
  };
  activeCooperative: {
    cooperativeId: string;
    cooperativeName: string;
    memberSince?: string;
  };
  cooperatives: MemberCooperativeRef[];
}

export interface MemberWalletDetails {
  walletName: string;
  accountNumber: string;
  bankName: string;
}

export interface MemberWalletBalance {
  availableBalance: number;
}

export interface WalletTransaction {
  id: string;
  remarks: string;
  amount: number;
  debitCreditIndicator: "D" | "C";
  balance: number;
  transactionReference: string;
  dateCreated: string;
  accountNumber: string;
  beneficiaryAccountName: string;
  beneficiaryAccountNumber: string;
  beneficiaryBank: string;
  originatorAccountNumber: string;
  originatorAccountName: string;
}

export interface ExportStatementDto {
  cooperativeId: string;
  accountNumber: string;
  from: string;
  to: string;
  format: "csv" | "pdf";
  email?: string;
}

export async function getMemberDashboard(
  cooperativeId: string,
): Promise<MemberDashboardData> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: MemberDashboardData;
  }>("/api/member/dashboard", { params: { cooperativeId } });
  return response.data.data;
}

export async function getMemberWallet(
  cooperativeId: string,
): Promise<MemberWalletDetails> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: MemberWalletDetails;
  }>("/api/member/wallet", { params: { cooperativeId } });
  return response.data.data;
}

export async function getMemberWalletBalance(
  cooperativeId: string,
  accountNumber: string,
): Promise<MemberWalletBalance> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: MemberWalletBalance;
  }>("/api/member/wallet/balance", {
    params: { cooperativeId, accountNumber },
  });
  return response.data.data;
}

export async function getMemberWalletTransactions(
  cooperativeId: string,
): Promise<WalletTransaction[]> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: WalletTransaction[];
  }>("/api/member/wallet/transactions", { params: { cooperativeId } });
  return response.data.data;
}

export async function exportMemberStatement(
  dto: ExportStatementDto,
): Promise<{ sent: true } | Blob> {
  const response = await axiosInstance.post(
    "/api/member/wallet/statement",
    dto,
    {
      responseType: dto.email ? "json" : "blob",
    },
  );
  if (dto.email) {
    return response.data.data as { sent: true };
  }
  return response.data as Blob;
}
