import axiosInstance from "./axiosInstance";

export interface Cooperative {
  id: string;
  name: string;
  dateCreated: string;
  dateUpdated?: string;
  createdByAdminId?: string;
  createdByAdminName?: string | null;
  memberCount?: number;
  managerCount?: number;
}

export interface PaginatedCooperatives {
  data: Cooperative[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Manager {
  id: string;
  fullName: string;
  email: string;
  role: "RootManager" | "SuperManager" | "Support";
  isActive: boolean;
  dateInvited: string;
  permissions?: string[];
}

export interface PaginatedManagers {
  data: Manager[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  dateInvited: string;
  accountNumber?: string | null;
}

export interface PaginatedMembers {
  data: Member[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InviteManagerDto {
  fullName: string;
  email: string;
  role: "SuperManager" | "Support";
  permissions?: string[];
}

export interface InviteMemberDto {
  firstName: string;
  lastName: string;
  email: string;
}

export async function getCooperatives(params?: {
  page?: number;
  pageSize?: number;
  name?: string;
}): Promise<PaginatedCooperatives> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: PaginatedCooperatives;
  }>("/api/coop-admin/cooperatives", { params });
  return response.data.data;
}

export async function getCooperative(
  cooperativeId: string,
): Promise<Cooperative> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: { cooperative: Cooperative };
  }>(`/api/coop-admin/cooperatives/${cooperativeId}`);
  return response.data.data.cooperative;
}

export async function createCooperative(data: {
  name: string;
}): Promise<Cooperative> {
  const response = await axiosInstance.post<{
    success: boolean;
    data: Cooperative;
  }>("/api/coop-admin/cooperatives", data);
  return response.data.data;
}

export async function updateCooperative(
  cooperativeId: string,
  data: { name: string },
): Promise<Cooperative> {
  const response = await axiosInstance.patch<{
    success: boolean;
    data: Cooperative;
  }>(`/api/coop-admin/cooperatives/${cooperativeId}`, data);
  return response.data.data;
}

export async function getCooperativeManagers(
  cooperativeId: string,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedManagers> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: PaginatedManagers;
  }>(`/api/coop-admin/cooperatives/${cooperativeId}/managers`, { params });
  return response.data.data;
}

export async function inviteCooperativeManager(
  cooperativeId: string,
  data: InviteManagerDto,
): Promise<Manager> {
  const response = await axiosInstance.post<{
    success: boolean;
    data: Manager;
  }>(`/api/coop-admin/cooperatives/${cooperativeId}/managers/invite`, data);
  return response.data.data;
}

export async function revokeCooperativeManager(
  cooperativeId: string,
  managerId: string,
): Promise<void> {
  await axiosInstance.patch(
    `/api/coop-admin/cooperatives/${cooperativeId}/managers/${managerId}/revoke`,
  );
}

export async function getCooperativeMembers(
  cooperativeId: string,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedMembers> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: PaginatedMembers;
  }>(`/api/coop-admin/cooperatives/${cooperativeId}/members`, { params });
  return response.data.data;
}

export async function inviteCooperativeMember(
  cooperativeId: string,
  data: InviteMemberDto,
): Promise<Member> {
  const response = await axiosInstance.post<{
    success: boolean;
    data: Member;
  }>(`/api/coop-admin/cooperatives/${cooperativeId}/members/invite`, data);
  return response.data.data;
}

export async function revokeCooperativeMember(
  cooperativeId: string,
  memberId: string,
): Promise<void> {
  await axiosInstance.patch(
    `/api/coop-admin/cooperatives/${cooperativeId}/members/${memberId}/revoke`,
  );
}

// ─── Dashboard: Summary + Wallets ─────────────────────────────────────────────

export interface AdminCooperativeSummary {
  memberCount: number;
  managerCount: number;
  walletCount: number;
  loansCount: number;
  duesCollected: number;
}

export interface AdminCooperativeWallet {
  id: string;
  walletName: string;
  accountNumber: string;
  bankName: string;
  walletId: string;
  dateCreated: string;
}

const adminCoopBase = (cooperativeId: string) =>
  `/api/coop-admin/cooperatives/${cooperativeId}`;

export async function getAdminCooperativeSummary(
  cooperativeId: string,
): Promise<AdminCooperativeSummary> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: AdminCooperativeSummary;
  }>(`${adminCoopBase(cooperativeId)}/summary`);
  return res.data.data;
}

export async function getAdminCooperativeWallets(
  cooperativeId: string,
): Promise<AdminCooperativeWallet[]> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: AdminCooperativeWallet[];
  }>(`${adminCoopBase(cooperativeId)}/wallets`);
  return res.data.data;
}

export async function getAdminCooperativeWalletBalance(
  cooperativeId: string,
  accountNumber: string,
): Promise<{ availableBalance: number }> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: { availableBalance: number };
  }>(`${adminCoopBase(cooperativeId)}/wallets/balance`, {
    params: { accountNumber },
  });
  return res.data.data;
}

export async function createAdminCooperativeWallet(
  cooperativeId: string,
  walletName: string,
): Promise<void> {
  await axiosInstance.post(`${adminCoopBase(cooperativeId)}/create-wallet`, {
    walletName,
  });
}
