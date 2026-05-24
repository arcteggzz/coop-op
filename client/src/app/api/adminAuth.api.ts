import axiosInstance from "./axiosInstance";
import { AdminUser } from "../context/AuthContext";

export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  requiresPasswordChange: boolean;
  admin: AdminUser;
}

export interface OtpRequestDto {
  email: string;
}

export interface ChangePasswordDto {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export async function loginAdmin(data: AdminLoginDto): Promise<AdminLoginResponse> {
  const response = await axiosInstance.post<{
    success: boolean;
    data: AdminLoginResponse;
  }>("/api/coop-admin/login", data);
  return response.data.data;
}

export async function requestAdminOtp(data: OtpRequestDto): Promise<void> {
  await axiosInstance.post("/api/coop-admin/request-otp", data);
}

export async function verifyOtpAndChangePassword(data: ChangePasswordDto): Promise<void> {
  await axiosInstance.post("/api/coop-admin/verify-otp-and-change-password", data);
}
