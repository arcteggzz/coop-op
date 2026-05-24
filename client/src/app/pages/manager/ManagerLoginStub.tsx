import { Link } from "react-router";
import { Briefcase } from "lucide-react";

export default function ManagerLoginStub() {
  return (
    <div className="bg-[#fafbfd] min-h-screen flex flex-col">
      <div className="bg-gradient-to-r from-[#2761F5] via-[#1e50d0] to-[#4f7ef5] h-[4px] w-full" />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="bg-white border border-[#f3f4f6] rounded-[20px] p-10 w-full max-w-[420px] shadow-sm text-center">
          <div className="bg-[rgba(39,97,245,0.1)] rounded-[14px] size-[56px] flex items-center justify-center mx-auto mb-5">
            <Briefcase className="size-7 text-[#2761F5]" strokeWidth={2} />
          </div>
          <h1 className="font-['Albert_Sans',sans-serif] font-bold text-[24px] text-[#101828] mb-2">
            Manager Portal
          </h1>
          <p className="font-['Albert_Sans',sans-serif] text-[14px] text-[#6a7282] mb-6">
            Coming soon. Manager login is under development.
          </p>
          <Link
            to="/"
            className="inline-block font-['Albert_Sans',sans-serif] text-[13px] font-medium text-[#2761F5] hover:underline"
          >
            ← Back to portal selection
          </Link>
        </div>
      </div>
      <div className="border-t border-[#f3f4f6] py-[21px]">
        <p className="font-['Albert_Sans',sans-serif] text-[12px] text-[#99a1af] text-center">
          © 2026 Coop-op Technology Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}
