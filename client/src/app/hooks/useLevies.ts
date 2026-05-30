import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "../api/levies.api";
import { getErrorMessage } from "../api/axiosInstance";

// ─── Admin / Manager hooks (differentiated by baseUrl) ───────────────────────

export function useLevies(
  baseUrl: string,
  cooperativeId: string,
  params?: { page?: number; pageSize?: number; isActive?: boolean },
) {
  return useQuery({
    queryKey: ["levies", baseUrl, cooperativeId, params],
    queryFn: () => api.listLevies(baseUrl, params),
    enabled: !!cooperativeId,
  });
}

export function useLevy(
  baseUrl: string,
  cooperativeId: string,
  levyId: string,
) {
  return useQuery({
    queryKey: ["levy", baseUrl, cooperativeId, levyId],
    queryFn: () => api.getLevy(baseUrl, levyId),
    enabled: !!cooperativeId && !!levyId,
  });
}

export function useCreateLevy(baseUrl: string, cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: api.CreateLevyDto) => api.createLevy(baseUrl, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["levies", baseUrl, cooperativeId],
      });
      toast.success("Levy created successfully.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useUpdateLevy(baseUrl: string, cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      levyId,
      dto,
    }: {
      levyId: string;
      dto: api.UpdateLevyDto;
    }) => api.updateLevy(baseUrl, levyId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["levies", baseUrl, cooperativeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["levy", baseUrl, cooperativeId],
      });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useDeleteLevy(baseUrl: string, cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (levyId: string) => api.deleteLevy(baseUrl, levyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["levies", baseUrl, cooperativeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-levies"],
      });
      toast.success("Levy deleted.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useAssignLevy(
  baseUrl: string,
  cooperativeId: string,
  levyId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: api.AssignLevyDto) =>
      api.assignLevy(baseUrl, levyId, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["levy", baseUrl, cooperativeId, levyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["levy-assignments", baseUrl, cooperativeId, levyId],
      });
      toast.success(
        `Levy assigned — ${data.assigned} members${data.skipped > 0 ? `, ${data.skipped} skipped (already assigned)` : ""}.`,
      );
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useLevyAssignments(
  baseUrl: string,
  cooperativeId: string,
  levyId: string,
  params?: { page?: number; pageSize?: number; status?: string },
) {
  return useQuery({
    queryKey: ["levy-assignments", baseUrl, cooperativeId, levyId, params],
    queryFn: () => api.listLevyAssignments(baseUrl, levyId, params),
    enabled: !!cooperativeId && !!levyId,
  });
}

export function useRecordLevyPayment(
  baseUrl: string,
  cooperativeId: string,
  levyId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      dto,
    }: {
      assignmentId: string;
      dto: api.RecordLevyPaymentDto;
    }) => api.recordLevyPayment(baseUrl, assignmentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["levy-assignments", baseUrl, cooperativeId, levyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["levy", baseUrl, cooperativeId, levyId],
      });
      toast.success("Payment recorded.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useWaiveLevyAssignment(
  baseUrl: string,
  cooperativeId: string,
  levyId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      dto,
    }: {
      assignmentId: string;
      dto: api.WaiveLevyAssignmentDto;
    }) => api.waiveLevyAssignment(baseUrl, assignmentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["levy-assignments", baseUrl, cooperativeId, levyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["levy", baseUrl, cooperativeId, levyId],
      });
      toast.success("Assignment waived.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

// ─── Admin global overview hook ───────────────────────────────────────────────

export function useAllLevies(params?: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  cooperativeId?: string;
}) {
  return useQuery({
    queryKey: ["all-levies", params],
    queryFn: () => api.getAllLevies(params),
  });
}

// ─── Member hooks ─────────────────────────────────────────────────────────────

export function useMemberLevyAssignments(
  cooperativeId: string,
  params?: { page?: number; pageSize?: number; status?: string },
) {
  return useQuery({
    queryKey: ["member-levy-assignments", cooperativeId, params],
    queryFn: () => api.getMemberLevyAssignments(cooperativeId, params),
    enabled: !!cooperativeId,
  });
}

export function useMemberLevyAssignment(
  cooperativeId: string,
  assignmentId: string,
) {
  return useQuery({
    queryKey: ["member-levy-assignment", cooperativeId, assignmentId],
    queryFn: () => api.getMemberLevyAssignment(cooperativeId, assignmentId),
    enabled: !!cooperativeId && !!assignmentId,
  });
}

export function usePayMemberLevy(cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      api.payMemberLevy(cooperativeId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["member-levy-assignments", cooperativeId],
      });
      toast.success("Levy payment successful.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
