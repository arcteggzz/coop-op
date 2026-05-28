import axiosInstance from "./axiosInstance";

export interface MemberLoginDto {
  email: string;
  password: string;
}

export interface MemberCooperativeRef {
  cooperativeId: string;
  cooperativeName: string;
  isDefault: boolean;
  memberSince?: string;
}

export interface MemberUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  defaultPasswordChanged: boolean;
  dateInvited: string;
}

export interface MemberLoginResponse {
  token: string;
  requiresPasswordChange: boolean;
  member: MemberUser;
  cooperatives: MemberCooperativeRef[];
}

export async function loginMember(
  data: MemberLoginDto,
): Promise<MemberLoginResponse> {
  const response = await axiosInstance.post<{
    success: boolean;
    data: MemberLoginResponse;
  }>("/api/member/login", data);
  return response.data.data;
}

export async function requestMemberOtp(data: { email: string }): Promise<void> {
  await axiosInstance.post("/api/member/request-otp", data);
}

export async function verifyOtpAndChangeMemberPassword(data: {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  await axiosInstance.post("/api/member/verify-otp-and-change-password", data);
}
