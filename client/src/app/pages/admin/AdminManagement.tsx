import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { AdminUser } from "../../context/AuthContext";
import { AdminListItem } from "../../api/adminManagement.api";
import {
  useAdmins,
  useInviteAdmin,
  useRevokeAdmin,
  useRestoreAdmin,
  useUpdateAdminPermissions,
} from "../../hooks/useAdminManagement";

const ALL_PERMISSIONS = [
  "CoopAdminRead",
  "CoopAdminWrite",
  "CoopCooperativesRead",
  "CoopCooperativesWrite",
  "CoopManagersRead",
  "CoopManagersWrite",
  "CoopMembersRead",
  "CoopMembersWrite",
  "CoopLoansRead",
  "CoopLoansWrite",
  "CoopDuesRead",
  "CoopDuesWrite",
];

type AdminRole = "RootAdmin" | "SuperAdmin" | "Admin";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RoleBadge({ role }: { role: AdminRole }) {
  if (role === "RootAdmin") {
    return (
      <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(127,86,217,0.1)] text-[#7F56D9]">
        RootAdmin
      </span>
    );
  }
  if (role === "SuperAdmin") {
    return (
      <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(39,97,245,0.1)] text-[#0D8FAF]">
        SuperAdmin
      </span>
    );
  }
  return (
    <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f3f4f6] text-[#6b7280]">
      Admin
    </span>
  );
}

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

// ── View Permissions Modal ────────────────────────────────────────────────────

interface ViewPermissionsModalProps {
  name: string;
  permissions: string[];
  onClose: () => void;
}

