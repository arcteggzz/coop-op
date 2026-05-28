import { useState } from "react";
import { useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowUpFromLine,
  CreditCard,
  FileSpreadsheet,
  HandCoins,
  ArrowRight,
  X,
} from "lucide-react";
import MemberLayout from "../../components/MemberLayout";
import { useAuth } from "../../context/AuthContext";
import {
  useMemberWallet,
  useMemberWalletTransactions,
} from "../../hooks/useMemberWallet";
import {
  getMemberWalletBalance,
  exportMemberStatement,
  type WalletTransaction,
} from "../../api/memberDashboard.api";

// ─── Wallet Card ──────────────────────────────────────────────────────────────

function WalletCard({ cooperativeId }: { cooperativeId: string }) {
  const { data: wallet, isLoading } = useMemberWallet(cooperativeId);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);

  const handleEyeClick = async () => {
    if (showBalance) {
      setShowBalance(false);
      return;
    }
    if (liveBalance !== null) {
      setShowBalance(true);
      return;
    }
    if (!wallet) return;
    setLoadingBalance(true);
    try {
      const result = await getMemberWalletBalance(
        cooperativeId,
        wallet.accountNumber,
      );
      setLiveBalance(result.availableBalance);
      setShowBalance(true);
    } catch {
      toast.error("Failed to fetch live balance.");
    } finally {
      setLoadingBalance(false);
    }
  };

  return (
    <>
      <div
        className="rounded-2xl p-5 text-white"
        style={{
          background: "linear-gradient(135deg, #7F56D9 0%, #6941C6 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="font-['Albert_Sans',sans-serif] text-[12px] font-medium opacity-80">
            {isLoading ? "Loading..." : (wallet?.walletName ?? "My Wallet")}
          </p>
          <button
            onClick={handleEyeClick}
            disabled={isLoading || !wallet}
            className="p-1.5 bg-white/20 rounded-[8px] hover:bg-white/30 transition-colors cursor-pointer disabled:opacity-40"
          >
            {loadingBalance ? (
              <Loader2 size={16} className="animate-spin" />
            ) : showBalance ? (
              <EyeOff size={16} />
            ) : (
              <Eye size={16} />
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-36 mb-3" />
            <div className="h-3 bg-white/20 rounded w-44 mb-1" />
            <div className="h-3 bg-white/20 rounded w-32" />
          </div>
        ) : (
          <>
            {showBalance && liveBalance !== null ? (
              <p className="font-['Albert_Sans',sans-serif] font-bold text-[28px] tracking-tight mb-3">
                ₦
                {liveBalance.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </p>
            ) : (
              <p className="font-['Albert_Sans',sans-serif] font-bold text-[28px] tracking-tight opacity-40 mb-3">
                ₦ ••••••
              </p>
            )}

            <div className="space-y-1 text-[12px] opacity-80">
              <p>
                <span className="opacity-75">Account: </span>
                <span className="font-semibold">
                  {wallet?.accountNumber ?? "—"}
                </span>
              </p>
              <p>
                <span className="opacity-75">Bank: </span>
                <span className="font-semibold">{wallet?.bankName ?? "—"}</span>
              </p>
            </div>
          </>
        )}

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setShowTopUp(true)}
            disabled={!wallet}
            className="text-[11px] font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-[8px] px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            + Top Up
          </button>
          <p className="text-[10px] text-white/50">Powered by Embedly</p>
        </div>
      </div>

      {showTopUp && wallet && (
        <TopUpModal wallet={wallet} onClose={() => setShowTopUp(false)} />
      )}
    </>
  );
}

// ─── Top Up Modal ─────────────────────────────────────────────────────────────

function TopUpModal({
  wallet,
  onClose,
}: {
  wallet: { walletName: string; accountNumber: string; bankName: string };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <p className="font-['Albert_Sans',sans-serif] font-bold text-[16px] text-[#101828]">
            Top Up Wallet
          </p>
          <button
            onClick={onClose}
            className="text-[#6b7280] hover:text-[#374151] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="p-3 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
            <QRCodeSVG
              value={wallet.accountNumber}
              size={160}
              fgColor="#7F56D9"
            />
          </div>
        </div>

        <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6b7280] text-center mb-3">
          Scan to get account number, or use the details below
        </p>

        <div className="bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-4 space-y-2">
          <div className="flex justify-between">
            <span className="font-['Albert_Sans',sans-serif] text-[12px] text-[#6b7280]">
              Account Number
            </span>
            <span className="font-['Albert_Sans',sans-serif] text-[13px] font-bold text-[#101828]">
              {wallet.accountNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-['Albert_Sans',sans-serif] text-[12px] text-[#6b7280]">
              Bank
            </span>
            <span className="font-['Albert_Sans',sans-serif] text-[13px] font-semibold text-[#374151]">
              {wallet.bankName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-['Albert_Sans',sans-serif] text-[12px] text-[#6b7280]">
              Account Name
            </span>
            <span className="font-['Albert_Sans',sans-serif] text-[13px] font-semibold text-[#374151]">
              {wallet.walletName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Statement Modal ──────────────────────────────────────────────────────────

function StatementModal({
  cooperativeId,
  accountNumber,
  onClose,
}: {
  cooperativeId: string;
  accountNumber: string;
  onClose: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [from, setFrom] = useState(threeMonthsAgo);
  const [to, setTo] = useState(today);
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [sendToEmail, setSendToEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (sendToEmail && !email.trim()) {
      toast.error("Please enter an email address.");
      return;
    }
    setLoading(true);
    try {
      const result = await exportMemberStatement({
        cooperativeId,
        accountNumber,
        from,
        to,
        format,
        email: sendToEmail ? email.trim() : undefined,
      });

      if (result instanceof Blob) {
        const url = URL.createObjectURL(result);
        const a = document.createElement("a");
        a.href = url;
        a.download = `statement_${from}_${to}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Statement downloaded.");
      } else {
        toast.success(`Statement sent to ${email}.`);
      }
      onClose();
    } catch {
      toast.error("Failed to export statement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <p className="font-['Albert_Sans',sans-serif] font-bold text-[16px] text-[#101828]">
            Export Statement
          </p>
          <button
            onClick={onClose}
            className="text-[#6b7280] hover:text-[#374151] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-['Albert_Sans',sans-serif] text-[12px] font-semibold text-[#374151] block mb-1">
              From
            </label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-[#d1d5db] rounded-[8px] px-3 py-2 text-[13px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#7F56D9]"
            />
          </div>
          <div>
            <label className="font-['Albert_Sans',sans-serif] text-[12px] font-semibold text-[#374151] block mb-1">
              To
            </label>
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-[#d1d5db] rounded-[8px] px-3 py-2 text-[13px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#7F56D9]"
            />
          </div>

          <div>
            <label className="font-['Albert_Sans',sans-serif] text-[12px] font-semibold text-[#374151] block mb-2">
              Format
            </label>
            <div className="flex gap-2">
              {(["csv", "pdf"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-[8px] text-[12px] font-['Albert_Sans',sans-serif] font-semibold border transition-colors cursor-pointer ${
                    format === f
                      ? "bg-[#7F56D9] text-white border-[#7F56D9]"
                      : "bg-white text-[#374151] border-[#d1d5db] hover:border-[#7F56D9]"
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendToEmail}
              onChange={(e) => setSendToEmail(e.target.checked)}
              className="accent-[#7F56D9] w-4 h-4 cursor-pointer"
            />
            <label
              htmlFor="sendEmail"
              className="font-['Albert_Sans',sans-serif] text-[13px] text-[#374151] cursor-pointer"
            >
              Send as email attachment
            </label>
          </div>

          {sendToEmail && (
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#d1d5db] rounded-[8px] px-3 py-2 text-[13px] font-['Albert_Sans',sans-serif] focus:outline-none focus:border-[#7F56D9]"
            />
          )}
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          className="mt-5 w-full bg-[#7F56D9] text-white py-2.5 rounded-[10px] font-['Albert_Sans',sans-serif] font-semibold text-[14px] hover:bg-[#6941C6] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Exporting..." : "Export"}
        </button>
      </div>
    </div>
  );
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────

function QuickActions({
  cooperativeId,
  wallet,
}: {
  cooperativeId: string;
  wallet:
    | { walletName: string; accountNumber: string; bankName: string }
    | undefined;
}) {
  const [showTopUp, setShowTopUp] = useState(false);
  const [showStatement, setShowStatement] = useState(false);

  const actions = [
    {
      label: "Top Up",
      icon: ArrowUpFromLine,
      action: () => {
        if (!wallet) {
          toast.error("Wallet not loaded yet.");
          return;
        }
        setShowTopUp(true);
      },
    },
    {
      label: "Pay Dues",
      icon: CreditCard,
      action: () => toast.info("Coming soon"),
    },
    {
      label: "Apply Loan",
      icon: HandCoins,
      action: () => toast.info("Coming soon"),
    },
    {
      label: "Statement",
      icon: FileSpreadsheet,
      action: () => {
        if (!wallet) {
          toast.error("Wallet not loaded yet.");
          return;
        }
        setShowStatement(true);
      },
    },
  ];

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4">
        <p className="font-['Albert_Sans',sans-serif] text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-4 gap-2">
          {actions.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#faf5ff] hover:bg-[#f3e8ff] border border-[#e9d7fe] transition-colors cursor-pointer"
            >
              <Icon size={18} className="text-[#7F56D9]" />
              <span className="font-['Albert_Sans',sans-serif] text-[10px] font-semibold text-[#7F56D9]">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {showTopUp && wallet && (
        <TopUpModal wallet={wallet} onClose={() => setShowTopUp(false)} />
      )}
      {showStatement && wallet && (
        <StatementModal
          cooperativeId={cooperativeId}
          accountNumber={wallet.accountNumber}
          onClose={() => setShowStatement(false)}
        />
      )}
    </>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.debitCreditIndicator === "C";
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#f3f4f6] last:border-0">
      <div className="min-w-0 flex-1 mr-2">
        <p className="font-['Albert_Sans',sans-serif] text-[13px] font-medium text-[#101828] truncate">
          {tx.remarks || "Transaction"}
        </p>
        <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6b7280]">
          {new Date(tx.dateCreated).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <p
        className={`font-['Albert_Sans',sans-serif] text-[13px] font-bold shrink-0 ${
          isCredit ? "text-[#16a34a]" : "text-[#dc2626]"
        }`}
      >
        {isCredit ? "+" : "-"}₦
        {tx.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

function SummaryActionTracker() {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4">
      <p className="font-['Albert_Sans',sans-serif] text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
        Following Actions
      </p>
      <div className="grid grid-cols-2 gap-3">
        {["Dues", "Loans"].map((label) => (
          <div
            key={label}
            className="bg-[#faf5ff] border border-[#e9d7fe] rounded-xl p-3 text-center"
          >
            <p className="font-['Albert_Sans',sans-serif] text-[12px] font-semibold text-[#7F56D9]">
              {label}
            </p>
            <p className="font-['Albert_Sans',sans-serif] text-[10px] text-[#6b7280] mt-0.5">
              Coming soon
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recent Activity ──────────────────────────────────────────────────────────
function RecentActivity({
  transactions,
  isLoading,
}: {
  transactions: WalletTransaction[] | undefined;
  isLoading: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-['Albert_Sans',sans-serif] text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">
          Recent Activity
        </p>
        <button
          onClick={() => navigate("/member/transactions")}
          className="flex items-center gap-1 font-['Albert_Sans',sans-serif] text-[11px] font-semibold text-[#7F56D9] hover:text-[#6941C6] cursor-pointer"
        >
          See All <ArrowRight size={12} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between py-2">
              <div className="space-y-1.5">
                <div className="h-3 bg-[#f3f4f6] rounded w-36" />
                <div className="h-2.5 bg-[#f3f4f6] rounded w-20" />
              </div>
              <div className="h-3 bg-[#f3f4f6] rounded w-16" />
            </div>
          ))}
        </div>
      ) : !transactions || transactions.length === 0 ? (
        <p className="font-['Albert_Sans',sans-serif] text-[12px] text-[#6b7280] text-center py-4">
          No recent transactions
        </p>
      ) : (
        <div>
          {transactions.slice(0, 5).map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function MemberDashboard() {
  const { activeCooperativeId } = useAuth();
  const cooperativeId = activeCooperativeId ?? "";

  const { data: wallet } = useMemberWallet(cooperativeId);
  const { data: transactions, isLoading: txLoading } =
    useMemberWalletTransactions(cooperativeId);

  return (
    <MemberLayout>
      <div className="font-['Albert_Sans',sans-serif] p-4 space-y-4">
        {/* Section 1: Wallet Card */}
        <WalletCard cooperativeId={cooperativeId} />

        {/* Section 2: Quick Actions */}
        <QuickActions cooperativeId={cooperativeId} wallet={wallet} />

        {/* Section 3: Summary Action Tracker */}
        <SummaryActionTracker />

        {/* Section 4: Recent Activity */}
        <RecentActivity transactions={transactions} isLoading={txLoading} />
      </div>
    </MemberLayout>
  );
}
