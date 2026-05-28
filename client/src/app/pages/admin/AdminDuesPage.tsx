import { useState } from "react";
import { useNavigate } from "react-router";
import AdminLayout from "../../components/AdminLayout";
import { useAllDueSchedules } from "../../hooks/useDues";

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

function formatDateOnly(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type ActiveFilter = "all" | "active" | "inactive";

export default function AdminDuesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const isActive =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;

  const { data, isLoading } = useAllDueSchedules({ page, pageSize, isActive });
  const schedules = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  return (
    <AdminLayout>
      <div
        className="font-['Albert_Sans',sans-serif] px-8 pt-8 pb-6"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#101828]">Dues</h1>
          <p className="text-[14px] text-[#6b7280] mt-1">
            All due schedules across the platform
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex bg-[#f3f4f6] rounded-[10px] p-1 gap-1">
            {(["all", "active", "inactive"] as ActiveFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => { setActiveFilter(f); setPage(1); }}
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
          <p className="text-[13px] text-[#6b7280] ml-auto">
            {isLoading ? "Loading..." : `${totalCount} schedule${totalCount !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  {["#", "Cooperative", "Due Name", "Amount", "Frequency", "Status", "Start Date", "Actions"].map(
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
                {isLoading ? (
                  <>{[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}</>
                ) : schedules.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-[14px] text-[#9ca3af]"
                    >
                      No due schedules have been created yet.
                    </td>
                  </tr>
                ) : (
                  schedules.map((s, idx) => (
                    <tr
                      key={s.id}
                      className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors"
                    >
                      <td className="px-5 py-4 text-[13px] text-[#6b7280]">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-5 py-4 text-[13px] font-medium text-[#374151] whitespace-nowrap">
                        {s.cooperativeName}
                      </td>
                      <td className="px-5 py-4 text-[14px] font-medium text-[#101828]">
                        {s.name}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">
                        ₦{s.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">{s.frequency}</td>
                      <td className="px-5 py-4">
                        {s.isActive ? (
                          <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(22,163,74,0.1)] text-[#16a34a]">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f3f4f6] text-[#6b7280]">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151] whitespace-nowrap">
                        {formatDateOnly(s.startDate)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            navigate(`/admin/cooperatives/${s.cooperativeId}/dues`)
                          }
                          className="text-[12px] font-medium text-[#dc2626] hover:underline cursor-pointer"
                        >
                          View
                        </button>
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
    </AdminLayout>
  );
}
