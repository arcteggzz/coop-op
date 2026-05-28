import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "../api/managerManagement.api";
import { getErrorMessage } from "../api/axiosInstance";

export function useManagers(cooperativeId: string) {
  return useQuery({
    queryKey: ["manager-managers", cooperativeId],
    queryFn: () => api.getManagers(cooperativeId),
    enabled: !!cooperativeId,
  });
}

export function useInviteManager(cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: api.InviteManagerDto) => api.inviteManager(cooperativeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-managers", cooperativeId] });
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
    mutationFn: (managerId: string) => api.revokeManager(cooperativeId, managerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-managers", cooperativeId] });
      toast.success("Manager access revoked.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useManagerMembers(cooperativeId: string) {
  return useQuery({
    queryKey: ["manager-members", cooperativeId],
    queryFn: () => api.getMembers(cooperativeId),
    enabled: !!cooperativeId,
  });
}

export function useInviteManagerMember(cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: api.InviteMemberDto) => api.inviteMember(cooperativeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-members", cooperativeId] });
      toast.success("Member invited successfully.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useRevokeManagerMember(cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => api.revokeMember(cooperativeId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-members", cooperativeId] });
      toast.success("Member access revoked.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
