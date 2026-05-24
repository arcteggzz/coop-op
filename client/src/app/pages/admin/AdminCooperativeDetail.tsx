import { useState } from "react";
import { useParams, Link } from "react-router";
import AdminLayout from "../../components/AdminLayout";
import {
  useCooperative,
  useCooperativeManagers,
  useCooperativeMembers,
  useInviteManager,
  useRevokeManager,
  useInviteCooperativeMember,
  useRevokeCooperativeMember,
} from "../../hooks/useAdminCooperatives";
import {
  InviteManagerDto,
  InviteMemberDto,
} from "../../api/adminCooperatives.api";

type Tab = "overview" | "dues" | "levies" | "managers" | "members";

const NAV_ITEMS: { key: Tab; label: string; comingSoon?: boolean }[] = [
  { key: "overview", label: "Overview" },
  { key: "dues", label: "Dues", comingSoon: true },
  { key: "levies", label: "Levies", comingSoon: true },
  { key: "managers", label: "Managers" },
  { key: "members", label: "Members" },
];

const MANAGER_PERMISSIONS = [
  "ManagementAdminRead",
  "ManagementAdminWrite",
  "ManagementMembersRead",
  "ManagementMembersWrite",
  "ManagementLoansRead",
  "ManagementLoansWrite",
  "ManagementDuesRead",
  "ManagementDuesWrite",
];

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-[#f3f4f6] animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 bg-[#f3f4f6] rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RoleBadge({ role }: { role: string }) {
  if (role === "RootManager") {
    return (
      <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(127,86,217,0.1)] text-[#7F56D9]">
        RootManager
      </span>
    );
  }
  if (role === "SuperManager") {
    return (
      <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(39,97,245,0.1)] text-[#2761F5]">
        SuperManager
      </span>
    );
  }
  return (
    <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f3f4f6] text-[#6b7280]">
      Support
    </span>
  );
}

// ── Invite Manager Modal ─────────────────────────────────────────────────────

interface InviteManagerModalProps {
  cooperativeId: string;
  onClose: () => void;
}

