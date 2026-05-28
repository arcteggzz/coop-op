import MemberLayout from "../../components/MemberLayout";

interface MemberPlaceholderPageProps {
  title: string;
}

export default function MemberPlaceholderPage({ title }: MemberPlaceholderPageProps) {
  return (
    <MemberLayout>
      <div className="font-['Albert_Sans',sans-serif] p-4">
        <div className="mb-4">
          <h1 className="text-[20px] font-bold text-[#101828]">{title}</h1>
        </div>
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 text-center">
          <div className="text-[36px] mb-3">🚧</div>
          <h2 className="text-[16px] font-semibold text-[#101828] mb-1">Coming soon</h2>
          <p className="text-[13px] text-[#6b7280]">This section is under development.</p>
        </div>
      </div>
    </MemberLayout>
  );
}
