import { ArrowRight, Info, X } from "lucide-react";

interface DuesHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  primaryColor?: string;
}

const steps = [
  {
    title: "You set it up once",
    description:
      "Define the name, amount, collection cycle, and which treasury wallet receives the funds. You can also set the start date and priority if you run multiple dues.",
  },
  {
    title: "Members fund and pay from the wallet",
    description:
      "Members credit their wallet and dues are collected from it — no cash, no manual collection.",
  },
  {
    title: "You track who has paid",
    description:
      "Your dashboard shows paid vs unpaid in real time. You can send reminders, override for cash payments, or skip a cycle any time.",
  },
];

export default function DuesHelperModal({
  isOpen,
  onClose,
  onProceed,
  primaryColor = "#0D8FAF",
}: DuesHelperModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 relative font-['Albert_Sans',sans-serif]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9ca3af] hover:text-[#374151] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <h2 className="text-[20px] font-bold text-[#101828] mb-2">
          How dues work
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6 leading-relaxed">
          Dues are recurring payments collected from all members on a set
          schedule — monthly, weekly, or custom.
        </p>

        <div className="flex flex-col gap-5 mb-6">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3.5">
              <div className="w-7 h-7 rounded-full bg-[#fef3c7] flex items-center justify-center text-[12px] font-bold text-[#d97706] shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#101828]">
                  {step.title}
                </p>
                <p className="text-[13px] text-[#6b7280] mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-4 mb-6 flex gap-2.5">
          <Info size={15} className="text-[#d97706] shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#92400e] leading-relaxed">
            <span className="font-semibold">Running multiple dues?</span> You
            can create more than one — for example, monthly dues and a
            development fund running at the same time. Each has its own tracking
            and target wallet.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-[13px] text-[#6b7280] hover:text-[#374151] transition-colors cursor-pointer"
          >
            Maybe later
          </button>
          <button
            onClick={onProceed}
            className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            Set up dues <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