function InviteManagerModal({
  cooperativeId,
  onClose,
}: InviteManagerModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"SuperManager" | "Support">("SuperManager");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const inviteMutation = useInviteManager(cooperativeId);

  function togglePermission(perm: string) {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: InviteManagerDto = {
      fullName,
      email,
      role,
      permissions: role === "Support" ? selectedPermissions : undefined,
    };
    inviteMutation.mutate(data, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-8 font-['Albert_Sans',sans-serif] max-h-[90vh] overflow-y-auto">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
          Invite Manager
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6">
          Invite a manager to this cooperative.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
              required
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#dc2626] placeholder:text-[#99a1af]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#dc2626] placeholder:text-[#99a1af]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-2">
              Role
            </label>
            <div className="flex gap-6">
              {(["SuperManager", "Support"] as const).map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 cursor-pointer text-[14px] text-[#374151]"
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="accent-[#dc2626] cursor-pointer"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
          {role === "Support" && (
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-2">
                Permissions
              </label>
              <div className="border border-[#e5e7eb] rounded-[10px] p-4 space-y-2 max-h-48 overflow-y-auto">
                {MANAGER_PERMISSIONS.map((perm) => (
                  <label
                    key={perm}
                    className="flex items-center gap-2 cursor-pointer text-[13px] text-[#374151]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="accent-[#dc2626]"
                    />
                    {perm}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={inviteMutation.isPending}
              className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Invite Member Modal ──────────────────────────────────────────────────────

interface InviteMemberModalProps {
  cooperativeId: string;
  onClose: () => void;
}

function InviteMemberModal({ cooperativeId, onClose }: InviteMemberModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const inviteMutation = useInviteCooperativeMember(cooperativeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: InviteMemberDto = { firstName, lastName, email };
    inviteMutation.mutate(data, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 font-['Albert_Sans',sans-serif]">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
          Invite Member
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6">
          Invite a new member to this cooperative.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              required
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#dc2626] placeholder:text-[#99a1af]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              required
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#dc2626] placeholder:text-[#99a1af]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#dc2626] placeholder:text-[#99a1af]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={inviteMutation.isPending}
              className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCooperativeDetail() {
  const { cooperativeId, tab } = useParams<{
    cooperativeId: string;
    tab?: string;
  }>();
  const activeTab: Tab = (tab as Tab) ?? "overview";

  const [showInviteManager, setShowInviteManager] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [revokeManagerId, setRevokeManagerId] = useState<string | null>(null);
  const [revokeMemberId, setRevokeMemberId] = useState<string | null>(null);

  const { data: coop, isLoading: coopLoading } = useCooperative(cooperativeId!);
  console.log("Coop data:", coop);
  const { data: managersData, isLoading: managersLoading } =
    useCooperativeManagers(cooperativeId!);
  const { data: membersData, isLoading: membersLoading } =
    useCooperativeMembers(cooperativeId!);
  const revokeManagerMutation = useRevokeManager(cooperativeId!);
  const revokeMemberMutation = useRevokeCooperativeMember(cooperativeId!);

  const managers = managersData?.data ?? [];
  const members = membersData?.data ?? [];

  return (
    <AdminLayout>
      <div
        className="font-['Albert_Sans',sans-serif] flex flex-col"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        {/* Top bar — breadcrumb + title + stats */}
        <div className="px-8 pt-8 pb-6 border-b border-[#e5e7eb] bg-white">
          <div className="flex items-center gap-2 mb-3 text-[13px] text-[#6b7280]">
            <Link
              to="/admin/cooperatives"
              className="hover:text-[#dc2626] transition-colors"
            >
              Cooperatives
            </Link>
            <span>/</span>
            <span className="text-[#101828] font-medium">
              {coopLoading ? "..." : (coop?.name ?? "Cooperative")}
            </span>
          </div>
          <h1 className="text-[22px] font-bold text-[#101828]">
            {coopLoading ? (
              <div className="h-6 w-48 bg-[#f3f4f6] rounded animate-pulse" />
            ) : (
              (coop?.name ?? "Cooperative")
            )}
          </h1>
          {coopLoading ? (
            <div className="flex gap-6 mt-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3 w-28 bg-[#f3f4f6] rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-[13px] text-[#6b7280]">
              <span>
                Created by{" "}
                <span className="font-medium text-[#374151]">
                  {coop?.createdByAdminName ?? "—"}
                </span>
              </span>
              <span>
                {coop?.dateCreated ? formatDateTime(coop.dateCreated) : "—"}
              </span>
              <span>
                <span className="font-medium text-[#374151]">
                  {coop?.managerCount ?? 0}
                </span>{" "}
                managers
              </span>
              <span>
                <span className="font-medium text-[#374151]">
                  {coop?.memberCount ?? 0}
                </span>{" "}
                members
              </span>
            </div>
          )}
        </div>

        {/* Body — mini sidebar + content */}
        <div className="flex flex-1">
          {/* Mini sidebar */}
          <div className="w-52 shrink-0 bg-white border-r border-[#f3f4f6] py-4 px-2">
            {NAV_ITEMS.map((item) =>
              item.comingSoon ? (
                <button
                  key={item.key}
                  disabled
                  className="w-full flex items-center justify-between px-4 py-3 rounded-[8px] text-[13px] font-['Albert_Sans',sans-serif] font-medium text-left opacity-50 cursor-not-allowed text-[#6a7282] mb-1"
                >
                  {item.label}
                  <span className="text-[9px] font-semibold bg-[#f3f4f6] text-[#9ca3af] px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                </button>
              ) : (
                <Link
                  key={item.key}
                  to={`/admin/cooperatives/${cooperativeId}/${item.key}`}
                  className={`flex items-center w-full px-4 py-3 rounded-[8px] text-[13px] font-['Albert_Sans',sans-serif] font-medium transition-colors mb-1 ${
                    activeTab === item.key
                      ? "bg-[rgba(220,38,38,0.1)] text-[#dc2626]"
                      : "text-[#6a7282] hover:bg-[#fafbfd]"
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 p-8 bg-[#fafbfd] overflow-auto">
            {/* Overview */}
            {activeTab === "overview" && (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                <h2 className="text-[16px] font-semibold text-[#101828] mb-4">
                  Cooperative Details
                </h2>
                {coopLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-[#f3f4f6] rounded w-1/3" />
                    <div className="h-4 bg-[#f3f4f6] rounded w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <span className="text-[13px] text-[#6b7280] w-32">
                        Name
                      </span>
                      <span className="text-[14px] font-medium text-[#101828]">
                        {coop?.name}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-[13px] text-[#6b7280] w-32">
                        Created By
                      </span>
                      <span className="text-[14px] text-[#374151]">
                        {coop?.createdByAdminName ?? "—"}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-[13px] text-[#6b7280] w-32">
                        Date Created
                      </span>
                      <span className="text-[14px] text-[#374151]">
                        {coop?.dateCreated
                          ? formatDateTime(coop.dateCreated)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-[13px] text-[#6b7280] w-32">
                        Managers
                      </span>
                      <span className="text-[14px] text-[#374151]">
                        {coop?.managerCount ?? 0}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-[13px] text-[#6b7280] w-32">
                        Members
                      </span>
                      <span className="text-[14px] text-[#374151]">
                        {coop?.memberCount ?? 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Managers */}
            {activeTab === "managers" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[14px] text-[#6b7280]">
                    {managers.length} manager
                    {managers.length !== 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={() => setShowInviteManager(true)}
                    className="px-4 cursor-pointer py-2 rounded-[10px] text-[13px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity"
                  >
                    + Invite Manager
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                          {[
                            "#",
                            "Full Name",
                            "Email",
                            "Role",
                            "Permissions",
                            "Status",
                            "Date Invited",
                            "Actions",
                          ].map((col) => (
                            <th
                              key={col}
                              className="px-5 py-3.5 text-[12px] font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {managersLoading ? (
                          <>
                            <SkeletonRow cols={8} />
                            <SkeletonRow cols={8} />
                            <SkeletonRow cols={8} />
                          </>
                        ) : managers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-5 py-10 text-center text-[14px] text-[#9ca3af]"
                            >
                              No managers yet. Invite one to get started.
                            </td>
                          </tr>
                        ) : (
                          managers.map((mgr, idx) => (
                            <tr
                              key={mgr.id}
                              className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors"
                            >
                              <td className="px-5 py-4 text-[13px] text-[#6b7280]">
                                {idx + 1}
                              </td>
                              <td className="px-5 py-4 text-[14px] font-medium text-[#101828] whitespace-nowrap">
                                {mgr.fullName}
                              </td>
                              <td className="px-5 py-4 text-[13px] text-[#374151]">
                                {mgr.email}
                              </td>
                              <td className="px-5 py-4">
                                <RoleBadge role={mgr.role} />
                              </td>
                              <td className="px-5 py-4 text-[13px] text-[#374151]">
                                {mgr.role === "Support"
                                  ? "Support"
                                  : "Full Access"}
                              </td>
                              <td className="px-5 py-4">
                                {mgr.isActive ? (
                                  <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(22,163,74,0.1)] text-[#16a34a]">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(220,38,38,0.1)] text-[#dc2626]">
                                    Revoked
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-[13px] text-[#374151] whitespace-nowrap">
                                {formatDateTime(mgr.dateInvited)}
                              </td>
                              <td className="px-5 py-4">
                                {mgr.role !== "RootManager" && (
                                  <button
                                    onClick={() => setRevokeManagerId(mgr.id)}
                                    className="text-[12px] font-medium text-[#dc2626] hover:underline cursor-pointer"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Members */}
            {activeTab === "members" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[14px] text-[#6b7280]">
                    {members.length} member
                    {members.length !== 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={() => setShowInviteMember(true)}
                    className="px-4 cursor-pointer py-2 rounded-[10px] text-[13px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity"
                  >
                    + Invite Member
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                          {[
                            "#",
                            "Full Name",
                            "Email",
                            "Account Number",
                            "Status",
                            "Date Invited",
                            "Actions",
                          ].map((col) => (
                            <th
                              key={col}
                              className="px-5 py-3.5 text-[12px] font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {membersLoading ? (
                          <>
                            <SkeletonRow cols={7} />
                            <SkeletonRow cols={7} />
                            <SkeletonRow cols={7} />
                          </>
                        ) : members.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-5 py-10 text-center text-[14px] text-[#9ca3af]"
                            >
                              No members yet. Invite one to get started.
                            </td>
                          </tr>
                        ) : (
                          members.map((member, idx) => (
                            <tr
                              key={member.id}
                              className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors"
                            >
                              <td className="px-5 py-4 text-[13px] text-[#6b7280]">
                                {idx + 1}
                              </td>
                              <td className="px-5 py-4 text-[14px] font-medium text-[#101828] whitespace-nowrap">
                                {member.firstName} {member.lastName}
                              </td>
                              <td className="px-5 py-4 text-[13px] text-[#374151]">
                                {member.email}
                              </td>
                              <td className="px-5 py-4 text-[13px] text-[#374151] font-mono">
                                {member.accountNumber ?? "—"}
                              </td>
                              <td className="px-5 py-4">
                                {member.isActive ? (
                                  <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(22,163,74,0.1)] text-[#16a34a]">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(220,38,38,0.1)] text-[#dc2626]">
                                    Revoked
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-[13px] text-[#374151] whitespace-nowrap">
                                {formatDateTime(member.dateInvited)}
                              </td>
                              <td className="px-5 py-4">
                                <button
                                  onClick={() => setRevokeMemberId(member.id)}
                                  className="text-[12px] font-medium text-[#dc2626] hover:underline cursor-pointer"
                                >
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showInviteManager && (
        <InviteManagerModal
          cooperativeId={cooperativeId!}
          onClose={() => setShowInviteManager(false)}
        />
      )}

      {showInviteMember && (
        <InviteMemberModal
          cooperativeId={cooperativeId!}
          onClose={() => setShowInviteMember(false)}
        />
      )}

      {/* Revoke Manager confirmation */}
      {revokeManagerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 font-['Albert_Sans',sans-serif]">
            <h2 className="text-[18px] font-semibold text-[#101828] mb-3">
              Revoke Access
            </h2>
            <p className="text-[14px] text-[#6b7280] mb-6">
              Are you sure you want to revoke this manager's access?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeManagerId(null)}
                className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  revokeManagerMutation.mutate(revokeManagerId, {
                    onSuccess: () => setRevokeManagerId(null),
                  })
                }
                disabled={revokeManagerMutation.isPending}
                className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {revokeManagerMutation.isPending
                  ? "Revoking..."
                  : "Revoke Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Member confirmation */}
      {revokeMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 font-['Albert_Sans',sans-serif]">
            <h2 className="text-[18px] font-semibold text-[#101828] mb-3">
              Revoke Access
            </h2>
            <p className="text-[14px] text-[#6b7280] mb-6">
              Are you sure you want to revoke this member's access?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeMemberId(null)}
                className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  revokeMemberMutation.mutate(revokeMemberId, {
                    onSuccess: () => setRevokeMemberId(null),
                  })
                }
                disabled={revokeMemberMutation.isPending}
                className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {revokeMemberMutation.isPending
                  ? "Revoking..."
                  : "Revoke Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
