import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import MemberLayout from "../../components/MemberLayout";
import { useAuth } from "../../context/AuthContext";
import { useMemberWallet } from "../../hooks/useMemberWallet";
import { getMemberWalletTransactions, type WalletTransaction } from "../../api/memberDashboard.api";
import { useQuery } from "@tanstack/react-query";

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.debitCreditIndicator === "C";
  return (
    <div className="flex items-start justify-between py-3.5 border-b border-[#f3f4f6] last:border-0">
      <div className="min-w-0 flex-1 mr-3">
        <p className="font-['Albert_Sans',sans-serif] text-[13px] font-medium text-[#101828] truncate">
          {tx.remarks || "Transaction"}
        </p>
        {tx.beneficiaryAccountName && (
          <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6b7280] truncate">
            {isCredit ? "From" : "To"}: {isCredit ? (tx.originatorAccountName || tx.beneficiaryAccountName) : tx.beneficiaryAccountName}
          </p>
        )}
        <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#9ca3af] mt-0.5">
          {new Date(tx.dateCreated).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p
          className={`font-['Albert_Sans',sans-serif] text-[14px] font-bold ${
            isCredit ? "text-[#16a34a]" : "text-[#dc2626]"
          }`}
        >
          {isCredit ? "+" : "-"}₦{tx.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </p>
        <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6b7280]">
          Bal: ₦{tx.balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}

export default function MemberTransactions() {
  const navigate = useNavigate();
  const { activeCooperativeId } = useAuth();
  const cooperativeId = activeCooperativeId ?? "";

  const { data: wallet } = useMemberWallet(cooperativeId);

  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];
  const [from, setFrom] = useState(threeMonthsAgo);
  const [to, setTo] = useState(today);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["member-wallet-transactions-all", cooperativeId, from, to],
    queryFn: () => getMemberWalletTransactions(cooperativeId),
    enabled: !!cooperativeId,
  });

  return (
    <MemberLayout>
      <div className="font-['Albert_Sans',sans-serif] p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/member/dashboard")}
            className="p-2 rounded-[8px] bg-[#f3f4f6] hover:bg-[#e5e7eb] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} className="text-[#374151]" />
          </button>
          <div>
            <p className="font-bold text-[16px] text-[#101828]">Transactions</p>
            {wallet && (
              <p className="text-[11px] text-[#6b7280]">
                {wallet.accountNumber} · {wallet.bankName}
              </p>
            )}
          </div>
        </div>

        {/* Date filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-[#6b7280] block mb-1">From</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-[#d1d5db] rounded-[8px] px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-[#7F56D9]"
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-[#6b7280] block mb-1">To</label>
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-[#d1d5db] rounded-[8px] px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-[#7F56D9]"
            />
          </div>
        </div>

        {/* Transaction list */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[#7F56D9]" />
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <p className="text-[13px] text-[#6b7280] text-center py-8">
              No transactions found for this period.
            </p>
          ) : (
            <div>
              <p className="text-[11px] text-[#6b7280] mb-3">
                {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
              </p>
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MemberLayout>
  );
}
