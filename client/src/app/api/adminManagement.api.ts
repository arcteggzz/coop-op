import axiosInstance from "./axiosInstance";
import { AdminUser } from "../context/AuthContext";

export interface AdminListItem {
  id: string;
  fullName: string;
  email: string;
  role: "RootAdmin" | "SuperAdmin" | "Admin";
  isActive: boolean;
  dateInvited: string;
  permissions: string[];
}

export interface PaginatedAdmins {
  data: AdminListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InviteAdminDto {
  fullName: string;
  email: string;
  role: "SuperAdmin" | "Admin";
  permissions?: string[];
}

export async function getAdmins(params?: {
  page?: number;
  pageSize?: number;
  role?: string;
  isActive?: number;
}): Promise<PaginatedAdmins> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: PaginatedAdmins;
  }>("/api/coop-admin/admins", { params });
  return response.data.data;
}

export async function getAdmin(adminId: string): Promise<AdminUser> {
  const response = await axiosInstance.get<{
    success: boolean;
    data: AdminUser;
  }>(`/api/coop-admin/admins/${adminId}`);
  return response.data.data;
}

export async function inviteAdmin(data: InviteAdminDto): Promise<AdminUser> {
  const response = await axiosInstance.post<{
    success: boolean;
    data: AdminUser;
  }>("/api/coop-admin/admins/invite", data);
  return response.data.data;
}

export async function revokeAdmin(adminId: string): Promise<void> {
  await axiosInstance.patch(`/api/coop-admin/admins/${adminId}/revoke`);
}

export async function restoreAdmin(adminId: string): Promise<void> {
  await axiosInstance.patch(`/api/coop-admin/admins/${adminId}/restore`);
}

export async function updateAdminPermissions(
  adminId: string,
  permissions: string[],
): Promise<void> {
  await axiosInstance.patch(`/api/coop-admin/admins/${adminId}/permissions`, {
    permissions,
  });
}
