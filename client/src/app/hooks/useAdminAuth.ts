import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import * as adminAuth from "../api/adminAuth.api";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/axiosInstance";

export function useAdminLogin() {
  const navigate = useNavigate();
  const auth = useAuth();

  return useMutation({
    mutationFn: adminAuth.loginAdmin,
    onSuccess: (data) => {
      auth.login(data.token, data.admin, "admin");
      if (data.requiresPasswordChange) {
        navigate(
          `/admin/change-password?email=${encodeURIComponent(data.admin.email)}`,
        );
      } else {
        navigate("/admin/dashboard");
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useAdminRequestOtp() {
  return useMutation({
    mutationFn: adminAuth.requestAdminOtp,
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useAdminChangePassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: adminAuth.verifyOtpAndChangePassword,
    onSuccess: () => {
      toast.success("Password changed successfully. Please log in.");
      navigate("/admin/login");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
