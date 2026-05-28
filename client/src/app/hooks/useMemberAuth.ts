import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import * as memberAuth from "../api/memberAuth.api";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/axiosInstance";
import { CooperativeRef } from "../context/AuthContext";

export function useMemberLogin() {
  const navigate = useNavigate();
  const auth = useAuth();

  return useMutation({
    mutationFn: memberAuth.loginMember,
    onSuccess: (data) => {
      const coops: CooperativeRef[] = data.cooperatives.map((c) => ({
        cooperativeId: c.cooperativeId,
        cooperativeName: c.cooperativeName,
        isDefault: c.isDefault,
      }));
      auth.login(data.token, data.member, "member", coops);
      if (data.requiresPasswordChange) {
        navigate(`/member/change-password?email=${encodeURIComponent(data.member.email)}`);
      } else {
        navigate("/member/dashboard");
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useMemberRequestOtp() {
  return useMutation({
    mutationFn: memberAuth.requestMemberOtp,
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}

export function useMemberChangePassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: memberAuth.verifyOtpAndChangeMemberPassword,
    onSuccess: () => {
      toast.success("Password changed successfully. Please log in.");
      navigate("/member/login");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
