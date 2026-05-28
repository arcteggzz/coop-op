import { Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  UsersRound,
  Users,
  Banknote,
  Receipt,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useManagerPermissions } from "../hooks/useManagerPermissions";

interface ManagerLayoutProps {
  children: React.ReactNode;
}

const PHRASES = [
  "Cooperatives thrive with good management 💪",
  "Every member counts.",
  "Building trust, one coop at a time.",
  "What a productive day!",
  "Your cooperative needs you. 😁",
  "Every action counts.",
  "Keep pushing forward.",
  "The platform runs because of you.",
  "Stay sharp, stay focused.",
  "Excellence is a habit.",
  "Another great day of service. 💪",
  "Good things take time.",
  "Accuracy above all else.",
  "One task at a time.",
  "Trust the process.",
  "Attention to detail matters.",
  "You've got this.",
  "Small wins add up.",
  "The best is yet to come. 🚀",
  "Consistency is key.",
  "Your work matters.",
  "Impact is measured in actions.",
  "Keep the momentum going! 🔥",
  "Cooperatives change lives.",
  "Building something great. ✨",
];

const formatDateTime = () => {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-GB", { weekday: "long" });
  const date = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `${weekday}, ${date} • ${hours}:${minutes}${ampm}`;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export default function ManagerLayout({ children }: ManagerLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    logout,
    cooperatives,
    activeCooperativeId,
    setActiveCooperative,
  } = useAuth();
  const { role, can } = useManagerPermissions();

  const managerUser = user as { fullName?: string; email?: string } | null;
  const firstName = managerUser?.fullName?.split(" ")[0] ?? "Manager";
  const fullName = managerUser?.fullName ?? "Manager";
  const email = managerUser?.email ?? "";

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(formatDateTime());
  const [coopDropdownOpen, setCoopDropdownOpen] = useState(false);

  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    }, 5000);
    return () => clearInterval(phraseTimer);
  }, []);

  useEffect(() => {
    const timeTimer = setInterval(() => {
      setCurrentTime(formatDateTime());
    }, 1000);
    return () => clearInterval(timeTimer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/manager/login");
  };

  const activeCoop = cooperatives.find(
    (c) => c.cooperativeId === activeCooperativeId,
  );

  const navItems = [
    {
      path: "/manager/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      exact: true,
      alwaysVisible: true,
      permission: null,
    },
    {
      path: "/manager/managers",
      icon: UsersRound,
      label: "Managers",
      exact: false,
      alwaysVisible: false,
      permission: "ManagementAdminRead",
    },
    {
      path: "/manager/members",
      icon: Users,
      label: "Members",
      exact: false,
      alwaysVisible: false,
      permission: "ManagementMembersRead",
    },
    {
      path: "/manager/loans",
      icon: Banknote,
      label: "Loans",
      exact: false,
      alwaysVisible: false,
      permission: "ManagementLoansRead",
    },
    {
      path: "/manager/dues",
      icon: Receipt,
      label: "Dues",
      exact: false,
      alwaysVisible: false,
      permission: "ManagementDuesRead",
    },
    {
      path: "/manager/settings",
      icon: Settings,
      label: "Settings",
      exact: false,
      alwaysVisible: true,
      permission: null,
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (item.alwaysVisible) return true;
    if (role === "RootManager" || role === "SuperManager") return true;
    if (item.permission) return can(item.permission);
    return false;
  });

  const isNavActive = (item: { path: string; exact: boolean }) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="flex h-screen bg-[#fafbfd]">
      {/* Sidebar */}
      <div className="w-64 bg-[#1a2332] flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-[#2a3442]">
          <Link to="/manager/dashboard" className="flex items-center gap-2">
            <div
              className="size-[32px] rounded-[8px] flex items-center justify-center"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #0D8FAF 0%, #066E86 100%)",
              }}
            >
              <span className="text-white font-bold text-[13px]">C</span>
            </div>
            <div>
              <p className="font-['Albert_Sans',sans-serif] font-bold text-[16px] text-white">
                Coop-op
              </p>
              <p className="font-['Albert_Sans',sans-serif] text-[10px] text-[#0D8FAF]">
                MANAGER
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {visibleNavItems.map((item) => {
              const active = isNavActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[8px] transition-colors ${
                    active
                      ? "bg-[#0D8FAF] text-white"
                      : "text-[#8b92a7] hover:bg-[#2a3442] hover:text-white"
                  }`}
                >
                  <item.icon size={18} />
                  <span className="font-['Albert_Sans',sans-serif] text-[14px] font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom: Coop Switcher + User Info + Logout */}
        <div className="p-4 border-t border-[#2a3442] space-y-3">
          {/* Cooperative Switcher */}
          <div className="relative">
            <button
              onClick={() =>
                cooperatives.length > 1 && setCoopDropdownOpen((v) => !v)
              }
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] bg-[#2a3442] transition-colors ${
                cooperatives.length > 1
                  ? "hover:bg-[#334155] cursor-pointer"
                  : "cursor-default"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-['Albert_Sans',sans-serif] text-[10px] text-[#8b92a7] mb-0.5">
                  Active Cooperative
                </p>
                <p className="font-['Albert_Sans',sans-serif] text-[13px] text-white font-medium truncate">
                  {activeCoop?.cooperativeName ?? "—"}
                </p>
              </div>
              {cooperatives.length > 1 && (
                <ChevronDown
                  size={14}
                  className={`text-[#8b92a7] ml-2 shrink-0 transition-transform ${coopDropdownOpen ? "rotate-180" : ""}`}
                />
              )}
            </button>
            {coopDropdownOpen && cooperatives.length > 1 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#2a3442] rounded-[8px] shadow-lg overflow-hidden z-50">
                {cooperatives.map((coop) => (
                  <button
                    key={coop.cooperativeId}
                    onClick={() => {
                      setActiveCooperative(coop.cooperativeId);
                      setCoopDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 font-['Albert_Sans',sans-serif] text-[13px] cursor-pointer hover:bg-[#334155] transition-colors ${
                      coop.cooperativeId === activeCooperativeId
                        ? "text-[#0D8FAF] font-semibold"
                        : "text-[#d1d5db]"
                    }`}
                  >
                    {coop.cooperativeName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 p-3 rounded-[8px] bg-[#2a3442]">
            <div className="size-10 rounded-full bg-[#0D8FAF] flex items-center justify-center text-white font-['Albert_Sans',sans-serif] font-semibold text-[14px] shrink-0">
              {getInitials(fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-['Albert_Sans',sans-serif] font-medium text-[13px] text-white truncate">
                {fullName}
              </p>
              <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#8b92a7] truncate">
                {email}
              </p>
              {role && (
                <span className="inline-block mt-1 px-2 py-[2px] bg-[#0D8FAF] text-white text-[10px] font-['Albert_Sans',sans-serif] font-medium rounded-full">
                  {role}
                </span>
              )}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-[#ff6b6b] hover:bg-[#2a3442] rounded-[8px] transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span className="font-['Albert_Sans',sans-serif] text-[13px] font-medium">
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-[#f3f4f6] px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-['Albert_Sans',sans-serif] text-[14px] text-[#6a7282]">
                Welcome back,{" "}
                <span className="font-semibold text-[#101828]">
                  {firstName}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-['Albert_Sans',sans-serif] font-bold text-[#0D8FAF] text-[13px] max-w-[200px] text-right leading-[18px]">
                {PHRASES[phraseIndex]}
              </p>
              <p className="font-['Albert_Sans',sans-serif] text-[12px] text-[#6a7282] whitespace-nowrap">
                {currentTime}
              </p>
              <div
                className="size-10 rounded-full flex items-center justify-center text-white font-['Albert_Sans',sans-serif] font-semibold text-[14px]"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #0D8FAF 0%, #066E86 100%)",
                }}
              >
                {getInitials(fullName)}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
