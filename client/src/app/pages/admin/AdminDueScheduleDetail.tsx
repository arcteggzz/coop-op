import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Loader2, ChevronLeft, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useCooperative } from "../../hooks/useAdminCooperatives";
import {
  useDueSchedule,
  useDuePayments,
  useUpdateDueSchedule,
  useIssueDues,
  useRecordDuePayment,
  useWaiveDuePayment,
} from "../../hooks/useDues";
import type { DuePayment, IssueDuesDto, RecordPaymentDto } from "../../api/dues.api";
import { formatDateTime } from "../../utils/formatDate";

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
    Overdue: "bg-[rgba(220,38,38,0.1)] text-[#dc2626]",
  };
  return (
    <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${map[status] ?? "bg-[#f3f4f6] text-[#6b7280]"}`}>
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

// ─── Issue Period Modal ───────────────────────────────────────────────────────

function IssuePeriodModal({
  baseUrl,
  cooperativeId,
  scheduleId,
  defaultAmount,
  onClose,
}: {
  baseUrl: string;
  cooperativeId: string;
  scheduleId: string;
  defaultAmount: number;
  onClose: () => void;
}) {
  const [periodLabel, setPeriodLabel] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amountOverride, setAmountOverride] = useState("");
  const issueMutation = useIssueDues(baseUrl, cooperativeId, scheduleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto: IssueDuesDto = {
      periodLabel: periodLabel.trim(),
      dueDate,
      amount: amountOverride ? parseFloat(amountOverride) : undefined,
    };
    issueMutation.mutate(dto, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 font-['Albert_Sans',sans-serif]">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">Issue Dues for a Period</h2>
        <p className="text-[13px] text-[#6b7280] mb-6">This will create a payment record for every active member.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Period Label</label>
            <input
              type="text"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="e.g. June 2026"
              required
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#dc2626] placeholder:text-[#99a1af]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#dc2626]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Amount Override (₦) — leave blank to use {formatCurrency(defaultAmount)}
            </label>
            <input
              type="number"
              value={amountOverride}
              onChange={(e) => setAmountOverride(e.target.value)}
              placeholder={String(defaultAmount)}
              min="0.01"
              step="0.01"
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#dc2626]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={issueMutation.isPending}
              className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={issueMutation.isPending}
              className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {issueMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {issueMutation.isPending ? "Issuing..." : "Issue Dues"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────

function RecordPaymentModal({
  baseUrl,
  cooperativeId,
  paymentId,
  memberName,
  onClose,
}: {
  baseUrl: string;
  cooperativeId: string;
  paymentId: string;
  memberName: string;
  onClose: () => void;
}) {
  const [paidAmount, setPaidAmount] = useState("");
  const [notes, setNotes] = useState("");
  const recordMutation = useRecordDuePayment(baseUrl, cooperativeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto: RecordPaymentDto = {
      paidAmount: parseFloat(paidAmount),
      notes: notes.trim() || undefined,
    };
    recordMutation.mutate({ paymentId, dto }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 font-['Albert_Sans',sans-serif]">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">Record Payment</h2>
        <p className="text-[13px] text-[#6b7280] mb-6">Mark a manual payment for {memberName}.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Amount Paid (₦)</label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0.00"
              required
              min="0.01"
              step="0.01"
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#dc2626]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#dc2626] resize-none"
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
              className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
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
  paymentId,
  memberName,
  onClose,
}: {
  baseUrl: string;
  cooperativeId: string;
  paymentId: string;
  memberName: string;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const waiveMutation = useWaiveDuePayment(baseUrl, cooperativeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 font-['Albert_Sans',sans-serif]">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">Waive Payment</h2>
        <p className="text-[13px] text-[#6b7280] mb-6">Waive the due payment for {memberName}.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#dc2626] resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={waiveMutation.isPending}
              className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                waiveMutation.mutate(
                  { paymentId, dto: { notes: notes.trim() || undefined } },
                  { onSuccess: onClose },
                )
              }
              disabled={waiveMutation.isPending}
              className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {waiveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {waiveMutation.isPending ? "Waiving..." : "Waive Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDueScheduleDetail() {
  const { cooperativeId, scheduleId } = useParams<{ cooperativeId: string; scheduleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const periodName = searchParams.get("period-name");

  const baseUrl = `/api/coop-admin/cooperatives/${cooperativeId}/dues`;

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [recordPaymentTarget, setRecordPaymentTarget] = useState<DuePayment | null>(null);
  const [waiveTarget, setWaiveTarget] = useState<DuePayment | null>(null);

  const { data: coop, isLoading: coopLoading } = useCooperative(cooperativeId!);
  const { data: schedule, isLoading: scheduleLoading } = useDueSchedule(baseUrl, cooperativeId!, scheduleId!);
  const { data: paymentsData, isLoading: paymentsLoading } = useDuePayments(
    baseUrl,
    cooperativeId!,
    { scheduleId: scheduleId!, pageSize: 500 },
  );
  const toggleMutation = useUpdateDueSchedule(baseUrl, cooperativeId!);

  const allPayments = paymentsData?.data ?? [];

  // Group payments into cycles
  const cycleMap = new Map<string, { dueDate: string; payments: DuePayment[] }>();
  for (const p of allPayments) {
    if (!cycleMap.has(p.periodLabel)) {
      cycleMap.set(p.periodLabel, { dueDate: p.dueDate, payments: [] });
    }
    cycleMap.get(p.periodLabel)!.payments.push(p);
  }
  const cycles = Array.from(cycleMap.entries()).map(([label, { dueDate, payments }]) => ({
    periodLabel: label,
    dueDate,
    payments,
    totalExpected: payments.reduce((s, p) => s + p.amount, 0),
    totalPaid: payments.filter((p) => p.status === "Paid").reduce((s, p) => s + (p.paidAmount ?? 0), 0),
    pendingCount: payments.filter((p) => p.status === "Pending" || p.status === "Overdue").length,
    memberCount: payments.length,
  }));

  const totalCollected = allPayments.filter((p) => p.status === "Paid").reduce((s, p) => s + (p.paidAmount ?? 0), 0);
  const totalOwing = allPayments.filter((p) => p.status === "Pending" || p.status === "Overdue").reduce((s, p) => s + p.amount, 0);

  const cyclePayments = periodName
    ? allPayments.filter((p) => p.periodLabel === periodName)
    : [];

  const currentCycle = periodName ? cycleMap.get(periodName) : undefined;

  function clearPeriod() {
    setSearchParams({});
  }

  function selectPeriod(label: string) {
    setSearchParams({ "period-name": label });
  }

  return (
    <AdminLayout>
      <div className="font-['Albert_Sans',sans-serif] flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-6 border-b border-[#e5e7eb] bg-white">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-3 text-[13px] text-[#6b7280]">
            <Link to="/admin/cooperatives" className="hover:text-[#dc2626] transition-colors">Cooperatives</Link>
            <span>/</span>
            <Link
              to={`/admin/cooperatives/${cooperativeId}`}
              className="hover:text-[#dc2626] transition-colors"
            >
              {coopLoading ? "..." : (coop?.name ?? "Cooperative")}
            </Link>
            <span>/</span>
            <Link
              to={`/admin/cooperatives/${cooperativeId}/dues`}
              className="hover:text-[#dc2626] transition-colors"
            >
              Dues
            </Link>
            <span>/</span>
            <span className="text-[#101828] font-medium">
              {scheduleLoading ? "..." : (schedule?.name ?? "Schedule")}
            </span>
            {periodName && (
              <>
                <span>/</span>
                <span className="text-[#101828] font-medium">{periodName}</span>
              </>
            )}
          </div>

          {/* Schedule info */}
          {scheduleLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-6 w-48 bg-[#f3f4f6] rounded" />
              <div className="h-3 w-96 bg-[#f3f4f6] rounded" />
            </div>
          ) : schedule ? (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[22px] font-bold text-[#101828]">{schedule.name}</h1>
                <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  schedule.isActive
                    ? "bg-[rgba(22,163,74,0.1)] text-[#16a34a]"
                    : "bg-[#f3f4f6] text-[#6b7280]"
                }`}>
                  {schedule.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {schedule.description && (
                <p className="text-[13px] text-[#6b7280] mb-3">{schedule.description}</p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-[#6b7280]">
                <span>
                  <span className="font-medium text-[#374151]">Amount:</span>{" "}
                  {formatCurrency(schedule.amount)}
                </span>
                <span>
                  <span className="font-medium text-[#374151]">Frequency:</span>{" "}
                  {schedule.frequency}
                </span>
                <span>
                  <span className="font-medium text-[#374151]">Start Date:</span>{" "}
                  {formatDateOnly(schedule.startDate)}
                </span>
                {schedule.endDate && (
                  <span>
                    <span className="font-medium text-[#374151]">End Date:</span>{" "}
                    {formatDateOnly(schedule.endDate)}
                  </span>
                )}
                <span>
                  <span className="font-medium text-[#374151]">Due Account:</span>{" "}
                  <span className="font-mono">{schedule.dueAccountNumber}</span>
                </span>
                <span>
                  <span className="font-medium text-[#374151]">Created by:</span>{" "}
                  {schedule.createdByName ?? "—"}
                  {schedule.createdByType && (
                    <span className={`ml-1.5 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      schedule.createdByType === "Admin"
                        ? "bg-[rgba(220,38,38,0.1)] text-[#dc2626]"
                        : "bg-[rgba(13,143,175,0.1)] text-[#0D8FAF]"
                    }`}>
                      {schedule.createdByType === "Admin" ? "Back Office" : "Manager"}
                    </span>
                  )}
                </span>
                <span>
                  <span className="font-medium text-[#374151]">Created:</span>{" "}
                  {schedule.dateCreated ? formatDateTime(schedule.dateCreated) : "—"}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Content area ─────────────────────────────────────────────────── */}
        <div className="flex-1 p-8 bg-[#fafbfd] overflow-auto">

          {/* ── Schedule detail (no period selected) ── */}
          {!periodName && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Link
                  to={`/admin/cooperatives/${cooperativeId}/dues`}
                  className="flex items-center gap-1.5 text-[13px] text-[#6b7280] hover:text-[#374151]"
                >
                  <ChevronLeft size={16} /> Back to Schedules
                </Link>
                <div className="flex items-center gap-2">
                  {schedule && (
                    <button
                      onClick={() => toggleMutation.mutate({ scheduleId: scheduleId!, dto: { isActive: !schedule.isActive } })}
                      className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-[8px] border border-[#e5e7eb] text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
                    >
                      {schedule.isActive ? (
                        <><ToggleRight size={16} className="text-[#16a34a]" /> Deactivate</>
                      ) : (
                        <><ToggleLeft size={16} className="text-[#9ca3af]" /> Activate</>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setShowIssueModal(true)}
                    className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Issue Period
                  </button>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Total Collected", value: formatCurrency(totalCollected) },
                  { label: "Total Owing", value: formatCurrency(totalOwing) },
                  { label: "Periods Issued", value: cycles.length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-2xl border border-[#e5e7eb] p-4">
                    <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">{label}</p>
                    {paymentsLoading ? (
                      <div className="h-6 bg-[#f3f4f6] rounded animate-pulse w-20" />
                    ) : (
                      <p className="font-bold text-[20px] text-[#101828]">{value}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Cycles table */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                        {["Period", "Due Date", "Members", "Expected", "Collected", "Pending", "Actions"].map((col) => (
                          <th key={col} className="px-5 py-3.5 text-[12px] font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsLoading ? (
                        <>{[1, 2, 3].map((i) => <SkeletonRow key={i} cols={7} />)}</>
                      ) : cycles.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-10 text-center text-[14px] text-[#9ca3af]">
                            No periods issued yet. Click "Issue Period" to get started.
                          </td>
                        </tr>
                      ) : (
                        cycles.map((c) => (
                          <tr key={c.periodLabel} className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors">
                            <td className="px-5 py-4 text-[14px] font-medium text-[#101828]">{c.periodLabel}</td>
                            <td className="px-5 py-4 text-[13px] text-[#374151] whitespace-nowrap">{formatDateOnly(c.dueDate)}</td>
                            <td className="px-5 py-4 text-[13px] text-[#374151]">{c.memberCount}</td>
                            <td className="px-5 py-4 text-[13px] text-[#374151]">{formatCurrency(c.totalExpected)}</td>
                            <td className="px-5 py-4 text-[13px] text-[#16a34a] font-medium">{formatCurrency(c.totalPaid)}</td>
                            <td className="px-5 py-4 text-[13px] text-[#ca8a04]">{c.pendingCount}</td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => selectPeriod(c.periodLabel)}
                                className="text-[12px] font-medium text-[#dc2626] hover:underline cursor-pointer"
                              >
                                View Members
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

          {/* ── Period detail (period selected) ── */}
          {periodName && (
            <div>
              <button
                onClick={clearPeriod}
                className="flex items-center gap-1.5 text-[13px] text-[#6b7280] hover:text-[#374151] mb-4 cursor-pointer"
              >
                <ChevronLeft size={16} /> Back to Periods
              </button>

              <div className="mb-4">
                <h2 className="text-[18px] font-semibold text-[#101828]">{periodName}</h2>
                <p className="text-[13px] text-[#6b7280]">
                  Due: {formatDateOnly(currentCycle?.dueDate)}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                        {["#", "Member", "Expected", "Paid", "Status", "Date Paid", "Actions"].map((col) => (
                          <th key={col} className="px-5 py-3.5 text-[12px] font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsLoading ? (
                        <>{[1, 2, 3].map((i) => <SkeletonRow key={i} cols={7} />)}</>
                      ) : cyclePayments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-10 text-center text-[14px] text-[#9ca3af]">
                            No members found for this period.
                          </td>
                        </tr>
                      ) : (
                        cyclePayments.map((p, idx) => (
                          <tr key={p.id} className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors">
                            <td className="px-5 py-4 text-[13px] text-[#6b7280]">{idx + 1}</td>
                            <td className="px-5 py-4 text-[14px] font-medium text-[#101828] whitespace-nowrap">{p.memberFullName}</td>
                            <td className="px-5 py-4 text-[13px] text-[#374151]">{formatCurrency(p.amount)}</td>
                            <td className="px-5 py-4 text-[13px] text-[#374151]">
                              {p.paidAmount != null ? formatCurrency(p.paidAmount) : "—"}
                            </td>
                            <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                            <td className="px-5 py-4 text-[13px] text-[#374151] whitespace-nowrap">
                              {p.paidDate ? formatDateTime(p.paidDate) : "—"}
                            </td>
                            <td className="px-5 py-4">
                              {(p.status === "Pending" || p.status === "Overdue") && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setRecordPaymentTarget(p)}
                                    className="text-[12px] font-medium text-[#dc2626] hover:underline cursor-pointer whitespace-nowrap"
                                  >
                                    Mark Paid
                                  </button>
                                  <button
                                    onClick={() => setWaiveTarget(p)}
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
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showIssueModal && schedule && (
        <IssuePeriodModal
          baseUrl={baseUrl}
          cooperativeId={cooperativeId!}
          scheduleId={scheduleId!}
          defaultAmount={schedule.amount}
          onClose={() => setShowIssueModal(false)}
        />
      )}

      {recordPaymentTarget && (
        <RecordPaymentModal
          baseUrl={baseUrl}
          cooperativeId={cooperativeId!}
          paymentId={recordPaymentTarget.id}
          memberName={recordPaymentTarget.memberFullName}
          onClose={() => setRecordPaymentTarget(null)}
        />
      )}

      {waiveTarget && (
        <WaiveModal
          baseUrl={baseUrl}
          cooperativeId={cooperativeId!}
          paymentId={waiveTarget.id}
          memberName={waiveTarget.memberFullName}
          onClose={() => setWaiveTarget(null)}
        />
      )}
    </AdminLayout>
  );
}
