import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "../api/dues.api";
import { getErrorMessage } from "../api/axiosInstance";

// ─── Admin / Manager hooks (differentiated by baseUrl) ───────────────────────

export function useDueSchedules(
  baseUrl: string,
  cooperativeId: string,
  params?: { page?: number; pageSize?: number; isActive?: boolean },
) {
  return useQuery({
    queryKey: ["due-schedules", baseUrl, cooperativeId, params],
    queryFn: () => api.listDueSchedules(baseUrl, params),
    enabled: !!cooperativeId,
  });
}

export function useDueSchedule(
  baseUrl: string,
  cooperativeId: string,
  scheduleId: string,
) {
  return useQuery({
    queryKey: ["due-schedule", baseUrl, cooperativeId, scheduleId],
    queryFn: () => api.getDueSchedule(baseUrl, scheduleId),
    enabled: !!cooperativeId && !!scheduleId,
  });
}

export function useCreateDueSchedule(baseUrl: string, cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: api.CreateDueScheduleDto) =>
      api.createDueSchedule(baseUrl, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["due-schedules", baseUrl, cooperativeId],
      });
      toast.success("Due schedule created successfully.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useUpdateDueSchedule(baseUrl: string, cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      dto,
    }: {
      scheduleId: string;
      dto: api.UpdateDueScheduleDto;
    }) => api.updateDueSchedule(baseUrl, scheduleId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["due-schedules", baseUrl, cooperativeId],
      });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useDeleteDueSchedule(baseUrl: string, cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: string) =>
      api.deleteDueSchedule(baseUrl, scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["due-schedules", baseUrl, cooperativeId],
      });
      toast.success("Due schedule deleted.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useIssueDues(
  baseUrl: string,
  cooperativeId: string,
  scheduleId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: api.IssueDuesDto) =>
      api.issueDues(baseUrl, scheduleId, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["due-payments", baseUrl, cooperativeId],
      });
      toast.success(
        `Dues issued for "${data.periodLabel}" — ${data.membersIssued} members.`,
      );
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useDuePayments(
  baseUrl: string,
  cooperativeId: string,
  params?: {
    page?: number;
    pageSize?: number;
    scheduleId?: string;
    memberId?: string;
    periodLabel?: string;
    status?: string;
  },
) {
  return useQuery({
    queryKey: ["due-payments", baseUrl, cooperativeId, params],
    queryFn: () => api.listDuePayments(baseUrl, params),
    enabled: !!cooperativeId,
  });
}

export function useRecordDuePayment(baseUrl: string, cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      dto,
    }: {
      paymentId: string;
      dto: api.RecordPaymentDto;
    }) => api.recordDuePayment(baseUrl, paymentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["due-payments", baseUrl, cooperativeId],
      });
      toast.success("Payment recorded.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useWaiveDuePayment(baseUrl: string, cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      dto,
    }: {
      paymentId: string;
      dto: api.WaivePaymentDto;
    }) => api.waiveDuePayment(baseUrl, paymentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["due-payments", baseUrl, cooperativeId],
      });
      toast.success("Payment waived.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

// ─── Admin global overview hook ───────────────────────────────────────────────

export function useAllDueSchedules(params?: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  cooperativeId?: string;
}) {
  return useQuery({
    queryKey: ["all-due-schedules", params],
    queryFn: () => api.getAllDueSchedules(params),
  });
}

// ─── Member hooks ─────────────────────────────────────────────────────────────

export function useMemberDueSchedules(cooperativeId: string) {
  return useQuery({
    queryKey: ["member-due-schedules", cooperativeId],
    queryFn: () => api.getMemberDueSchedules(cooperativeId),
    enabled: !!cooperativeId,
  });
}

export function useMemberDuePayments(
  cooperativeId: string,
  params?: {
    page?: number;
    pageSize?: number;
    scheduleId?: string;
    status?: string;
  },
) {
  return useQuery({
    queryKey: ["member-due-payments", cooperativeId, params],
    queryFn: () => api.getMemberDuePayments(cooperativeId, params),
    enabled: !!cooperativeId,
  });
}

export function useMemberOutstandingDues(cooperativeId: string) {
  return useQuery({
    queryKey: ["member-outstanding-dues", cooperativeId],
    queryFn: () => api.getMemberOutstandingDues(cooperativeId),
    enabled: !!cooperativeId,
  });
}

export function usePayMemberDue(cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) =>
      api.payMemberDue(cooperativeId, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["member-outstanding-dues", cooperativeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["member-due-payments", cooperativeId],
      });
      toast.success("Payment successful.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
