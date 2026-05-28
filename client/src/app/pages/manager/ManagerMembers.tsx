import { useState } from "react";
import ManagerLayout from "../../components/ManagerLayout";
import { useAuth } from "../../context/AuthContext";
import { useManagerPermissions } from "../../hooks/useManagerPermissions";
import { MemberListItem } from "../../api/managerManagement.api";
import {
  useManagerMembers,
  useInviteManagerMember,
  useRevokeManagerMember,
} from "../../hooks/useManagerManagement";
import { formatDateTime } from "../../utils/formatDate";

function SkeletonRow() {
  return (
    <tr className="border-b border-[#f3f4f6] animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 bg-[#f3f4f6] rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

interface InviteMemberModalProps {
  cooperativeId: string;
  onClose: () => void;
}

function InviteMemberModal({ cooperativeId, onClose }: InviteMemberModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const inviteMutation = useInviteManagerMember(cooperativeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate(
      { firstName, lastName, email },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 font-['Albert_Sans',sans-serif]">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
          Invite Member
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6">
          Send an invitation to a new cooperative member.
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
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 font-['Albert_Sans',sans-serif] text-[14px] focus:outline-none focus:border-[#0D8FAF] placeholder:text-[#99a1af]"
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

export default function ManagerMembers() {
  const { activeCooperativeId } = useAuth();
  const cooperativeId = activeCooperativeId ?? "";
  const { can } = useManagerPermissions();

  const { data, isLoading, error } = useManagerMembers(cooperativeId);
  const revokeMemberMutation = useRevokeManagerMember(cooperativeId);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const members: MemberListItem[] = data?.data ?? [];
  const canWrite = can("ManagementMembersWrite");

  return (
    <ManagerLayout>
      <div className="font-['Albert_Sans',sans-serif] p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-[#101828]">Members</h1>
            <p className="text-[13px] text-[#6b7280] mt-0.5">
              Manage cooperative members
            </p>
          </div>
          {canWrite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-5 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#0D8FAF] to-[#066E86] hover:opacity-90 transition-opacity"
            >
              + Invite Member
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-[#fff5f5] border border-[#fecaca] rounded-[10px] px-5 py-4">
            <p className="text-[14px] text-[#dc2626]">
              Failed to load members. Please refresh.
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
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
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
                      <td className="px-5 py-4 text-[14px] font-semibold text-[#101828] whitespace-nowrap">
                        {member.firstName} {member.lastName}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">
                        {member.email}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151] font-mono">
                        {member.accountNumber ?? "N/A"}
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
                        {canWrite && member.isActive && (
                          <button
                            onClick={() =>
                              setRevokeTarget({
                                id: member.id,
                                name: `${member.firstName} ${member.lastName}`,
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
        <InviteMemberModal
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
                  revokeMemberMutation.mutate(revokeTarget.id, {
                    onSuccess: () => setRevokeTarget(null),
                  });
                }}
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
    </ManagerLayout>
  );
}
