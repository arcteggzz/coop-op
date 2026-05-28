import { useState } from "react";
import ManagerLayout from "../../components/ManagerLayout";
import { useAuth } from "../../context/AuthContext";
import { useManagerPermissions } from "../../hooks/useManagerPermissions";
import { ManagerListItem } from "../../api/managerManagement.api";
import {
  useManagers,
  useInviteManager,
  useRevokeManager,
} from "../../hooks/useManagerManagement";
import { formatDateTime } from "../../utils/formatDate";

const ALL_SUPPORT_PERMISSIONS = [
  "ManagementAdminRead",
  "ManagementAdminWrite",
  "ManagementMembersRead",
  "ManagementMembersWrite",
  "ManagementLoansRead",
  "ManagementLoansWrite",
  "ManagementDuesRead",
  "ManagementDuesWrite",
];

function SkeletonRow() {
  return (
    <tr className="border-b border-[#f3f4f6] animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 bg-[#f3f4f6] rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function RoleBadge({ role }: { role: ManagerListItem["role"] }) {
  if (role === "RootManager") {
    return (
      <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(127,86,217,0.1)] text-[#7F56D9]">
        RootManager
      </span>
    );
  }
  if (role === "SuperManager") {
    return (
      <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(39,97,245,0.1)] text-[#0D8FAF]">
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
    inviteMutation.mutate(
      {
        fullName,
        email,
        role,
        permissions: role === "Support" ? selectedPermissions : undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-8 font-['Albert_Sans',sans-serif] max-h-[90vh] overflow-y-auto">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
          Invite Manager
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6">
          Send an invitation to a new cooperative manager.
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
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#0D8FAF] placeholder:text-[#99a1af]"
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
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#0D8FAF] placeholder:text-[#99a1af]"
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
                    className="accent-[#0D8FAF] cursor-pointer"
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
                {ALL_SUPPORT_PERMISSIONS.map((perm) => (
                  <label
                    key={perm}
                    className="flex items-center gap-2 cursor-pointer text-[13px] text-[#374151]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="accent-[#0D8FAF]"
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
              className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#0D8FAF] to-[#066E86] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManagerManagers() {
  const { activeCooperativeId } = useAuth();
  const cooperativeId = activeCooperativeId ?? "";
  const { role } = useManagerPermissions();

  const { data, isLoading, error } = useManagers(cooperativeId);
  const revokeManagerMutation = useRevokeManager(cooperativeId);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const managers: ManagerListItem[] = data?.data ?? [];
  const canWrite = role === "RootManager" || role === "SuperManager";

  return (
    <ManagerLayout>
      <div className="font-['Albert_Sans',sans-serif] p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-[#101828]">Managers</h1>
            <p className="text-[13px] text-[#6b7280] mt-0.5">
              Manage cooperative managers
            </p>
          </div>
          {canWrite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-5 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#0D8FAF] to-[#066E86] hover:opacity-90 transition-opacity"
            >
              + Invite Manager
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-[#fff5f5] border border-[#fecaca] rounded-[10px] px-5 py-4">
            <p className="text-[14px] text-[#dc2626]">
              Failed to load managers. Please refresh.
            </p>
          </div>
        )}

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
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
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
                  managers.map((manager, idx) => (
                    <tr
                      key={manager.id}
                      className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors"
                    >
                      <td className="px-5 py-4 text-[13px] text-[#6b7280]">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4 text-[14px] font-semibold text-[#101828] whitespace-nowrap">
                        {manager.fullName}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">
                        {manager.email}
                      </td>
                      <td className="px-5 py-4">
                        <RoleBadge role={manager.role} />
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">
                        {manager.role === "Support" ? "Custom" : "Full Access"}
                      </td>
                      <td className="px-5 py-4">
                        {manager.isActive ? (
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
                        {formatDateTime(manager.dateInvited)}
                      </td>
                      <td className="px-5 py-4">
                        {role === "RootManager" &&
                          manager.role !== "RootManager" &&
                          manager.isActive && (
                            <button
                              onClick={() =>
                                setRevokeTarget({
                                  id: manager.id,
                                  name: manager.fullName,
                                })
                              }
                              className="text-[12px] cursor-pointer font-medium text-[#dc2626] hover:underline whitespace-nowrap"
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

      {showInviteModal && (
        <InviteManagerModal
          cooperativeId={cooperativeId}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 font-['Albert_Sans',sans-serif]">
            <h2 className="text-[18px] font-semibold text-[#101828] mb-3">
              Revoke Access
            </h2>
            <p className="text-[14px] text-[#6b7280] mb-6">
              Are you sure you want to revoke access for{" "}
              <span className="font-semibold text-[#101828]">
                {revokeTarget.name}
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeTarget(null)}
                className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  revokeManagerMutation.mutate(revokeTarget.id, {
                    onSuccess: () => setRevokeTarget(null),
                  });
                }}
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
    </ManagerLayout>
  );
}
