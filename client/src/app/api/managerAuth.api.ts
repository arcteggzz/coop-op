import axiosInstance from "./axiosInstance";

export interface ManagerLoginDto {
  email: string;
  password: string;
}

export interface ManagerCooperativeRef {
  cooperativeId: string;
  cooperativeName: string;
  role: "RootManager" | "SuperManager" | "Support";
  isDefault: boolean;
  permissions: string[];
}

export interface ManagerUser {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  defaultPasswordChanged: boolean;
  dateInvited: string;
}

export interface ManagerLoginResponse {
  token: string;
  requiresPasswordChange: boolean;
  manager: ManagerUser;
  cooperatives: ManagerCooperativeRef[];
}

export async function loginManager(data: ManagerLoginDto): Promise<ManagerLoginResponse> {
  const response = await axiosInstance.post<{ success: boolean; data: ManagerLoginResponse }>(
    "/api/management/login",
    data,
  );
  return response.data.data;
}

export async function requestManagerOtp(data: { email: string }): Promise<void> {
  await axiosInstance.post("/api/management/request-otp", data);
}

export async function verifyOtpAndChangeManagerPassword(data: {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  await axiosInstance.post("/api/management/verify-otp-and-change-password", data);
}
