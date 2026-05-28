import { Link, useLocation } from "react-router";
import { useState } from "react";
import {
  Home,
  Receipt,
  Banknote,
  PiggyBank,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface MemberLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: "/member/dashboard", icon: Home, label: "Home", exact: true },
  { path: "/member/dues", icon: Receipt, label: "Dues", exact: false },
  { path: "/member/loans", icon: Banknote, label: "Loans", exact: false },
  { path: "/member/savings", icon: PiggyBank, label: "Savings", exact: false },
  { path: "/member/settings", icon: Settings, label: "Settings", exact: false },
];

export default function MemberLayout({ children }: MemberLayoutProps) {
  const location = useLocation();
  const { user, cooperatives, activeCooperativeId, setActiveCooperative } =
    useAuth();
  const [coopDropdownOpen, setCoopDropdownOpen] = useState(false);

  const memberUser = user as {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  const fullName =
    [memberUser?.firstName, memberUser?.lastName].filter(Boolean).join(" ") ||
    "Member";
  const activeCoop = cooperatives.find(
    (c) => c.cooperativeId === activeCooperativeId,
  );

  const isNavActive = (item: { path: string; exact: boolean }) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex justify-center">
      <div className="w-full max-w-[410px] h-screen flex flex-col bg-white">
        {/* Top Bar */}
        <div className="shrink-0 bg-white border-b border-[#f3f4f6] px-4 py-3 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-['Albert_Sans',sans-serif] font-bold text-[14px] text-[#101828] truncate">
              {activeCoop?.cooperativeName ?? "—"}
            </p>
            <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6a7282] truncate">
              {activeCoop?.memberSince
                ? `Member • since ${new Date(activeCoop.memberSince).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}`
                : fullName}
            </p>
          </div>
          {cooperatives.length > 1 && (
            <div className="relative shrink-0 ml-3">
              <button
                onClick={() => setCoopDropdownOpen((v) => !v)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-[#f3f4f6] text-[#6a7282] hover:bg-[#e5e7eb] transition-colors cursor-pointer"
              >
                <span className="font-['Albert_Sans',sans-serif] text-[11px] font-medium">
                  Switch
                </span>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${coopDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {coopDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-[10px] shadow-lg border border-[#e5e7eb] overflow-hidden z-50 min-w-[180px]">
                  {cooperatives.map((coop) => (
                    <button
                      key={coop.cooperativeId}
                      onClick={() => {
                        setActiveCooperative(coop.cooperativeId);
                        setCoopDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 font-['Albert_Sans',sans-serif] text-[13px] hover:bg-[#f9fafb] transition-colors ${
                        coop.cooperativeId === activeCooperativeId
                          ? "text-[#7F56D9] font-semibold"
                          : "text-[#374151]"
                      }`}
                    >
                      {coop.cooperativeName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Bottom Navigation */}
        <div className="shrink-0 bg-white border-t border-[#f3f4f6] shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex">
            {navItems.map((item) => {
              const active = isNavActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 flex flex-col items-center py-2.5 transition-colors ${
                    active ? "text-[#7F56D9]" : "text-gray-400"
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-['Albert_Sans',sans-serif] text-[10px] mt-1 font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
