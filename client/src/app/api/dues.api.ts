import axiosInstance from "./axiosInstance";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface DueSchedule {
  id: string;
  cooperativeId: string;
  name: string;
  description?: string | null;
  amount: number;
  frequency: "Monthly" | "Quarterly" | "Biannual" | "Annual" | "OneTime";
  startDate: string;
  endDate?: string | null;
  dueAccountNumber: string;
  isActive: boolean;
  createdByName?: string | null;
  createdByType?: "Admin" | "Manager" | null;
  dateCreated: string;
  dateUpdated?: string | null;
}

export interface DueScheduleWithCoop extends DueSchedule {
  cooperativeName: string;
}

export interface DuePayment {
  id: string;
  scheduleId: string;
  scheduleName: string;
  memberId: string;
  memberFullName: string;
  periodLabel: string;
  dueDate: string;
  amount: number;
  status: "Pending" | "Paid" | "Waived" | "Overdue";
  paidDate: string | null;
  paidAmount: number | null;
  dueAccountNumber: string | null;
  memberAccountNumber: string | null;
  dateCreated: string;
}

export interface MemberDuePayment {
  id: string;
  scheduleId: string;
  scheduleName: string;
  periodLabel: string;
  dueDate: string;
  amount: number;
  status: "Pending" | "Paid" | "Waived" | "Overdue";
  paidDate: string | null;
  paidAmount: number | null;
}

export interface OutstandingDuePayment {
  id: string;
  scheduleId: string;
  scheduleName: string;
  periodLabel: string;
  dueDate: string;
  amount: number;
  status: "Pending" | "Overdue";
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateDueScheduleDto {
  name: string;
  description?: string;
  amount: number;
  frequency: string;
  startDate: string;
  endDate?: string;
  dueAccountNumber: string;
}

export interface UpdateDueScheduleDto {
  name?: string;
  description?: string;
  amount?: number;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  dueAccountNumber?: string;
  isActive?: boolean;
}

export interface IssueDuesDto {
  periodLabel: string;
  dueDate: string;
  amount?: number;
}

export interface RecordPaymentDto {
  paidAmount: number;
  notes?: string;
}

export interface WaivePaymentDto {
  notes?: string;
}

// ─── Admin / Manager shared API (differentiated by baseUrl) ──────────────────

export async function createDueSchedule(
  baseUrl: string,
  dto: CreateDueScheduleDto,
): Promise<DueSchedule> {
  const res = await axiosInstance.post<{
    success: boolean;
    data: { schedule: DueSchedule };
  }>(`${baseUrl}/schedules`, dto);
  return res.data.data.schedule;
}

export async function listDueSchedules(
  baseUrl: string,
  params?: { page?: number; pageSize?: number; isActive?: boolean },
): Promise<PaginatedResult<DueSchedule>> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: PaginatedResult<DueSchedule>;
  }>(`${baseUrl}/schedules`, { params });
  return res.data.data;
}

export async function getDueSchedule(
  baseUrl: string,
  scheduleId: string,
): Promise<DueSchedule> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: { schedule: DueSchedule };
  }>(`${baseUrl}/schedules/${scheduleId}`);
  return res.data.data.schedule;
}

export async function updateDueSchedule(
  baseUrl: string,
  scheduleId: string,
  dto: UpdateDueScheduleDto,
): Promise<DueSchedule> {
  const res = await axiosInstance.patch<{
    success: boolean;
    data: { schedule: DueSchedule };
  }>(`${baseUrl}/schedules/${scheduleId}`, dto);
  return res.data.data.schedule;
}

export async function deleteDueSchedule(
  baseUrl: string,
  scheduleId: string,
): Promise<void> {
  await axiosInstance.delete(`${baseUrl}/schedules/${scheduleId}`);
}

export async function issueDues(
  baseUrl: string,
  scheduleId: string,
  dto: IssueDuesDto,
): Promise<{
  periodLabel: string;
  dueDate: string;
  amount: number;
  membersIssued: number;
}> {
  const res = await axiosInstance.post<{
    success: boolean;
    data: {
      periodLabel: string;
      dueDate: string;
      amount: number;
      membersIssued: number;
    };
  }>(`${baseUrl}/schedules/${scheduleId}/issue`, dto);
  return res.data.data;
}

export async function listDuePayments(
  baseUrl: string,
  params?: {
    page?: number;
    pageSize?: number;
    scheduleId?: string;
    memberId?: string;
    periodLabel?: string;
    status?: string;
  },
): Promise<PaginatedResult<DuePayment>> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: PaginatedResult<DuePayment>;
  }>(`${baseUrl}/payments`, { params });
  return res.data.data;
}

