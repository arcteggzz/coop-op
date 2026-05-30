import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft, Users, Trash2, Pencil, Search } from "lucide-react";
import ManagerLayout from "../../components/ManagerLayout";
import { useAuth } from "../../context/AuthContext";
import { useManagerPermissions } from "../../hooks/useManagerPermissions";
import {
  useLevy,
  useLevyAssignments,
  useAssignLevy,
  useRecordLevyPayment,
  useWaiveLevyAssignment,
  useUpdateLevy,
  useDeleteLevy,
} from "../../hooks/useLevies";
import type {
  LevyAssignment,
  AssignLevyDto,
  RecordLevyPaymentDto,
  UpdateLevyDto,
} from "../../api/levies.api";
import { getMembers } from "../../api/managerManagement.api";
import { formatDateTime } from "../../utils/formatDate";

const THEME_GRADIENT = "from-[#0D8FAF] to-[#066E86]";

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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Paid: "bg-[rgba(22,163,74,0.1)] text-[#16a34a]",
    Pending: "bg-[rgba(234,179,8,0.1)] text-[#ca8a04]",
    Waived: "bg-[#f3f4f6] text-[#6b7280]",
  };
  return (
    <span
      className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${map[status] ?? "bg-[#f3f4f6] text-[#6b7280]"}`}
    >
      {status}
    </span>
  );
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

// ─── Assign Levy Modal ────────────────────────────────────────────────────────

function AssignLevyModal({
  baseUrl,
  cooperativeId,
  levyId,
  onClose,
}: {
  baseUrl: string;
  cooperativeId: string;
  levyId: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const assignMutation = useAssignLevy(baseUrl, cooperativeId, levyId);

  const { data: membersData, isLoading: loadingMembers } = useQuery({
    queryKey: ["assign-levy-members-manager", cooperativeId],
    queryFn: () => getMembers(cooperativeId, { page: 1, pageSize: 1000 }),
  });

  const members = membersData?.data ?? [];
  const filteredMembers = search
    ? members.filter((m) =>
        `${m.firstName} ${m.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()),
      )
    : members;

  const selectedMembers = members.filter((m) => selectedIds.includes(m.id));
  const isAllSelected = members.length > 0 && selectedIds.length === members.length;

  const toggleAll = () => {
    setSelectedIds(isAllSelected ? [] : members.map((m) => m.id));
  };

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    const dto: AssignLevyDto = isAllSelected
      ? { assignTo: "all" }
      : { assignTo: "specific", memberIds: selectedIds };
    assignMutation.mutate(dto, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 font-['Albert_Sans',sans-serif]">
        {step === 1 ? (
          <>
            <div className="p-6 border-b border-[#e5e7eb]">
              <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
                Assign Levy
              </h2>
              <p className="text-[13px] text-[#6b7280]">
                Select the members to assign this levy to.
              </p>
            </div>
            <div className="p-6">
              <div className="relative mb-3">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full pl-9 pr-4 py-2 border border-[#e5e7eb] rounded-[10px] text-[13px] focus:outline-none focus:border-[#0D8FAF] font-['Albert_Sans',sans-serif]"
                />
              </div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[13px] text-[#6b7280]">
                  {selectedIds.length} of {members.length} selected
                </span>
                <button
                  onClick={toggleAll}
                  className="text-[12px] font-medium text-[#0D8FAF] hover:underline cursor-pointer"
                >
                  {isAllSelected ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto border border-[#e5e7eb] rounded-[10px]">
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={18} className="animate-spin text-[#6b7280]" />
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <p className="text-center py-6 text-[13px] text-[#9ca3af]">
                    {search
                      ? "No members match your search."
                      : "No members in this cooperative."}
                  </p>
                ) : (
                  filteredMembers.map((m) => {
                    const isChecked = selectedIds.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] cursor-pointer border-b border-[#f3f4f6] last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMember(m.id)}
                          className="w-4 h-4 accent-[#0D8FAF] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#101828] truncate">
                            {m.firstName} {m.lastName}
                          </p>
                          <p className="text-[11px] text-[#9ca3af] truncate">
                            {m.email}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={selectedIds.length === 0}
                className={`flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r ${THEME_GRADIENT} hover:opacity-90 transition-opacity disabled:opacity-40`}
              >
                Continue ({selectedIds.length})
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 border-b border-[#e5e7eb]">
              <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
                Confirm Assignment
              </h2>
              <p className="text-[13px] text-[#6b7280]">
                You are about to assign this levy to{" "}
                <span className="font-semibold text-[#101828]">
                  {selectedIds.length} member
                  {selectedIds.length !== 1 ? "s" : ""}
                </span>
                .
              </p>
            </div>
            <div className="p-6">
              <div className="max-h-48 overflow-y-auto border border-[#e5e7eb] rounded-[10px]">
                {selectedMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f3f4f6] last:border-0"
                  >
                    <div className="size-7 rounded-full bg-[rgba(13,143,175,0.1)] flex items-center justify-center text-[#0D8FAF] text-[11px] font-semibold shrink-0">
                      {m.firstName[0]}
                      {m.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#101828] truncate">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-[11px] text-[#9ca3af] truncate">
                        {m.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={assignMutation.isPending}
                className={`flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r ${THEME_GRADIENT} hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2`}
              >
                {assignMutation.isPending && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {assignMutation.isPending ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────

function RecordPaymentModal({
  baseUrl,
  cooperativeId,
  levyId,
  assignmentId,
  memberName,
  onClose,
}: {
  baseUrl: string;
  cooperativeId: string;
  levyId: string;
  assignmentId: string;
  memberName: string;
  onClose: () => void;
}) {
  const [paidAmount, setPaidAmount] = useState("");
  const [notes, setNotes] = useState("");
  const recordMutation = useRecordLevyPayment(baseUrl, cooperativeId, levyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto: RecordLevyPaymentDto = {
      paidAmount: parseFloat(paidAmount),
      notes: notes.trim() || undefined,
    };
    recordMutation.mutate({ assignmentId, dto }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 font-['Albert_Sans',sans-serif]">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
          Record Payment
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6">
          Mark a manual payment for {memberName}.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Amount Paid (₦)
            </label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0.00"
              required
              min="0.01"
              step="0.01"
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#0D8FAF]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#0D8FAF] resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={recordMutation.isPending}
              className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordMutation.isPending}
              className={`flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r ${THEME_GRADIENT} hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2`}
            >
              {recordMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {recordMutation.isPending ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Waive Modal ──────────────────────────────────────────────────────────────

function WaiveModal({
  baseUrl,
  cooperativeId,
  levyId,
  assignmentId,
  memberName,
  onClose,
}: {
  baseUrl: string;
  cooperativeId: string;
  levyId: string;
  assignmentId: string;
  memberName: string;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const waiveMutation = useWaiveLevyAssignment(baseUrl, cooperativeId, levyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    waiveMutation.mutate(
      { assignmentId, dto: { notes: notes.trim() || undefined } },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 font-['Albert_Sans',sans-serif]">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
          Waive Levy
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6">
          Waive the levy assignment for {memberName}.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#0D8FAF] resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={waiveMutation.isPending}
              className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={waiveMutation.isPending}
              className={`flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r ${THEME_GRADIENT} hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2`}
            >
              {waiveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {waiveMutation.isPending ? "Waiving..." : "Waive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Levy Modal ──────────────────────────────────────────────────────────

function EditLevyModal({
  baseUrl,
  cooperativeId,
  levyId,
  currentName,
  currentAmount,
  currentDueDate,
  currentDescription,
  onClose,
}: {
  baseUrl: string;
  cooperativeId: string;
  levyId: string;
  currentName: string;
  currentAmount: number;
  currentDueDate: string;
  currentDescription?: string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName);
  const [defaultAmount, setDefaultAmount] = useState(String(currentAmount));
  const [dueDate, setDueDate] = useState(currentDueDate.split("T")[0]);
  const [description, setDescription] = useState(currentDescription ?? "");
  const updateMutation = useUpdateLevy(baseUrl, cooperativeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto: UpdateLevyDto = {
      name: name.trim(),
      defaultAmount: parseFloat(defaultAmount),
      dueDate,
      description: description.trim() || undefined,
    };
    updateMutation.mutate({ levyId, dto }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 font-['Albert_Sans',sans-serif] max-h-[90vh] overflow-y-auto">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-6">
          Edit Levy
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Levy Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#0D8FAF]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Amount (₦)
            </label>
            <input
              type="number"
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#0D8FAF]"
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
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#0D8FAF]"
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
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#0D8FAF] resize-none"
            />
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
              className={`flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r ${THEME_GRADIENT} hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2`}
            >
              {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type StatusFilter = "All" | "Pending" | "Paid" | "Waived";
type ActiveModal =
  | { type: "assign" }
  | { type: "record"; assignment: LevyAssignment }
  | { type: "waive"; assignment: LevyAssignment }
  | { type: "edit" }
  | null;

export default function ManagerLevyDetail() {
  const { levyId } = useParams<{ levyId: string }>();
  const { activeCooperativeId } = useAuth();
  const { can } = useManagerPermissions();
  const navigate = useNavigate();

  const cooperativeId = activeCooperativeId ?? "";
  const baseUrl = `/api/management/levies/${cooperativeId}`;

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const { data: levyData, isLoading: levyLoading } = useLevy(
    baseUrl,
    cooperativeId,
    levyId!,
  );

  const { data: assignmentsData, isLoading: assignmentsLoading } =
    useLevyAssignments(baseUrl, cooperativeId, levyId!, {
      page,
      pageSize,
      status: statusFilter === "All" ? undefined : statusFilter,
    });

  const deleteMutation = useDeleteLevy(baseUrl, cooperativeId);

  const canWrite = can("ManagementLeviesWrite");

  const levy = levyData;
  const assignments = assignmentsData?.data ?? [];
  const totalPages = assignmentsData?.totalPages ?? 1;
  const totalCount = assignmentsData?.totalCount ?? 0;
  const summary = levy?.summary;

  const handleDelete = () => {
    if (!levyId) return;
    if (!confirm("Delete this levy? This action cannot be undone.")) return;
    deleteMutation.mutate(levyId, {
      onSuccess: () => navigate("/manager/levies"),
    });
  };

  if (levyLoading) {
    return (
      <ManagerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-[#6b7280]" />
        </div>
      </ManagerLayout>
    );
  }

  if (!levy) {
    return (
      <ManagerLayout>
        <div className="px-8 pt-8 font-['Albert_Sans',sans-serif]">
          <p className="text-[14px] text-[#6b7280]">Levy not found.</p>
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout>
      <div className="font-['Albert_Sans',sans-serif] px-8 pt-8 pb-10">
        {/* Back */}
        <button
          onClick={() => navigate("/manager/levies")}
          className="flex items-center gap-1.5 text-[13px] text-[#6b7280] hover:text-[#374151] transition-colors cursor-pointer mb-6"
        >
          <ChevronLeft size={16} />
          Back to Levies
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[22px] font-bold text-[#101828]">
                {levy.name}
              </h1>
              {levy.isActive ? (
                <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(22,163,74,0.1)] text-[#16a34a]">
                  Active
                </span>
              ) : (
                <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f3f4f6] text-[#6b7280]">
                  Inactive
                </span>
              )}
            </div>
            {levy.description && (
              <p className="text-[14px] text-[#6b7280]">{levy.description}</p>
            )}
          </div>
          {canWrite && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveModal({ type: "edit" })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#e5e7eb] text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors cursor-pointer"
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[rgba(220,38,38,0.3)] text-[13px] font-medium text-[#dc2626] hover:bg-[rgba(220,38,38,0.05)] transition-colors cursor-pointer disabled:opacity-60"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Levy Metadata */}
        <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[12px] p-4 mb-6 flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <p className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide mb-0.5">Default Amount</p>
            <p className="text-[13px] font-semibold text-[#101828]">{formatCurrency(levy.defaultAmount)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide mb-0.5">Account No.</p>
            <p className="text-[13px] font-semibold text-[#101828] font-mono">{levy.levyAccountNumber}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide mb-0.5">Due Date</p>
            <p className="text-[13px] font-semibold text-[#101828]">{formatDateOnly(levy.dueDate)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide mb-0.5">Status</p>
            {levy.isActive ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(22,163,74,0.1)] text-[#16a34a]">Active</span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#6b7280]">Inactive</span>
            )}
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide mb-0.5">Created By</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-[#101828]">{levy.createdByName ?? "—"}</span>
              {levy.createdByType && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  levy.createdByType === "Admin"
                    ? "bg-[rgba(220,38,38,0.1)] text-[#dc2626]"
                    : "bg-[rgba(13,143,175,0.1)] text-[#0D8FAF]"
                }`}>
                  {levy.createdByType}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide mb-0.5">Created</p>
            <p className="text-[13px] font-semibold text-[#101828]">{formatDateOnly(String(levy.dateCreated))}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
            <p className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide mb-2">
              Total Expected
            </p>
            <p className="text-[20px] font-bold text-[#101828]">
              {formatCurrency(summary?.totalExpected ?? 0)}
            </p>
            <p className="text-[12px] text-[#9ca3af] mt-1">
              {summary?.total ?? 0} member{(summary?.total ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
            <p className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide mb-2">
              Total Collected
            </p>
            <p className="text-[20px] font-bold text-[#16a34a]">
              {formatCurrency(summary?.totalCollected ?? 0)}
            </p>
            <p className="text-[12px] text-[#9ca3af] mt-1">
              {summary?.paid ?? 0} paid
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
            <p className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide mb-2">
              Outstanding
            </p>
            <p className="text-[20px] font-bold text-[#ca8a04]">
              {summary?.pending ?? 0}
            </p>
            <p className="text-[12px] text-[#9ca3af] mt-1">
              pending member{(summary?.pending ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
            <p className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide mb-2">
              Deadline
            </p>
            <p className="text-[18px] font-bold text-[#101828]">
              {formatDateOnly(levy.dueDate)}
            </p>
            <p className="text-[12px] text-[#9ca3af] mt-1">
              {formatCurrency(levy.defaultAmount)} per member
            </p>
          </div>
        </div>

        {/* Assignments section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-semibold text-[#101828]">
              Member Assignments
            </h2>
            <p className="text-[13px] text-[#6b7280]">
              {assignmentsLoading ? "..." : totalCount}
            </p>
          </div>
          {canWrite && (
            <button
              onClick={() => setActiveModal({ type: "assign" })}
              className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white bg-gradient-to-r ${THEME_GRADIENT} hover:opacity-90 transition-opacity cursor-pointer`}
            >
              <Users size={15} />
              Assign Levy
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex bg-[#f3f4f6] rounded-[10px] p-1 gap-1 mb-4 w-fit">
          {(["All", "Pending", "Paid", "Waived"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer ${
                statusFilter === f
                  ? "bg-white text-[#101828] shadow-sm"
                  : "text-[#6b7280] hover:text-[#374151]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  {["#", "Member Name", "Amount Expected", "Amount Paid", "Date Paid", "Status", "Actions"].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-5 py-3.5 text-[12px] font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {assignmentsLoading ? (
                  <>{[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} cols={7} />)}</>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-[14px] text-[#9ca3af]"
                    >
                      {statusFilter === "All"
                        ? "No members have been assigned to this levy yet."
                        : `No ${statusFilter.toLowerCase()} assignments.`}
                    </td>
                  </tr>
                ) : (
                  assignments.map((a, idx) => (
                    <tr
                      key={a.id}
                      className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors"
                    >
                      <td className="px-5 py-4 text-[13px] text-[#6b7280]">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-5 py-4 text-[14px] font-medium text-[#101828] whitespace-nowrap">
                        {a.memberFullName}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">
                        {formatCurrency(a.amount)}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">
                        {a.paidAmount != null ? formatCurrency(a.paidAmount) : "—"}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151] whitespace-nowrap">
                        {a.paidDate ? formatDateTime(a.paidDate) : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-5 py-4">
                        {canWrite && a.status === "Pending" && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                setActiveModal({ type: "record", assignment: a })
                              }
                              className="text-[12px] font-medium text-[#0D8FAF] hover:underline cursor-pointer"
                            >
                              Record
                            </button>
                            <button
                              onClick={() =>
                                setActiveModal({ type: "waive", assignment: a })
                              }
                              className="text-[12px] font-medium text-[#6b7280] hover:underline cursor-pointer"
                            >
                              Waive
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
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
      </div>

      {/* Modals */}
      {activeModal?.type === "assign" && (
        <AssignLevyModal
          baseUrl={baseUrl}
          cooperativeId={cooperativeId}
          levyId={levyId!}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal?.type === "record" && (
        <RecordPaymentModal
          baseUrl={baseUrl}
          cooperativeId={cooperativeId}
          levyId={levyId!}
          assignmentId={activeModal.assignment.id}
          memberName={activeModal.assignment.memberFullName}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal?.type === "waive" && (
        <WaiveModal
          baseUrl={baseUrl}
          cooperativeId={cooperativeId}
          levyId={levyId!}
          assignmentId={activeModal.assignment.id}
          memberName={activeModal.assignment.memberFullName}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal?.type === "edit" && (
        <EditLevyModal
          baseUrl={baseUrl}
          cooperativeId={cooperativeId}
          levyId={levyId!}
          currentName={levy.name}
          currentAmount={levy.defaultAmount}
          currentDueDate={levy.dueDate}
          currentDescription={levy.description}
          onClose={() => setActiveModal(null)}
        />
      )}
    </ManagerLayout>
  );
}
