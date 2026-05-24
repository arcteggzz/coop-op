import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "../api/adminManagement.api";
import { getErrorMessage } from "../api/axiosInstance";

export function useAdmins(params?: {
  page?: number;
  pageSize?: number;
  role?: string;
  isActive?: number;
}) {
  return useQuery({
    queryKey: ["admins", params],
    queryFn: () => api.getAdmins(params),
  });
}

export function useInviteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.inviteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Invitation sent successfully.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useRevokeAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.revokeAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin access revoked.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useRestoreAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.restoreAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin access restored.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useUpdateAdminPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, permissions }: { adminId: string; permissions: string[] }) =>
      api.updateAdminPermissions(adminId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Permissions updated successfully.");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
