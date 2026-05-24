import AdminLayout from "../../components/AdminLayout";

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <AdminLayout>
      <div className="font-['Albert_Sans',sans-serif] p-8">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#101828]">{title}</h1>
        </div>
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-10 text-center">
          <div className="text-[40px] mb-4">🚧</div>
          <h2 className="text-[18px] font-semibold text-[#101828] mb-2">
            Coming soon
          </h2>
          <p className="text-[14px] text-[#6b7280]">
            This section is under development.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
