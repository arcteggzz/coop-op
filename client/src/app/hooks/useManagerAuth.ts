import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import * as managerAuth from "../api/managerAuth.api";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/axiosInstance";
import { CooperativeRef } from "../context/AuthContext";

export function useManagerLogin() {
  const navigate = useNavigate();
  const auth = useAuth();

  return useMutation({
    mutationFn: managerAuth.loginManager,
    onSuccess: (data) => {
      const coops: CooperativeRef[] = data.cooperatives.map((c) => ({
        cooperativeId: c.cooperativeId,
        cooperativeName: c.cooperativeName,
        isDefault: c.isDefault,
        role: c.role,
        permissions: c.permissions,
      }));
      auth.login(data.token, data.manager, "manager", coops);
      if (data.requiresPasswordChange) {
        navigate(`/manager/change-password?email=${encodeURIComponent(data.manager.email)}`);
      } else {
        navigate("/manager/dashboard");
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useManagerRequestOtp() {
  return useMutation({
    mutationFn: managerAuth.requestManagerOtp,
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useManagerChangePassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: managerAuth.verifyOtpAndChangeManagerPassword,
    onSuccess: () => {
      toast.success("Password changed successfully. Please log in.");
      navigate("/manager/login");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
