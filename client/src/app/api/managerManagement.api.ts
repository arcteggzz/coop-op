import axiosInstance from "./axiosInstance";

export interface ManagerListItem {
  id: string;
  fullName: string;
  email: string;
  role: "RootManager" | "SuperManager" | "Support";
  isActive: boolean;
  isDefault: boolean;
  dateInvited: string;
  dateCreated: string;
}

export interface MemberListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  accountNumber: string | null;
  dateInvited: string;
  dateCreated: string;
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export async function getManagers(
  cooperativeId: string,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<ManagerListItem>> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: PaginatedResponse<ManagerListItem>;
  }>(`/api/management/cooperatives/${cooperativeId}/managers`, { params });
  return response.data.data;
}

export interface InviteManagerDto {
  fullName: string;
  email: string;
  role: "SuperManager" | "Support";
  permissions?: string[];
}

export async function inviteManager(
  cooperativeId: string,
  data: InviteManagerDto,
): Promise<{ id: string; fullName: string; email: string; role: string; cooperativeId: string; dateInvited: string }> {
  const response = await axiosInstance.post<{
    success: boolean;
    data: { id: string; fullName: string; email: string; role: string; cooperativeId: string; dateInvited: string };
  }>(`/api/management/cooperatives/${cooperativeId}/managers/invite`, data);
  return response.data.data;
}

export async function revokeManager(cooperativeId: string, managerId: string): Promise<void> {
  await axiosInstance.patch(
    `/api/management/cooperatives/${cooperativeId}/managers/${managerId}/revoke`,
  );
}

export async function getMembers(
  cooperativeId: string,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<MemberListItem>> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: PaginatedResponse<MemberListItem>;
  }>(`/api/management/cooperatives/${cooperativeId}/members`, { params });
  return response.data.data;
}

export interface InviteMemberDto {
  firstName: string;
  lastName: string;
  email: string;
}

export async function inviteMember(
  cooperativeId: string,
  data: InviteMemberDto,
): Promise<{ id: string; firstName: string; lastName: string; email: string; cooperativeId: string }> {
  const response = await axiosInstance.post<{
    success: boolean;
    data: { id: string; firstName: string; lastName: string; email: string; cooperativeId: string };
  }>(`/api/management/cooperatives/${cooperativeId}/members/invite`, data);
  return response.data.data;
}

export async function revokeMember(cooperativeId: string, memberId: string): Promise<void> {
  await axiosInstance.patch(
    `/api/management/cooperatives/${cooperativeId}/members/${memberId}/revoke`,
  );
}
