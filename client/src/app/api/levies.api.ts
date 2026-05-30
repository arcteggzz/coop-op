import axiosInstance from "./axiosInstance";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface Levy {
  id: string;
  cooperativeId: string;
  name: string;
  description?: string | null;
  defaultAmount: number;
  levyAccountNumber: string;
  dueDate: string;
  isActive: boolean;
  createdByName?: string | null;
  createdByType?: "Admin" | "Manager" | null;
  assignedCount?: number;
  dateCreated: string;
  dateUpdated?: string | null;
  summary?: LevySummary;
}

export interface LevyWithCoop extends Levy {
  cooperativeName: string;
}

export interface LevySummary {
  total: number;
  paid: number;
  pending: number;
  waived: number;
  totalExpected: number;
  totalCollected: number;
}

export interface LevyAssignment {
  id: string;
  levyId: string;
  memberId: string;
  memberFullName: string;
  levyName: string;
  amount: number;
  levyAccountNumber: string | null;
  status: "Pending" | "Paid" | "Waived";
  paidDate: string | null;
  paidAmount: number | null;
  notes: string | null;
  dateCreated: string;
}

export interface MemberLevyAssignment {
  id: string;
  levyId: string;
  levyName: string;
  amount: number;
  dueDate: string;
  status: "Pending" | "Paid" | "Waived";
  paidDate: string | null;
  paidAmount: number | null;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateLevyDto {
  name: string;
  description?: string;
  defaultAmount: number;
  levyAccountNumber: string;
  dueDate: string;
}

export interface UpdateLevyDto {
  name?: string;
  description?: string;
  defaultAmount?: number;
  levyAccountNumber?: string;
  dueDate?: string;
  isActive?: boolean;
}

export interface AssignLevyDto {
  assignTo: "all" | "specific";
  memberIds?: string[];
  amountOverrides?: { memberId: string; amount: number }[];
}

export interface RecordLevyPaymentDto {
  paidAmount: number;
  notes?: string;
}

export interface WaiveLevyAssignmentDto {
  notes?: string;
}

// ─── Admin / Manager shared API (differentiated by baseUrl) ──────────────────

export async function createLevy(
  baseUrl: string,
  dto: CreateLevyDto,
): Promise<Levy> {
  const res = await axiosInstance.post<{
    success: boolean;
    data: { levy: Levy };
  }>(baseUrl, dto);
  return res.data.data.levy;
}

export async function listLevies(
  baseUrl: string,
  params?: { page?: number; pageSize?: number; isActive?: boolean },
): Promise<PaginatedResult<Levy>> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: PaginatedResult<Levy>;
  }>(baseUrl, { params });
  return res.data.data;
}

export async function getLevy(
  baseUrl: string,
  levyId: string,
): Promise<Levy> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: { levy: Levy };
  }>(`${baseUrl}/${levyId}`);
  return res.data.data.levy;
}

export async function updateLevy(
  baseUrl: string,
  levyId: string,
  dto: UpdateLevyDto,
): Promise<Levy> {
  const res = await axiosInstance.patch<{
    success: boolean;
    data: { levy: Levy };
  }>(`${baseUrl}/${levyId}`, dto);
  return res.data.data.levy;
}

export async function deleteLevy(
  baseUrl: string,
  levyId: string,
): Promise<void> {
  await axiosInstance.delete(`${baseUrl}/${levyId}`);
}

export async function assignLevy(
  baseUrl: string,
  levyId: string,
  dto: AssignLevyDto,
): Promise<{ levyId: string; assigned: number; skipped: number }> {
  const res = await axiosInstance.post<{
    success: boolean;
    data: { levyId: string; assigned: number; skipped: number };
  }>(`${baseUrl}/${levyId}/assign`, dto);
  return res.data.data;
}

export async function listLevyAssignments(
  baseUrl: string,
  levyId: string,
  params?: { page?: number; pageSize?: number; status?: string },
): Promise<PaginatedResult<LevyAssignment>> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: PaginatedResult<LevyAssignment>;
  }>(`${baseUrl}/${levyId}/assignments`, { params });
  return res.data.data;
}

export async function recordLevyPayment(
  baseUrl: string,
  assignmentId: string,
  dto: RecordLevyPaymentDto,
): Promise<{ id: string; memberId: string; status: string; paidAmount: number }> {
  const res = await axiosInstance.patch<{
    success: boolean;
    data: { id: string; memberId: string; status: string; paidAmount: number };
  }>(`${baseUrl}/assignments/${assignmentId}/record`, dto);
  return res.data.data;
}

export async function waiveLevyAssignment(
  baseUrl: string,
  assignmentId: string,
  dto: WaiveLevyAssignmentDto,
): Promise<{ id: string; memberId: string; status: string }> {
  const res = await axiosInstance.patch<{
    success: boolean;
    data: { id: string; memberId: string; status: string };
  }>(`${baseUrl}/assignments/${assignmentId}/waive`, dto);
  return res.data.data;
}

// ─── Admin global overview ────────────────────────────────────────────────────

export async function getAllLevies(params?: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  cooperativeId?: string;
}): Promise<PaginatedResult<LevyWithCoop>> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: PaginatedResult<LevyWithCoop>;
  }>("/api/coop-admin/levies", { params });
  return res.data.data;
}

// ─── Member API ───────────────────────────────────────────────────────────────

export async function getMemberLevyAssignments(
  cooperativeId: string,
  params?: { page?: number; pageSize?: number; status?: string },
): Promise<PaginatedResult<MemberLevyAssignment>> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: PaginatedResult<MemberLevyAssignment>;
  }>(`/api/member/levies/${cooperativeId}`, { params });
  return res.data.data;
}

export async function getMemberLevyAssignment(
  cooperativeId: string,
  assignmentId: string,
): Promise<MemberLevyAssignment> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: { assignment: MemberLevyAssignment };
  }>(`/api/member/levies/${cooperativeId}/${assignmentId}`);
  return res.data.data.assignment;
}

export async function payMemberLevy(
  cooperativeId: string,
  assignmentId: string,
): Promise<{
  id: string;
  levyName: string;
  status: string;
  paidDate: string;
  paidAmount: number;
}> {
  const res = await axiosInstance.post<{
    success: boolean;
    data: {
      id: string;
      levyName: string;
      status: string;
      paidDate: string;
      paidAmount: number;
    };
  }>(`/api/member/levies/${cooperativeId}/${assignmentId}/pay`);
  return res.data.data;
}
