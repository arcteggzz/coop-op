import { useState } from "react";
import {
  ChevronLeft,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import MemberLayout from "../../components/MemberLayout";
import { useAuth } from "../../context/AuthContext";
import {
  useMemberDueSchedules,
  useMemberDuePayments,
  useMemberOutstandingDues,
  usePayMemberDue,
} from "../../hooks/useDues";
import type {
  OutstandingDuePayment,
  DueSchedule,
  MemberDuePayment,
} from "../../api/dues.api";
import { formatDateTime } from "../../utils/formatDate";

function formatDateOnly(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
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
    <span
      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[status] ?? "bg-[#f3f4f6] text-[#6b7280]"}`}
    >
      {status}
    </span>
  );
}

type View =
  | { mode: "home" }
  | { mode: "confirm-pay"; payment: OutstandingDuePayment }
  | { mode: "history"; scheduleId: string; scheduleName: string };

// ─── Outstanding Due Card ─────────────────────────────────────────────────────

function OutstandingCard({
  payment,
  onPayNow,
}: {
  payment: OutstandingDuePayment;
  onPayNow: () => void;
}) {
  const isOverdue = payment.status === "Overdue";
  return (
    <div
      className={`rounded-2xl border p-4 ${isOverdue ? "border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.03)]" : "border-[#e9d7fe] bg-[#faf5ff]"}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1 mr-2">
          <p className="font-['Albert_Sans',sans-serif] text-[14px] font-semibold text-[#101828] truncate">
            {payment.scheduleName}
          </p>
          <p className="font-['Albert_Sans',sans-serif] text-[12px] text-[#6b7280]">
            {payment.periodLabel}
          </p>
        </div>
        <StatusBadge status={payment.status} />
      </div>
      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="font-['Albert_Sans',sans-serif] font-bold text-[18px] text-[#101828]">
            {formatCurrency(payment.amount)}
          </p>
          <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6b7280]">
            Due {formatDateOnly(payment.dueDate)}
          </p>
        </div>
        <button
          onClick={onPayNow}
          className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white bg-[#7F56D9] hover:bg-[#6941C6] transition-colors cursor-pointer"
        >
          Pay Now
        </button>
      </div>
    </div>
  );
}

// ─── Schedule Row ─────────────────────────────────────────────────────────────

function ScheduleRow({
  schedule,
  onViewHistory,
}: {
  schedule: DueSchedule;
  onViewHistory: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#f3f4f6] last:border-0">
      <div className="min-w-0 flex-1 mr-2">
        <p className="font-['Albert_Sans',sans-serif] text-[13px] font-medium text-[#101828] truncate">
          {schedule.name}
        </p>
        <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6b7280]">
          {formatCurrency(schedule.amount)} · {schedule.frequency}
        </p>
      </div>
      <button
        onClick={onViewHistory}
        className="text-[12px] font-semibold text-[#7F56D9] hover:text-[#6941C6] cursor-pointer shrink-0"
      >
        History
      </button>
    </div>
  );
}

// ─── History Table Row ────────────────────────────────────────────────────────

