import { useState } from "react";
import { Link } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { useManagerLogin } from "../../hooks/useManagerAuth";

const hasDemoCreds =
  !!import.meta.env.VITE_MANAGER_DEMO_EMAIL &&
  import.meta.env.VITE_MANAGER_DEMO_EMAIL !== "";

export default function ManagerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useManagerLogin();

  const handleDemoCredentials = () => {
    setEmail(import.meta.env.VITE_MANAGER_DEMO_EMAIL as string);
    setPassword(import.meta.env.VITE_MANAGER_DEMO_PASSWORD as string);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="bg-[#fafbfd] min-h-screen flex flex-col">
      <div className="bg-gradient-to-r from-[#0D8FAF] via-[#0B869E] to-[#066E86] h-[4px] w-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <Link to="/" className="flex items-center gap-[10px] mb-8">
          <div
            className="size-[40px] rounded-[10px] flex items-center justify-center"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #0D8FAF 0%, #066E86 100%)",
            }}
          >
            <span className="text-white font-bold text-[16px]">C</span>
          </div>
          <div>
            <p className="font-['Albert_Sans',sans-serif] font-bold text-[22px] leading-[33px] text-[#101828] tracking-[-0.44px]">
              Coop-op
            </p>
            <p className="font-['Albert_Sans',sans-serif] font-medium text-[11px] leading-[16.5px] text-[#99a1af]">
              Cooperative Management Platform
            </p>
          </div>
        </Link>

        <div className="bg-white border border-[#f3f4f6] rounded-[20px] p-8 w-full max-w-[420px] shadow-sm">
          <h1 className="font-['Albert_Sans',sans-serif] font-bold text-[24px] leading-[32px] text-[#101828] tracking-[-0.48px] mb-2">
            Manager Login
          </h1>
          <p className="font-['Albert_Sans',sans-serif] text-[14px] leading-[20px] text-[#6a7282] mb-6">
            Access the Coop-op Manager Dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-['Albert_Sans',sans-serif] font-medium text-[13px] leading-[18px] text-[#101828] block mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#e5e7eb] rounded-[10px] font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#0D8FAF] transition-colors"
                placeholder="manager@cooperative.com"
              />
            </div>

            <div>
              <label className="font-['Albert_Sans',sans-serif] font-medium text-[13px] leading-[18px] text-[#101828] block mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-[#e5e7eb] rounded-[10px] font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#0D8FAF] pr-12 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99a1af] hover:text-[#6a7282] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {hasDemoCreds && (
              <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[10px] p-4">
                <p className="font-['Albert_Sans',sans-serif] font-semibold text-[12px] text-[#0D8FAF] mb-2">
                  Demo Credentials
                </p>
                <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6a7282] mb-1">
                  <span className="font-mono">
                    Email: {import.meta.env.VITE_MANAGER_DEMO_EMAIL}
                  </span>
                </p>
                <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6a7282] mb-3">
                  <span className="font-mono">
                    Password: {import.meta.env.VITE_MANAGER_DEMO_PASSWORD}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={handleDemoCredentials}
                  className="w-full bg-white border border-[#bfdbfe] text-[#0D8FAF] font-['Albert_Sans',sans-serif] font-semibold text-[13px] py-2 rounded-[8px] hover:bg-[#eff6ff] transition-colors cursor-pointer"
                >
                  Use Demo Credentials
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-gradient-to-r from-[#0D8FAF] to-[#066E86] text-white font-['Albert_Sans',sans-serif] font-semibold text-[14px] py-3 rounded-[10px] hover:opacity-90 transition-opacity mt-2 disabled:opacity-60 cursor-pointer"
            >
              {loginMutation.isPending
                ? "Logging in..."
                : "Login to Manager Portal"}
            </button>

            <p className="font-['Albert_Sans',sans-serif] text-[13px] text-[#6a7282] text-center">
              <Link
                to="/manager/change-password"
                className="text-[#0D8FAF] font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          </form>
        </div>

        <p className="font-['Albert_Sans',sans-serif] text-[12px] text-[#99a1af] text-center mt-6 max-w-[320px]">
          Access is by invitation only. Contact your cooperative administrator.
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
