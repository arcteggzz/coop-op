import AdminLayout from "../../components/AdminLayout";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="font-['Albert_Sans',sans-serif] p-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#101828]">Dashboard</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">
            Platform overview and analytics
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-10 text-center">
          <div className="text-[40px] mb-4">🚧</div>
          <h2 className="text-[18px] font-semibold text-[#101828] mb-2">
            More features coming soon
          </h2>
          <p className="text-[14px] text-[#6b7280] max-w-sm mx-auto">
            Dashboard analytics and summaries are being built. Check back soon.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
