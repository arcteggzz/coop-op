import { Link } from "react-router";
import { Shield, Briefcase, Users, ArrowRight } from "lucide-react";

export default function PortalSelection() {
  return (
    <div className="bg-[#fafbfd] min-h-screen flex flex-col">
      {/* Top gradient bar — all 3 portal colors */}
      <div className="bg-gradient-to-r from-[#dc2626] via-[#0D8FAF] to-[#7F56D9] h-[4px] w-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="font-['Albert_Sans',sans-serif] font-bold text-[28px] leading-[34px] text-[#101828] tracking-[-0.56px] mb-2">
            Welcome to Coop-op
          </h1>
          <p className="font-['Albert_Sans',sans-serif] text-[15px] leading-[22px] text-[#6a7282]">
            Select your portal to continue
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-[20px] max-w-[1000px] w-full">
          {/* Admin Portal */}
          <Link
            to="/admin/login"
            className="bg-white border border-[#f3f4f6] rounded-[16px] p-[28px] w-full sm:w-[286px] cursor-pointer hover:border-[#dc2626] transition-all group relative"
          >
            <div className="bg-[rgba(220,38,38,0.1)] rounded-[14px] size-[48px] flex items-center justify-center mb-5">
              <Shield className="size-6 text-[#dc2626]" strokeWidth={2} />
            </div>
            <h3 className="font-['Albert_Sans',sans-serif] font-bold text-[17px] leading-[25.5px] text-[#101828] tracking-[-0.17px] mb-2">
              Admin Portal
            </h3>
            <p className="font-['Albert_Sans',sans-serif] font-medium text-[13px] leading-[18px] text-[#6a7282] mb-3">
              Manage cooperatives and back-office operations
            </p>
            <p className="font-['Albert_Sans',sans-serif] font-medium text-[12px] leading-[17px] text-[#99a1af] mb-5">
              Create cooperatives, manage admins, oversee platform activity
            </p>
            <div className="absolute bottom-[28px] right-[28px] bg-[#f9fafb] rounded-[10px] size-[32px] flex items-center justify-center group-hover:bg-[#dc2626] transition-colors">
              <ArrowRight className="size-4 text-[#99a1af] group-hover:text-white transition-colors" />
            </div>
          </Link>

          {/* Manager Portal */}
          <Link
            to="/manager/login"
            className="bg-white border border-[#f3f4f6] rounded-[16px] p-[28px] w-full sm:w-[286px] cursor-pointer hover:border-[#0D8FAF] transition-all group relative"
          >
            <div className="bg-[rgba(39,97,245,0.1)] rounded-[14px] size-[48px] flex items-center justify-center mb-5">
              <Briefcase className="size-6 text-[#0D8FAF]" strokeWidth={2} />
            </div>
            <h3 className="font-['Albert_Sans',sans-serif] font-bold text-[17px] leading-[25.5px] text-[#101828] tracking-[-0.17px] mb-2">
              Manager Portal
            </h3>
            <p className="font-['Albert_Sans',sans-serif] font-medium text-[13px] leading-[18px] text-[#6a7282] mb-3">
              Manage your cooperative and its members
            </p>
            <p className="font-['Albert_Sans',sans-serif] font-medium text-[12px] leading-[17px] text-[#99a1af] mb-5">
              Invite members, track dues, manage loans, oversee cooperative
              activity
            </p>
            <div className="absolute bottom-[28px] right-[28px] bg-[#f9fafb] rounded-[10px] size-[32px] flex items-center justify-center group-hover:bg-[#0D8FAF] transition-colors">
              <ArrowRight className="size-4 text-[#99a1af] group-hover:text-white transition-colors" />
            </div>
          </Link>

          {/* Member Portal */}
          <Link
            to="/member/login"
            className="bg-white border border-[#f3f4f6] rounded-[16px] p-[28px] w-full sm:w-[286px] cursor-pointer hover:border-[#7F56D9] transition-all group relative"
          >
            <div className="bg-[rgba(127,86,217,0.1)] rounded-[14px] size-[48px] flex items-center justify-center mb-5">
              <Users className="size-6 text-[#7F56D9]" strokeWidth={2} />
            </div>
            <h3 className="font-['Albert_Sans',sans-serif] font-bold text-[17px] leading-[25.5px] text-[#101828] tracking-[-0.17px] mb-2">
              Member Portal
            </h3>
            <p className="font-['Albert_Sans',sans-serif] font-medium text-[13px] leading-[18px] text-[#6a7282] mb-3">
              Access your cooperative wallet and activity
            </p>
            <p className="font-['Albert_Sans',sans-serif] font-medium text-[12px] leading-[17px] text-[#99a1af] mb-5">
              Fund your wallet, track savings, view dues and loan history
            </p>
            <div className="absolute bottom-[28px] right-[28px] bg-[#f9fafb] rounded-[10px] size-[32px] flex items-center justify-center group-hover:bg-[#7F56D9] transition-colors">
              <ArrowRight className="size-4 text-[#99a1af] group-hover:text-white transition-colors" />
            </div>
          </Link>
        </div>
      </div>

      <div className="border-t border-[#f3f4f6] py-[21px]">
        <p className="font-['Albert_Sans',sans-serif] text-[12px] leading-[18px] text-[#99a1af] text-center">
          © 2026 Coop-op Technology Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}
