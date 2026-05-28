import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Link } from "react-router";
import {
  useCooperatives,
  useCreateCooperative,
} from "../../hooks/useAdminCooperatives";
import { isForbiddenError } from "../../api/axiosInstance";

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CreateCoopModalProps {
  onClose: () => void;
}

function CreateCoopModal({ onClose }: CreateCoopModalProps) {
  const [name, setName] = useState("");
  const createMutation = useCreateCooperative();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 font-['Albert_Sans',sans-serif]">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
          Add Cooperative
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6">
          Create a new cooperative on the platform.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Cooperative Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lagos Teachers Cooperative"
              required
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 font-['Albert_Sans',sans-serif] text-[14px] text-[#101828] focus:outline-none focus:border-[#dc2626] placeholder:text-[#99a1af]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCooperatives() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data, isLoading, error } = useCooperatives();

  const cooperatives = data?.data ?? [];

  return (
    <AdminLayout>
      <div className="font-['Albert_Sans',sans-serif] p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-[#101828]">
              Cooperatives
            </h1>
            <p className="text-[13px] text-[#6b7280] mt-0.5">
              Manage all cooperatives on the platform
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity"
          >
            + Add Cooperative
          </button>
        </div>

        {error && !isForbiddenError(error) && (
          <div className="mb-6 bg-[#fff5f5] border border-[#fecaca] rounded-[10px] px-5 py-4">
            <p className="text-[14px] text-[#dc2626]">
              Failed to load cooperatives. Please refresh.
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
                    "Name",
                    "Created By",
                    "Managers",
                    "Members",
                    "Date Created",
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
                ) : cooperatives.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-[14px] text-[#9ca3af]"
                    >
                      No cooperatives yet. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  cooperatives.map((coop, idx) => (
                    <tr
                      key={coop.id}
                      className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors"
                    >
                      <td className="px-5 py-4 text-[13px] text-[#6b7280]">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4 text-[14px] font-semibold text-[#101828]">
                        {coop.name}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">
                        {coop.createdByAdminName ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">
                        {coop.managerCount ?? 0}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">
                        {coop.memberCount ?? 0}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151] whitespace-nowrap">
                        {formatDate(coop.dateCreated)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/cooperatives/${coop.id}`}
                          className="text-[12px] font-medium text-[#0D8FAF] hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateCoopModal onClose={() => setShowCreateModal(false)} />
      )}
    </AdminLayout>
  );
}
