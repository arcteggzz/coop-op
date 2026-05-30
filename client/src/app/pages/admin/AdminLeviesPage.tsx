import { useState } from "react";
import { useNavigate } from "react-router";
import AdminLayout from "../../components/AdminLayout";
import { useAllLevies } from "../../hooks/useLevies";

function SkeletonRow() {
  return (
    <tr className="border-b border-[#f3f4f6] animate-pulse">
      {Array.from({ length: 9 }).map((_, i) => (
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

export default function AdminLeviesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const isActive =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;

  const { data, isLoading } = useAllLevies({ page, pageSize, isActive });
  const levies = data?.data ?? [];
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
          <h1 className="text-[22px] font-bold text-[#101828]">Levies</h1>
          <p className="text-[14px] text-[#6b7280] mt-1">
            All levies across the platform
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
            {isLoading ? "Loading..." : `${totalCount} lev${totalCount !== 1 ? "ies" : "y"}`}
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  {["#", "Cooperative", "Levy Name", "Amount", "Deadline", "Assigned To", "Created By", "Status", "Actions"].map(
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
                ) : levies.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-12 text-center text-[14px] text-[#9ca3af]"
                    >
                      No levies found.
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
                      <td className="px-5 py-4 text-[13px] font-medium text-[#374151] whitespace-nowrap">
                        {l.cooperativeName}
                      </td>
                      <td className="px-5 py-4 text-[14px] font-medium text-[#101828]">
                        {l.name}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151]">
                        ₦{l.defaultAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151] whitespace-nowrap">
                        {formatDateOnly(l.dueDate)}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#374151] whitespace-nowrap">
                        {l.assignedCount ?? 0} member{(l.assignedCount ?? 0) !== 1 ? "s" : ""}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-[#374151]">
                            {l.createdByName ?? "—"}
                          </span>
                          {l.createdByType && (
                            <span
                              className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={
                                l.createdByType === "Admin"
                                  ? { background: "rgba(220,38,38,0.1)", color: "#dc2626" }
                                  : { background: "rgba(13,143,175,0.1)", color: "#0D8FAF" }
                              }
                            >
                              {l.createdByType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {l.isActive ? (
                          <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(22,163,74,0.1)] text-[#16a34a]">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#f3f4f6] text-[#6b7280]">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/cooperatives/${l.cooperativeId}/levies/${l.id}`,
                            )
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
