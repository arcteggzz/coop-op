import { Link } from "react-router";
import { CheckCircle, ArrowRight, TrendingUp } from "lucide-react";
import type {
  DueDashboardSummary,
  ActiveDueSummary,
  UpcomingDueSummary,
} from "../api/dues.api";

interface Props {
  cooperativeId: string;
  summary: DueDashboardSummary | undefined;
  isLoading: boolean;
  viewAllLink: string;
  createLink: string;
  portalColor: string;
}

export default function DuesDashboardWidget({
  summary,
  isLoading,
  viewAllLink,
  createLink,
  portalColor,
}: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 animate-pulse">
        <div className="h-4 bg-[#f3f4f6] rounded w-32 mb-4" />
        <div className="h-3 bg-[#f3f4f6] rounded w-full mb-2" />
        <div className="h-3 bg-[#f3f4f6] rounded w-3/4 mb-2" />
        <div className="h-3 bg-[#f3f4f6] rounded w-1/2" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
        <p
          className="font-['Albert_Sans',sans-serif] text-[13px] font-semibold"
          style={{ color: portalColor }}
        >
          Dues
        </p>
        <Link
          to={viewAllLink}
          className="flex items-center gap-1 text-[12px] font-medium text-[#6b7280] hover:text-[#374151] transition-colors"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      <div className="p-5">
        {summary.state === "no_dues" && (
          <NoDuesState createLink={createLink} portalColor={portalColor} />
        )}
        {summary.state === "upcoming" && (
          <UpcomingOnlyState
            dues={summary.upcomingDues}
            portalColor={portalColor}
          />
        )}
        {summary.state === "active" && (
          <ActiveState
            summary={summary}
            viewAllLink={viewAllLink}
            portalColor={portalColor}
          />
        )}
        {summary.state === "all_paid" && <AllPaidState summary={summary} />}
        {summary.state === "mixed" && (
          <MixedState
            summary={summary}
            viewAllLink={viewAllLink}
            portalColor={portalColor}
          />
        )}
      </div>
    </div>
  );
}

function NoDuesState({
  createLink,
  portalColor,
}: {
  createLink: string;
  portalColor: string;
}) {
  return (
    <div className="text-center py-4">
      <TrendingUp size={32} className="mx-auto mb-3 text-[#d1d5db]" />
      <p className="font-['Albert_Sans',sans-serif] text-[14px] font-medium text-[#374151] mb-1">
        No dues set up yet
      </p>
      <p className="font-['Albert_Sans',sans-serif] text-[12px] text-[#9ca3af] mb-4">
        Create a due schedule to start collecting from members.
      </p>
      <Link
        to={createLink}
        className="inline-block px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: portalColor }}
      >
        Set up dues
      </Link>
    </div>
  );
}

function UpcomingOnlyState({
  dues,
  portalColor,
}: {
  dues: UpcomingDueSummary[];
  portalColor: string;
}) {
  return (
    <div className="space-y-2 border border-[#f3f4f6] rounded-xl p-3">
      {dues.map((d) => (
        <UpcomingDueRow key={d.dueId} due={d} portalColor={portalColor} />
      ))}
    </div>
  );
}

