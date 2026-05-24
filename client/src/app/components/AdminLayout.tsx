import { Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  Banknote,
  Receipt,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AdminUser } from "../context/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const PHRASES = [
  "Cooperatives thrive with good admin 💪",
  "Almost there.",
  "Security at all times.",
  "What a productive day!",
  "Cooperatives don't stop, why should you? 😁",
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

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const adminUser = user as AdminUser | null;

  const firstName = adminUser?.fullName?.split(" ")[0] ?? "Admin";
  const fullName = adminUser?.fullName ?? "Admin";
  const email = adminUser?.email ?? "";
  const role = adminUser?.role ?? "";

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(formatDateTime());

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
    navigate("/admin/login");
  };

  const navItems = [
    {
      path: "/admin/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      exact: true,
    },
    {
      path: "/admin/cooperatives",
      icon: Building2,
      label: "Cooperatives",
      exact: false,
    },
    {
      path: "/admin/loans",
      icon: Banknote,
      label: "Loans",
      exact: false,
    },
    {
      path: "/admin/dues",
      icon: Receipt,
      label: "Dues",
      exact: false,
    },
    {
      path: "/admin/admin-management",
      icon: ShieldCheck,
      label: "Admin Management",
      exact: false,
    },
    {
      path: "/admin/settings",
      icon: Settings,
      label: "Settings",
      exact: false,
    },
  ];

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
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div
              className="size-[32px] rounded-[8px] flex items-center justify-center"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgb(220, 38, 38) 0%, rgb(185, 28, 28) 100%)",
              }}
            >
              <span className="text-white font-bold text-[13px]">C</span>
            </div>
            <div>
              <p className="font-['Albert_Sans',sans-serif] font-bold text-[16px] text-white">
                Coop-op
              </p>
              <p className="font-['Albert_Sans',sans-serif] text-[10px] text-[#dc2626]">
                ADMIN
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isNavActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[8px] transition-colors ${
                    active
                      ? "bg-[#dc2626] text-white"
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

        {/* User Profile */}
        <div className="p-4 border-t border-[#2a3442]">
          <div className="flex items-center gap-3 p-3 rounded-[8px] bg-[#2a3442]">
            <div className="size-10 rounded-full bg-[#dc2626] flex items-center justify-center text-white font-['Albert_Sans',sans-serif] font-semibold text-[14px] shrink-0">
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
                <span className="inline-block mt-1 px-2 py-[2px] bg-[#dc2626] text-white text-[10px] font-['Albert_Sans',sans-serif] font-medium rounded-full">
                  {role}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-2 px-4 py-2 text-[#ff6b6b] hover:bg-[#2a3442] rounded-[8px] transition-colors cursor-pointer"
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
              <p className="font-['Albert_Sans',sans-serif] font-bold text-[#dc2626] text-[13px] max-w-[200px] text-right leading-[18px]">
                {PHRASES[phraseIndex]}
              </p>
              <p className="font-['Albert_Sans',sans-serif] text-[12px] text-[#6a7282] whitespace-nowrap">
                {currentTime}
              </p>
              <div
                className="size-10 rounded-full flex items-center justify-center text-white font-['Albert_Sans',sans-serif] font-semibold text-[14px]"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgb(220, 38, 38) 0%, rgb(185, 28, 28) 100%)",
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
