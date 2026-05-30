import { useState } from "react";
import { Link } from "react-router";
import { Loader2, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useAdminCooperativeWallets } from "../../hooks/useAdminCooperatives";
import {
  useLevies,
  useCreateLevy,
  useUpdateLevy,
  useDeleteLevy,
} from "../../hooks/useLevies";
import type { Levy, CreateLevyDto } from "../../api/levies.api";

function formatDateOnly(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

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

function CreatorCell({ name, type }: { name?: string | null; type?: string | null }) {
  if (!name) return <span className="text-[13px] text-[#9ca3af]">—</span>;
  return (
    <div>
      <p className="text-[13px] font-medium text-[#101828]">{name}</p>
      <span
        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
          type === "Admin"
            ? "bg-[rgba(220,38,38,0.1)] text-[#dc2626]"
            : "bg-[rgba(13,143,175,0.1)] text-[#0D8FAF]"
        }`}
      >
        {type === "Admin" ? "Back Office" : "Manager"}
      </span>
    </div>
  );
}

// ─── Create Levy Modal ────────────────────────────────────────────────────────

function CreateLevyModal({
  baseUrl,
  cooperativeId,
  onClose,
}: {
  baseUrl: string;
  cooperativeId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultAmount, setDefaultAmount] = useState("");
  const [levyAccountNumber, setLevyAccountNumber] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { data: wallets, isLoading: walletsLoading } =
    useAdminCooperativeWallets(cooperativeId);
  const createMutation = useCreateLevy(baseUrl, cooperativeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto: CreateLevyDto = {
      name: name.trim(),
      description: description.trim() || undefined,
      defaultAmount: parseFloat(defaultAmount),
      levyAccountNumber,
      dueDate,
    };
    createMutation.mutate(dto, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-8 font-['Albert_Sans',sans-serif] max-h-[90vh] overflow-y-auto">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
          Create Levy
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6">
          Set up a one-time charge for members of this cooperative.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Levy Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Absenteeism Fine — March AGM"
              required
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#dc2626] placeholder:text-[#99a1af]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#dc2626] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                Amount per Member (₦)
              </label>
              <input
                type="number"
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(e.target.value)}
                placeholder="0.00"
                required
                min="0.01"
                step="0.01"
                className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#dc2626]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                Deadline
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#dc2626]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Treasury Wallet
            </label>
            {walletsLoading ? (
              <div className="h-10 bg-[#f3f4f6] rounded-[10px] animate-pulse" />
            ) : !wallets || wallets.length === 0 ? (
              <p className="text-[13px] text-[#dc2626]">
                No wallets available. Create a cooperative wallet first.
              </p>
            ) : (
              <select
                value={levyAccountNumber}
                onChange={(e) => setLevyAccountNumber(e.target.value)}
                required
                className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#dc2626] bg-white"
              >
                <option value="">Select wallet</option>
                {wallets.map((w) => (
                  <option key={w.accountNumber} value={w.accountNumber}>
                    {w.walletName} — {w.accountNumber}
                  </option>
                ))}
              </select>
            )}
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
              disabled={createMutation.isPending || !levyAccountNumber}
              className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {createMutation.isPending && (
                <Loader2 size={14} className="animate-spin" />
              )}
              {createMutation.isPending ? "Creating..." : "Create Levy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteLevyModal({
  baseUrl,
  cooperativeId,
  levyId,
  levyName,
  onClose,
}: {
  baseUrl: string;
  cooperativeId: string;
  levyId: string;
  levyName: string;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteLevy(baseUrl, cooperativeId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 font-['Albert_Sans',sans-serif]">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-3">
          Delete Levy
        </h2>
        <p className="text-[14px] text-[#6b7280] mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-[#374151]">{levyName}</span>? This
          cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteMutation.mutate(levyId, { onSuccess: onClose })}
            disabled={deleteMutation.isPending}
            className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminLevies Component ───────────────────────────────────────────────

type ActiveFilter = "all" | "active" | "inactive";

export default function AdminLevies({ cooperativeId }: { cooperativeId: string }) {
  const baseUrl = `/api/coop-admin/cooperatives/${cooperativeId}/levies`;

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Levy | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const isActive =
    activeFilter === "active"
      ? true
      : activeFilter === "inactive"
        ? false
        : undefined;

  const { data, isLoading } = useLevies(baseUrl, cooperativeId, {
    page,
    pageSize,
    isActive,
  });
  const levies = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  const updateMutation = useUpdateLevy(baseUrl, cooperativeId);

  const handleToggleActive = (levy: Levy) => {
    updateMutation.mutate({
      levyId: levy.id,
      dto: { isActive: !levy.isActive },
    });
  };

  const COLS = [
    "#",
    "Levy Name",
    "Amount",
    "Account No.",
    "Deadline",
    "Assigned To",
    "Created By",
    "Status",
    "Actions",
  ];

  return (
    <div className="font-['Albert_Sans',sans-serif]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex bg-[#f3f4f6] rounded-[10px] p-1 gap-1">
            {(["all", "active", "inactive"] as ActiveFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setActiveFilter(f);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer capitalize ${
                  activeFilter === f
                    ? "bg-white text-[#101828] shadow-sm"
                    : "text-[#6b7280] hover:text-[#374151]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <p className="text-[13px] text-[#6b7280]">
            {isLoading
              ? "Loading..."
              : `${totalCount} lev${totalCount !== 1 ? "ies" : "y"}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={14} /> Create Levy
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                {COLS.map((col) => (
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
                  {[1, 2, 3].map((i) => (
                    <SkeletonRow key={i} cols={COLS.length} />
                  ))}
                </>
              ) : levies.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLS.length}
                    className="px-5 py-10 text-center text-[14px] text-[#9ca3af]"
                  >
                    No levies yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                levies.map((l, idx) => (
                  <tr
                    key={l.id}
                    className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors"
                  >
                    <td className="px-5 py-4 text-[13px] text-[#6b7280]">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/admin/cooperatives/${cooperativeId}/levies/${l.id}`}
                        className="text-[14px] font-medium text-[#101828] hover:text-[#dc2626] transition-colors"
                      >
                        {l.name}
                      </Link>
                      {l.description && (
                        <p className="text-[12px] text-[#6b7280] mt-0.5 line-clamp-1">
                          {l.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[#374151]">
                      {formatCurrency(l.defaultAmount)}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[#374151] font-mono whitespace-nowrap">
                      {l.levyAccountNumber}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[#374151] whitespace-nowrap">
                      {formatDateOnly(l.dueDate)}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[#374151] whitespace-nowrap">
                      {l.assignedCount ?? 0} member
                      {(l.assignedCount ?? 0) !== 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-4">
                      <CreatorCell name={l.createdByName} type={l.createdByType} />
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleActive(l)}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        title={l.isActive ? "Deactivate" : "Activate"}
                      >
                        {l.isActive ? (
                          <>
                            <ToggleRight size={18} className="text-[#16a34a]" />
                            <span className="text-[11px] font-semibold text-[#16a34a]">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={18} className="text-[#9ca3af]" />
                            <span className="text-[11px] font-semibold text-[#9ca3af]">
                              Inactive
                            </span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/admin/cooperatives/${cooperativeId}/levies/${l.id}`}
                          className="text-[12px] font-medium text-[#dc2626] hover:underline"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(l)}
                          className="text-[#9ca3af] hover:text-[#dc2626] transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-[8px] text-[13px] font-medium border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors cursor-pointer disabled:opacity-40"
          >
            Previous
          </button>
          <p className="text-[13px] text-[#6b7280]">
            Page {page} of {totalPages}
          </p>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-[8px] text-[13px] font-medium border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors cursor-pointer disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {showCreate && (
        <CreateLevyModal
          baseUrl={baseUrl}
          cooperativeId={cooperativeId}
          onClose={() => setShowCreate(false)}
        />
      )}

      {deleteTarget && (
        <DeleteLevyModal
          baseUrl={baseUrl}
          cooperativeId={cooperativeId}
          levyId={deleteTarget.id}
          levyName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