function ActiveState({
  summary,
  viewAllLink,
  portalColor,
}: {
  summary: DueDashboardSummary;
  viewAllLink: string;
  portalColor: string;
}) {
  const { aggregates, activeDues } = summary;
  const displayed = activeDues.slice(0, 3);
  const remaining = activeDues.length - displayed.length;

  return (
    <div>
      <AggregateStats aggregates={aggregates} portalColor={portalColor} />
      <div className="mt-4 space-y-3">
        {displayed.map((d, i) => (
          <div key={d.dueId}>
            {i > 0 && <div className="border-t border-[#f3f4f6] mb-3" />}
            <ActiveDueRow due={d} />
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <Link
          to={viewAllLink}
          className="mt-3 flex items-center gap-1 text-[12px] font-medium text-[#6b7280] hover:text-[#374151] transition-colors"
        >
          View all {activeDues.length} dues <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}

function AllPaidState({ summary }: { summary: DueDashboardSummary }) {
  const { aggregates, activeDues } = summary;
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-[#f0fdf4] rounded-xl border border-[#bbf7d0]">
        <CheckCircle size={16} className="text-[#16a34a] shrink-0" />
        <div>
          <p className="font-['Albert_Sans',sans-serif] text-[13px] font-semibold text-[#16a34a]">
            All members up to date
          </p>
          <p className="font-['Albert_Sans',sans-serif] text-[12px] text-[#15803d]">
            ₦{aggregates.totalCollected.toLocaleString("en-NG")} collected this
            cycle
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {activeDues.map((d) => (
          <div
            key={d.dueId}
            className="flex items-center justify-between text-[13px]"
          >
            <span className="text-[#374151] font-medium truncate max-w-[60%]">
              {d.name}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-[#bbf7d0] rounded-full">
                <div className="h-full w-full bg-[#16a34a] rounded-full" />
              </div>
              <span className="text-[11px] font-semibold text-[#16a34a]">
                100%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MixedState({
  summary,
  viewAllLink,
  portalColor,
}: {
  summary: DueDashboardSummary;
  viewAllLink: string;
  portalColor: string;
}) {
  const { aggregates, activeDues, upcomingDues } = summary;
  const displayed = activeDues.slice(0, 3);
  const remaining = activeDues.length - displayed.length;

  return (
    <div>
      <AggregateStats aggregates={aggregates} portalColor={portalColor} />
      <div className="mt-4 space-y-3">
        {displayed.map((d, i) => (
          <div key={d.dueId}>
            {i > 0 && <div className="border-t border-[#f3f4f6] mb-3" />}
            <ActiveDueRow due={d} />
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <Link
          to={viewAllLink}
          className="mt-2 flex items-center gap-1 text-[12px] font-medium text-[#6b7280] hover:text-[#374151] transition-colors"
        >
          View all {activeDues.length} dues <ArrowRight size={12} />
        </Link>
      )}
      {upcomingDues.length > 0 && (
        <>
          <div className="border-t border-[#f3f4f6] my-4" />
          <p className="font-['Albert_Sans',sans-serif] text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">
            Upcoming
          </p>
          <div className="space-y-2">
            {upcomingDues.map((d) => (
              <UpcomingDueRow key={d.dueId} due={d} portalColor={portalColor} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AggregateStats({
  aggregates,
  portalColor,
}: {
  aggregates: DueDashboardSummary["aggregates"];
  portalColor: string;
}) {
  const stats = [
    {
      label: "Members behind",
      value: aggregates.totalMembersBehind,
      danger: aggregates.totalMembersBehind > 0,
    },
    {
      label: "Collected",
      value: `₦${aggregates.totalCollected.toLocaleString("en-NG")}`,
      danger: false,
    },
    {
      label: "Expected",
      value: `₦${aggregates.totalExpected.toLocaleString("en-NG")}`,
      danger: false,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-[#f9fafb] rounded-xl p-3 text-center border border-[#f3f4f6]"
        >
          <p
            className="font-['Albert_Sans',sans-serif] text-[14px] font-bold"
            style={{ color: s.danger ? "#dc2626" : portalColor }}
          >
            {s.value}
          </p>
          <p className="font-['Albert_Sans',sans-serif] text-[10px] text-[#9ca3af] mt-0.5">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function ActiveDueRow({ due }: { due: ActiveDueSummary }) {
  const pct = due.percentageCollected;
  const badgeColor =
    due.unpaidCount === 0
      ? "bg-[rgba(22,163,74,0.1)] text-[#16a34a]"
      : due.unpaidCount / Math.max(due.paidCount + due.unpaidCount, 1) > 0.1
        ? "bg-[rgba(220,38,38,0.1)] text-[#dc2626]"
        : "bg-[rgba(217,119,6,0.1)] text-[#d97706]";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-['Albert_Sans',sans-serif] text-[13px] font-medium text-[#374151] truncate max-w-[55%]">
          {due.name}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {due.daysLeft !== null && due.daysLeft > 0 && (
            <span className="text-[10px] text-[#9ca3af]">
              {due.daysLeft}d left
            </span>
          )}
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badgeColor}`}
          >
            {due.unpaidCount} unpaid
          </span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? "#16a34a" : "#3b82f6",
          }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6b7280]">
          ₦{due.totalCollected.toLocaleString("en-NG")} / ₦
          {due.totalExpected.toLocaleString("en-NG")}
        </span>
        <span className="font-['Albert_Sans',sans-serif] text-[11px] font-semibold text-[#374151]">
          {pct}%
        </span>
      </div>
    </div>
  );
}

function UpcomingDueRow({
  due,
  portalColor,
}: {
  due: UpcomingDueSummary;
  portalColor: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-[#f9fafb] rounded-xl border border-[#f3f4f6]">
      <div>
        <p className="font-['Albert_Sans',sans-serif] text-[13px] font-medium text-[#374151]">
          {due.name}
        </p>
        <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6b7280]">
          ₦{due.amount.toLocaleString("en-NG")} · {due.memberCount} members
        </p>
      </div>

      <span
        className="text-[10px] font-semibold px-2 py-1 rounded-lg"
        style={{
          backgroundColor: `${portalColor}18`,
          color: portalColor,
        }}
      >
        Starts in {due.daysUntilStart}d
      </span>
    </div>
  );
}