function ViewPermissionsModal({
  name,
  permissions,
  onClose,
}: ViewPermissionsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 font-['Albert_Sans',sans-serif] max-h-[90vh] overflow-y-auto">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
          Permissions
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6">
          Permissions assigned to{" "}
          <span className="font-medium text-[#374151]">{name}</span>.
        </p>
        <div className="border border-[#e5e7eb] rounded-[10px] p-4 space-y-2 max-h-64 overflow-y-auto">
          {permissions.length === 0 ? (
            <p className="text-[13px] text-[#9ca3af]">
              No permissions assigned.
            </p>
          ) : (
            permissions.map((perm) => (
              <div
                key={perm}
                className="flex items-center gap-2 text-[13px] text-[#374151]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] flex-shrink-0" />
                {perm}
              </div>
            ))
          )}
        </div>
        <div className="pt-5">
          <button
            onClick={onClose}
            className="w-full cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invite Admin Modal ────────────────────────────────────────────────────────

interface InviteAdminModalProps {
  onClose: () => void;
}

function InviteAdminModal({ onClose }: InviteAdminModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"SuperAdmin" | "Admin">("Admin");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const inviteMutation = useInviteAdmin();

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
        permissions: role === "Admin" ? selectedPermissions : undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-8 font-['Albert_Sans',sans-serif] max-h-[90vh] overflow-y-auto">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
          Invite Admin
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6">
          Send an invitation to a new platform administrator.
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
              {(["SuperAdmin", "Admin"] as const).map((r) => (
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
          {role === "Admin" && (
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-2">
                Permissions
              </label>
              <div className="border border-[#e5e7eb] rounded-[10px] p-4 space-y-2 max-h-48 overflow-y-auto">
                {ALL_PERMISSIONS.map((perm) => (
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

// ── Update Permissions Modal ──────────────────────────────────────────────────

interface UpdatePermissionsModalProps {
  adminId: string;
  currentPermissions: string[];
  onClose: () => void;
}

function UpdatePermissionsModal({
  adminId,
  currentPermissions,
  onClose,
}: UpdatePermissionsModalProps) {
  const [selected, setSelected] = useState<string[]>(currentPermissions);
  const updateMutation = useUpdateAdminPermissions();

  function togglePermission(perm: string) {
    setSelected((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      { adminId, permissions: selected },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 font-['Albert_Sans',sans-serif] max-h-[90vh] overflow-y-auto">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
          Update Permissions
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6">
          Select the permissions to assign to this admin.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="border border-[#e5e7eb] rounded-[10px] p-4 space-y-2 max-h-64 overflow-y-auto">
            {ALL_PERMISSIONS.map((perm) => (
              <label
                key={perm}
                className="flex items-center gap-2 cursor-pointer text-[13px] text-[#374151]"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(perm)}
                  onChange={() => togglePermission(perm)}
                  className="accent-[#dc2626]"
                />
                {perm}
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {updateMutation.isPending ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminManagement() {
  const { user } = useAuth();
  const currentUserRole = (user as AdminUser | null)?.role ?? null;

  const { data, isLoading, error } = useAdmins();
  const revokeAdminMutation = useRevokeAdmin();
  const restoreAdminMutation = useRestoreAdmin();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [viewPermissionsTarget, setViewPermissionsTarget] = useState<{
    name: string;
    permissions: string[];
  } | null>(null);
  const [updatePermissionsTarget, setUpdatePermissionsTarget] = useState<{
    id: string;
    currentPermissions: string[];
  } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{
    id: string;
    isActive: boolean;
    name: string;
  } | null>(null);

  const admins: AdminListItem[] = data?.data ?? [];
  const canWrite =
    currentUserRole === "RootAdmin" || currentUserRole === "SuperAdmin";

  const canRevokeTarget = (target: AdminListItem) => {
    if (target.role === "RootAdmin") return false;
    if (target.role === "SuperAdmin" && currentUserRole !== "RootAdmin")
      return false;
    return canWrite;
  };

  return (
    <AdminLayout>
      <div className="font-['Albert_Sans',sans-serif] p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-[#101828]">
              Admin Management
            </h1>
            <p className="text-[13px] text-[#6b7280] mt-0.5">
              Manage Coop-op platform administrators
            </p>
          </div>
          {canWrite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-5 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity"
            >
              + Invite Admin
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-[#fff5f5] border border-[#fecaca] rounded-[10px] px-5 py-4">
            <p className="text-[14px] text-[#dc2626]">
              Failed to load admin list. Please refresh.
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
                ) : admins.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-[14px] text-[#9ca3af]"
                    >
                      No admins found.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin, idx) => (
                    <tr
                      key={admin.id}
                      className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors"
                    >
                      <td className="px-5 py-4 text-[13px] text-[#6b7280]">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4 text-[14px] font-semibold text-[#101828] whitespace-nowrap">
                        {admin.fullName}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">
                        {admin.email}
                      </td>
                      <td className="px-5 py-4">
                        <RoleBadge role={admin.role} />
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">
                        {admin.role === "Admin"
                          ? `${admin.permissions?.length ?? 0} permissions`
                          : "Full Access"}
                      </td>
                      <td className="px-5 py-4">
                        {admin.isActive ? (
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
                        {formatDate(admin.dateInvited)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          {admin.role === "Admin" && (
                            <button
                              onClick={() =>
                                setViewPermissionsTarget({
                                  name: admin.fullName,
                                  permissions: admin.permissions ?? [],
                                })
                              }
                              className="text-[12px] cursor-pointer font-medium text-[#16a34a] hover:underline whitespace-nowrap"
                            >
                              View Permissions
                            </button>
                          )}
                          {canWrite &&
                            admin.role === "Admin" &&
                            admin.isActive && (
                              <button
                                onClick={() =>
                                  setUpdatePermissionsTarget({
                                    id: admin.id,
                                    currentPermissions: admin.permissions ?? [],
                                  })
                                }
                                className="text-[12px] cursor-pointer font-medium text-[#0D8FAF] hover:underline whitespace-nowrap"
                              >
                                Update Perms
                              </button>
                            )}
                          {canRevokeTarget(admin) && (
                            <button
                              onClick={() =>
                                setRevokeTarget({
                                  id: admin.id,
                                  isActive: admin.isActive,
                                  name: admin.fullName,
                                })
                              }
                              className={`text-[12px] cursor-pointer font-medium whitespace-nowrap hover:underline ${
                                admin.isActive
                                  ? "text-[#dc2626]"
                                  : "text-[#16a34a]"
                              }`}
                            >
                              {admin.isActive ? "Revoke" : "Restore"}
                            </button>
                          )}
                        </div>
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
        <InviteAdminModal onClose={() => setShowInviteModal(false)} />
      )}

      {viewPermissionsTarget && (
        <ViewPermissionsModal
          name={viewPermissionsTarget.name}
          permissions={viewPermissionsTarget.permissions}
          onClose={() => setViewPermissionsTarget(null)}
        />
      )}

      {updatePermissionsTarget && (
        <UpdatePermissionsModal
          adminId={updatePermissionsTarget.id}
          currentPermissions={updatePermissionsTarget.currentPermissions}
          onClose={() => setUpdatePermissionsTarget(null)}
        />
      )}

      {/* Revoke / Restore confirmation */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 font-['Albert_Sans',sans-serif]">
            <h2 className="text-[18px] font-semibold text-[#101828] mb-3">
              {revokeTarget.isActive ? "Revoke Access" : "Restore Access"}
            </h2>
            <p className="text-[14px] text-[#6b7280] mb-6">
              Are you sure you want to{" "}
              {revokeTarget.isActive ? "revoke" : "restore"} access for{" "}
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
                  const mutation = revokeTarget.isActive
                    ? revokeAdminMutation
                    : restoreAdminMutation;
                  mutation.mutate(revokeTarget.id, {
                    onSuccess: () => setRevokeTarget(null),
                  });
                }}
                disabled={
                  revokeAdminMutation.isPending ||
                  restoreAdminMutation.isPending
                }
                className={`flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60 ${
                  revokeTarget.isActive
                    ? "bg-gradient-to-r from-[#dc2626] to-[#b91c1c]"
                    : "bg-gradient-to-r from-[#16a34a] to-[#15803d]"
                }`}
              >
                {revokeAdminMutation.isPending || restoreAdminMutation.isPending
                  ? "Processing..."
                  : revokeTarget.isActive
                    ? "Revoke Access"
                    : "Restore Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