function HistoryRow({ payment }: { payment: MemberDuePayment }) {
  return (
    <div className="py-3 border-b border-[#f3f4f6] last:border-0">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1 mr-2">
          <p className="font-['Albert_Sans',sans-serif] text-[13px] font-medium text-[#101828]">
            {payment.periodLabel}
          </p>
          <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6b7280]">
            Due {formatDateOnly(payment.dueDate)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-['Albert_Sans',sans-serif] text-[13px] font-bold text-[#101828]">
            {formatCurrency(payment.amount)}
          </p>
          <StatusBadge status={payment.status} />
        </div>
      </div>
      {payment.paidDate && (
        <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6b7280] mt-1">
          Paid {formatDateTime(payment.paidDate)}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemberDues() {
  const { activeCooperativeId } = useAuth();
  const cooperativeId = activeCooperativeId ?? "";
  const [view, setView] = useState<View>({ mode: "home" });

  const { data: outstandingData, isLoading: outstandingLoading } =
    useMemberOutstandingDues(cooperativeId);
  const { data: schedulesData, isLoading: schedulesLoading } =
    useMemberDueSchedules(cooperativeId);

  const outstanding = outstandingData?.data ?? [];
  const schedules = schedulesData?.data ?? [];

  const historyParams =
    view.mode === "history"
      ? { scheduleId: view.scheduleId, pageSize: 50 }
      : undefined;
  const { data: historyData, isLoading: historyLoading } = useMemberDuePayments(
    cooperativeId,
    historyParams,
  );
  const historyPayments = historyData?.data ?? [];

  const payMutation = usePayMemberDue(cooperativeId);

  const handleConfirmPay = () => {
    if (view.mode !== "confirm-pay") return;
    payMutation.mutate(view.payment.id, {
      onSuccess: () => setView({ mode: "home" }),
    });
  };

  return (
    <MemberLayout>
      <div className="font-['Albert_Sans',sans-serif] p-4 flex-1 overflow-y-auto">
        {/* ── View: Home ──────────────────────────────────────────────────────── */}
        {view.mode === "home" && (
          <div className="space-y-4">
            {/* Outstanding section */}
            <div>
              <p className="font-['Albert_Sans',sans-serif] text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
                Outstanding
              </p>

              {outstandingLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-[#e9d7fe] bg-[#faf5ff] p-4"
                    >
                      <div className="h-4 bg-[#e9d7fe] rounded w-2/3 mb-2" />
                      <div className="h-3 bg-[#e9d7fe] rounded w-1/3 mb-3" />
                      <div className="flex justify-between items-center">
                        <div className="h-5 bg-[#e9d7fe] rounded w-24" />
                        <div className="h-8 bg-[#7F56D9] rounded-[10px] w-20 opacity-30" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : outstanding.length === 0 ? (
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-[#16a34a] shrink-0" />
                  <p className="font-['Albert_Sans',sans-serif] text-[13px] text-[#16a34a] font-medium">
                    You're all caught up — no outstanding dues.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {outstanding.map((p) => (
                    <OutstandingCard
                      key={p.id}
                      payment={p}
                      onPayNow={() =>
                        setView({ mode: "confirm-pay", payment: p })
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* All Dues section */}
            <div>
              <p className="font-['Albert_Sans',sans-serif] text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
                All Dues
              </p>

              {schedulesLoading ? (
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between">
                      <div className="space-y-1.5">
                        <div className="h-3 bg-[#f3f4f6] rounded w-32" />
                        <div className="h-2.5 bg-[#f3f4f6] rounded w-20" />
                      </div>
                      <div className="h-3 bg-[#f3f4f6] rounded w-12" />
                    </div>
                  ))}
                </div>
              ) : schedules.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 text-center">
                  <Clock size={20} className="text-[#9ca3af] mx-auto mb-2" />
                  <p className="font-['Albert_Sans',sans-serif] text-[13px] text-[#6b7280]">
                    No active due schedules in this cooperative.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#e5e7eb] px-4">
                  {schedules.map((s) => (
                    <ScheduleRow
                      key={s.id}
                      schedule={s}
                      onViewHistory={() =>
                        setView({
                          mode: "history",
                          scheduleId: s.id,
                          scheduleName: s.name,
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── View: Confirm Pay ────────────────────────────────────────────────── */}
        {view.mode === "confirm-pay" && (
          <div>
            <button
              onClick={() => setView({ mode: "home" })}
              className="flex items-center gap-1.5 text-[13px] text-[#6b7280] hover:text-[#374151] mb-5 cursor-pointer"
            >
              <ChevronLeft size={16} /> Back
            </button>

            <p className="font-['Albert_Sans',sans-serif] text-[18px] font-bold text-[#101828] mb-5">
              Confirm Payment
            </p>

            <div className="bg-[#faf5ff] border border-[#e9d7fe] rounded-2xl p-5 space-y-3 mb-5">
              <div className="flex justify-between">
                <span className="font-['Albert_Sans',sans-serif] text-[13px] text-[#6b7280]">
                  Due
                </span>
                <span className="font-['Albert_Sans',sans-serif] text-[13px] font-semibold text-[#101828]">
                  {view.payment.scheduleName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-['Albert_Sans',sans-serif] text-[13px] text-[#6b7280]">
                  Period
                </span>
                <span className="font-['Albert_Sans',sans-serif] text-[13px] text-[#374151]">
                  {view.payment.periodLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-['Albert_Sans',sans-serif] text-[13px] text-[#6b7280]">
                  Due Date
                </span>
                <span className="font-['Albert_Sans',sans-serif] text-[13px] text-[#374151]">
                  {formatDateOnly(view.payment.dueDate)}
                </span>
              </div>
              <div className="border-t border-[#e9d7fe] pt-3 flex justify-between">
                <span className="font-['Albert_Sans',sans-serif] text-[14px] font-semibold text-[#374151]">
                  Amount
                </span>
                <span className="font-['Albert_Sans',sans-serif] text-[16px] font-bold text-[#7F56D9]">
                  {formatCurrency(view.payment.amount)}
                </span>
              </div>
            </div>

            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl px-4 py-3 flex items-start gap-2 mb-5">
              <AlertCircle
                size={16}
                className="text-[#ca8a04] shrink-0 mt-0.5"
              />
              <p className="font-['Albert_Sans',sans-serif] text-[12px] text-[#92400e]">
                This amount will be deducted from your wallet. Make sure you
                have sufficient balance.
              </p>
            </div>

            <button
              onClick={handleConfirmPay}
              disabled={payMutation.isPending}
              className="w-full py-3 rounded-[12px] font-['Albert_Sans',sans-serif] font-semibold text-[15px] text-white bg-[#7F56D9] hover:bg-[#6941C6] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {payMutation.isPending && (
                <Loader2 size={16} className="animate-spin" />
              )}
              {payMutation.isPending
                ? "Processing..."
                : `Pay ${formatCurrency(view.payment.amount)}`}
            </button>

            <button
              onClick={() => setView({ mode: "home" })}
              disabled={payMutation.isPending}
              className="w-full mt-3 py-3 rounded-[12px] font-['Albert_Sans',sans-serif] font-medium text-[15px] text-[#374151] border border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors cursor-pointer disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── View: History ────────────────────────────────────────────────────── */}
        {view.mode === "history" && (
          <div>
            <button
              onClick={() => setView({ mode: "home" })}
              className="flex items-center gap-1.5 text-[13px] text-[#6b7280] hover:text-[#374151] mb-4 cursor-pointer"
            >
              <ChevronLeft size={16} /> Back
            </button>

            <p className="font-['Albert_Sans',sans-serif] text-[16px] font-bold text-[#101828] mb-1">
              {view.scheduleName}
            </p>
            <p className="font-['Albert_Sans',sans-serif] text-[12px] text-[#6b7280] mb-4">
              Payment history
            </p>

            {historyLoading ? (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] px-4 space-y-3 py-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="space-y-1.5">
                      <div className="h-3 bg-[#f3f4f6] rounded w-28" />
                      <div className="h-2.5 bg-[#f3f4f6] rounded w-20" />
                    </div>
                    <div className="space-y-1.5 text-right">
                      <div className="h-3 bg-[#f3f4f6] rounded w-16" />
                      <div className="h-2.5 bg-[#f3f4f6] rounded w-12 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : historyPayments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 text-center">
                <p className="font-['Albert_Sans',sans-serif] text-[13px] text-[#6b7280]">
                  No payment history yet.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] px-4">
                {historyPayments.map((p) => (
                  <HistoryRow key={p.id} payment={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
