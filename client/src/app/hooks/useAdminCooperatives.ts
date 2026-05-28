import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "../api/adminCooperatives.api";
import { getErrorMessage } from "../api/axiosInstance";

export function useCooperatives(params?: {
  page?: number;
  pageSize?: number;
  name?: string;
}) {
  return useQuery({
    queryKey: ["cooperatives", params],
    queryFn: () => api.getCooperatives(params),
  });
}

export function useCooperative(cooperativeId: string) {
  return useQuery({
    queryKey: ["cooperative", cooperativeId],
    queryFn: () => api.getCooperative(cooperativeId),
    enabled: !!cooperativeId,
  });
}

export function useCreateCooperative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCooperative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      toast.success("Cooperative created successfully.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useCooperativeManagers(cooperativeId: string) {
  return useQuery({
    queryKey: ["cooperative-managers", cooperativeId],
    queryFn: () => api.getCooperativeManagers(cooperativeId),
    enabled: !!cooperativeId,
  });
}

export function useInviteManager(cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: api.InviteManagerDto) =>
      api.inviteCooperativeManager(cooperativeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cooperative-managers", cooperativeId],
      });
      toast.success("Manager invited successfully.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useRevokeManager(cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (managerId: string) =>
      api.revokeCooperativeManager(cooperativeId, managerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cooperative-managers", cooperativeId],
      });
      toast.success("Manager access revoked.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useCooperativeMembers(cooperativeId: string) {
  return useQuery({
    queryKey: ["cooperative-members", cooperativeId],
    queryFn: () => api.getCooperativeMembers(cooperativeId),
    enabled: !!cooperativeId,
  });
}

export function useInviteCooperativeMember(cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: api.InviteMemberDto) =>
      api.inviteCooperativeMember(cooperativeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cooperative-members", cooperativeId],
      });
      toast.success("Member invited successfully.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useRevokeCooperativeMember(cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.revokeCooperativeMember(cooperativeId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cooperative-members", cooperativeId],
      });
      toast.success("Member access revoked.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

// ─── Dashboard: Summary + Wallets ─────────────────────────────────────────────

export function useAdminCooperativeSummary(cooperativeId: string) {
  return useQuery({
    queryKey: ["admin-coop-summary", cooperativeId],
    queryFn: () => api.getAdminCooperativeSummary(cooperativeId),
    enabled: !!cooperativeId,
  });
}

export function useAdminCooperativeWallets(cooperativeId: string) {
  return useQuery({
    queryKey: ["admin-coop-wallets", cooperativeId],
    queryFn: () => api.getAdminCooperativeWallets(cooperativeId),
    enabled: !!cooperativeId,
  });
}

export function useCreateAdminCooperativeWallet(cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletName: string) =>
      api.createAdminCooperativeWallet(cooperativeId, walletName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-coop-wallets", cooperativeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-coop-summary", cooperativeId],
      });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