export async function recordDuePayment(
  baseUrl: string,
  paymentId: string,
  dto: RecordPaymentDto,
): Promise<{
  id: string;
  memberId: string;
  periodLabel: string;
  status: string;
  paidAmount: number;
}> {
  const res = await axiosInstance.patch<{
    success: boolean;
    data: {
      id: string;
      memberId: string;
      periodLabel: string;
      status: string;
      paidAmount: number;
    };
  }>(`${baseUrl}/payments/${paymentId}/record`, dto);
  return res.data.data;
}

export async function waiveDuePayment(
  baseUrl: string,
  paymentId: string,
  dto: WaivePaymentDto,
): Promise<{
  id: string;
  memberId: string;
  periodLabel: string;
  status: string;
}> {
  const res = await axiosInstance.patch<{
    success: boolean;
    data: { id: string; memberId: string; periodLabel: string; status: string };
  }>(`${baseUrl}/payments/${paymentId}/waive`, dto);
  return res.data.data;
}

export interface MemberScheduleSummary {
  summary: { totalPaid: number; totalOwed: number; cyclesEnrolled: number };
  payments: DuePayment[];
}

export async function getMemberScheduleSummary(
  baseUrl: string,
  scheduleId: string,
  memberId: string,
): Promise<MemberScheduleSummary> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: MemberScheduleSummary;
  }>(`${baseUrl}/schedules/${scheduleId}/member-summary/${memberId}`);
  return res.data.data;
}

// ─── Admin global overview ────────────────────────────────────────────────────

export async function getAllDueSchedules(params?: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  cooperativeId?: string;
}): Promise<PaginatedResult<DueScheduleWithCoop>> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: PaginatedResult<DueScheduleWithCoop>;
  }>("/api/coop-admin/dues", { params });
  return res.data.data;
}

// ─── Member API ───────────────────────────────────────────────────────────────

export async function getMemberDueSchedules(
  cooperativeId: string,
): Promise<{ data: DueSchedule[] }> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: { data: DueSchedule[] };
  }>(`/api/member/dues/${cooperativeId}/schedules`);
  return res.data.data;
}

export async function getMemberDuePayments(
  cooperativeId: string,
  params?: {
    page?: number;
    pageSize?: number;
    scheduleId?: string;
    status?: string;
  },
): Promise<PaginatedResult<MemberDuePayment>> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: PaginatedResult<MemberDuePayment>;
  }>(`/api/member/dues/${cooperativeId}/payments`, { params });
  return res.data.data;
}

export async function getMemberOutstandingDues(
  cooperativeId: string,
): Promise<{ data: OutstandingDuePayment[]; totalOutstanding: number }> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: { data: OutstandingDuePayment[]; totalOutstanding: number };
  }>(`/api/member/dues/${cooperativeId}/payments/outstanding`);
  return res.data.data;
}

export async function payMemberDue(
  cooperativeId: string,
  paymentId: string,
): Promise<{
  id: string;
  periodLabel: string;
  status: string;
  paidDate: string;
  paidAmount: number;
}> {
  const res = await axiosInstance.post<{
    success: boolean;
    data: {
      id: string;
      periodLabel: string;
      status: string;
      paidDate: string;
      paidAmount: number;
    };
  }>(`/api/member/dues/${cooperativeId}/payments/${paymentId}/pay`);
  return res.data.data;
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────

export interface ActiveDueSummary {
  dueId: string;
  name: string;
  amount: number;
  cycleStart: string | null;
  cycleEnd: string | null;
  daysLeft: number | null;
  paidCount: number;
  unpaidCount: number;
  totalExpected: number;
  totalCollected: number;
  percentageCollected: number;
  memberStatus?: "paid" | "unpaid" | null;
}

export interface UpcomingDueSummary {
  dueId: string;
  name: string;
  amount: number;
  startDate: string;
  daysUntilStart: number;
  memberCount: number;
}

export interface DueDashboardSummary {
  cooperativeId: string;
  cycleLabel: string;
  state: "active" | "upcoming" | "mixed" | "all_paid" | "no_dues";
  aggregates: {
    totalExpected: number;
    totalCollected: number;
    totalMembersBehind: number;
    activeDuesCount: number;
    upcomingDuesCount: number;
  };
  activeDues: ActiveDueSummary[];
  upcomingDues: UpcomingDueSummary[];
}

export async function getAdminDueDashboardSummary(
  cooperativeId: string,
): Promise<DueDashboardSummary> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: DueDashboardSummary;
  }>(`/api/coop-admin/cooperatives/${cooperativeId}/dues/dashboard-summary`);
  return res.data.data;
}

export async function getManagerDueDashboardSummary(
  cooperativeId: string,
): Promise<DueDashboardSummary> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: DueDashboardSummary;
  }>(`/api/management/dues/${cooperativeId}/dashboard-summary`);
  return res.data.data;
}

export async function getMemberDueDashboardSummary(
  cooperativeId: string,
): Promise<DueDashboardSummary> {
  const res = await axiosInstance.get<{
    success: boolean;
    data: DueDashboardSummary;
  }>(`/api/member/dues/${cooperativeId}/dashboard-summary`);
  return res.data.data;
}
