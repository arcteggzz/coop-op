import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useMemberRequestOtp, useMemberChangePassword } from "../../hooks/useMemberAuth";
import { toast } from "sonner";

type Step = "email" | "otp" | "password";

export default function MemberChangePassword() {
  const location = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const requestOtpMutation = useMemberRequestOtp();
  const changePasswordMutation = useMemberChangePassword();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get("email");
    if (emailParam) setEmail(emailParam);
  }, [location.search]);

  const stepNumber = step === "email" ? 1 : step === "otp" ? 2 : 3;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    requestOtpMutation.mutate(
      { email },
      { onSuccess: () => { toast.success("OTP sent to your email."); setStep("otp"); } },
    );
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    setStep("password");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.error("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    changePasswordMutation.mutate({ email, otp, newPassword, confirmPassword });
  };

  return (
    <div className="bg-[#fafbfd] min-h-screen flex flex-col">
      <div className="bg-gradient-to-r from-[#7F56D9] via-[#6941c6] to-[#9e77ed] h-[4px] w-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="flex items-center gap-[10px] mb-8">
          <div
            className="size-[40px] rounded-[10px] flex items-center justify-center"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgb(127, 86, 217) 0%, rgb(105, 65, 198) 100%)",
            }}
          >
            <span className="text-white font-bold text-[16px]">C</span>
          </div>
          <div>
            <p className="font-['Albert_Sans',sans-serif] font-bold text-[22px] leading-[33px] text-[#101828] tracking-[-0.44px]">
              Coop-op
            </p>
            <p className="font-['Albert_Sans',sans-serif] font-medium text-[11px] leading-[16.5px] text-[#99a1af]">
              Member Portal
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#f3f4f6] rounded-[20px] p-8 w-full max-w-[420px] shadow-sm">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((n, i) => (
              <>
                <div
                  key={n}
                  className={`size-7 rounded-full flex items-center justify-center font-['Albert_Sans',sans-serif] font-bold text-[12px] ${
                    stepNumber >= n
                      ? "bg-[#7F56D9] text-white"
                      : "bg-[#f3f4f6] text-[#99a1af]"
                  }`}
                >
                  {n}
                </div>
                {i < 2 && (
                  <div
                    className={`flex-1 h-[2px] rounded-full ${
                      stepNumber > n ? "bg-[#7F56D9]" : "bg-[#f3f4f6]"
                    }`}
                  />
                )}
              </>
            ))}
            <p className="font-['Albert_Sans',sans-serif] text-[12px] text-[#99a1af] ml-2 whitespace-nowrap">
              Step {stepNumber} of 3
            </p>
          </div>

          {step === "email" && (
            <>
              <h1 className="font-['Albert_Sans',sans-serif] font-bold text-[24px] leading-[32px] text-[#101828] tracking-[-0.48px] mb-2">
                Forgot Password
              </h1>
              <p className="font-['Albert_Sans',sans-serif] text-[14px] leading-[20px] text-[#6a7282] mb-6">
                Enter your member email to receive a one-time passcode.
              </p>
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="font-['Albert_Sans',sans-serif] font-medium text-[13px] text-[#101828] block mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-[10px] font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#7F56D9] transition-colors"
                    placeholder="member@cooperative.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={requestOtpMutation.isPending}
                  className="w-full bg-gradient-to-r from-[#7F56D9] to-[#6941c6] text-white font-['Albert_Sans',sans-serif] font-semibold text-[14px] py-3 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
                >
                  {requestOtpMutation.isPending ? "Sending..." : "Send OTP"}
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h1 className="font-['Albert_Sans',sans-serif] font-bold text-[24px] leading-[32px] text-[#101828] tracking-[-0.48px] mb-2">
                Enter OTP
              </h1>
              <p className="font-['Albert_Sans',sans-serif] text-[14px] leading-[20px] text-[#6a7282] mb-6">
                Enter the 6-digit code sent to <strong>{email}</strong>.
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="font-['Albert_Sans',sans-serif] font-medium text-[13px] text-[#101828] block mb-2">
                    One-Time Passcode (OTP)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength={6}
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-[10px] font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#7F56D9] transition-colors tracking-[0.3em] text-center text-[18px]"
                    placeholder="123456"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#7F56D9] to-[#6941c6] text-white font-['Albert_Sans',sans-serif] font-semibold text-[14px] py-3 rounded-[10px] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-[#6a7282] font-['Albert_Sans',sans-serif] text-[13px] py-2 hover:text-[#101828] transition-colors cursor-pointer"
                >
                  Back to Step 1
                </button>
              </form>
            </>
          )}

          {step === "password" && (
            <>
              <h1 className="font-['Albert_Sans',sans-serif] font-bold text-[24px] leading-[32px] text-[#101828] tracking-[-0.48px] mb-2">
                Set New Password
              </h1>
              <p className="font-['Albert_Sans',sans-serif] text-[14px] leading-[20px] text-[#6a7282] mb-6">
                Choose a strong new password for your account.
              </p>
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="font-['Albert_Sans',sans-serif] font-medium text-[13px] text-[#101828] block mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-[10px] font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#7F56D9] transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="font-['Albert_Sans',sans-serif] font-medium text-[13px] text-[#101828] block mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-[#e5e7eb] rounded-[10px] font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#7F56D9] transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="w-full bg-gradient-to-r from-[#7F56D9] to-[#6941c6] text-white font-['Albert_Sans',sans-serif] font-semibold text-[14px] py-3 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
                >
                  {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("otp")}
                  className="w-full text-[#6a7282] font-['Albert_Sans',sans-serif] text-[13px] py-2 hover:text-[#101828] transition-colors cursor-pointer"
                >
                  Back to Step 2
                </button>
              </form>
            </>
          )}
        </div>

        <p className="font-['Albert_Sans',sans-serif] text-[13px] text-[#6a7282] text-center mt-5">
          <Link
            to="/member/login"
            className="text-[#7F56D9] font-medium hover:underline"
          >
            Back to Login
          </Link>
        </p>
      </div>

      <div className="border-t border-[#f3f4f6] py-[21px]">
        <p className="font-['Albert_Sans',sans-serif] text-[12px] leading-[18px] text-[#99a1af] text-center">
          © 2026 Coop-op Technology Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}
