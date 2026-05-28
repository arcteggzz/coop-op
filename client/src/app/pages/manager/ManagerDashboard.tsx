import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Users, UserCog, Wallet, X } from "lucide-react";
import ManagerLayout from "../../components/ManagerLayout";
import { useAuth } from "../../context/AuthContext";
import {
  useCooperativeSummary,
  useCooperativeWallets,
  useCreateCooperativeWallet,
} from "../../hooks/useManagerDashboard";
import {
  getManagerCooperativeWalletBalance,
  type CooperativeWallet,
} from "../../api/managerDashboard.api";

const MAX_WALLETS = parseInt(
  import.meta.env.VITE_MAX_COOPERATIVE_WALLETS ?? "5",
  10,
);

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ cooperativeId }: { cooperativeId: string }) {
  const { data: summary, isLoading } = useCooperativeSummary(cooperativeId);

  const cards = [
    {
      label: "Total Members",
      value: isLoading ? null : summary?.memberCount ?? 0,
      icon: Users,
      comingSoon: false,
    },
    {
      label: "Total Managers",
      value: isLoading ? null : summary?.managerCount ?? 0,
      icon: UserCog,
      comingSoon: false,
    },
    {
      label: "Cooperative Wallets",
      value: isLoading ? null : summary?.walletCount ?? 0,
      icon: Wallet,
      comingSoon: false,
    },
    {
      label: "Active Loans",
      value: isLoading ? null : summary?.loansCount ?? 0,
      icon: null,
      comingSoon: true,
    },
    {
      label: "Dues Collected",
      value: isLoading
        ? null
        : `₦${(summary?.duesCollected ?? 0).toLocaleString("en-NG")}`,
      icon: null,
      comingSoon: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(({ label, value, icon: Icon, comingSoon }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-[#e5e7eb] p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Albert_Sans',sans-serif] text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide leading-tight">
              {label}
            </p>
            {Icon && <Icon size={16} className="text-[#1BAFD6] shrink-0" />}
            {comingSoon && (
              <span className="text-[9px] font-semibold bg-[#f3f4f6] text-[#9ca3af] px-1.5 py-0.5 rounded shrink-0">
                Soon
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="h-7 bg-[#f3f4f6] rounded animate-pulse w-16" />
          ) : (
            <p className="font-['Albert_Sans',sans-serif] font-bold text-[22px] text-[#101828]">
              {value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Cooperative Wallet Card ──────────────────────────────────────────────────

function CoopWalletCard({
  wallet,
  cooperativeId,
}: {
  wallet: CooperativeWallet;
  cooperativeId: string;
}) {
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
    setLoadingBalance(true);
    try {
      const result = await getManagerCooperativeWalletBalance(
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
          background: "linear-gradient(135deg, #1BAFD6 0%, #0D8FAF 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="font-['Albert_Sans',sans-serif] text-[12px] font-medium opacity-80">
            {wallet.walletName}
          </p>
          <button
            onClick={handleEyeClick}
            className="p-1.5 bg-white/20 rounded-[8px] hover:bg-white/30 transition-colors cursor-pointer"
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
            <span className="font-semibold">{wallet.accountNumber}</span>
          </p>
          <p>
            <span className="opacity-75">Bank: </span>
            <span className="font-semibold">{wallet.bankName}</span>
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setShowTopUp(true)}
            className="text-[11px] font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-[8px] px-3 py-1.5 transition-colors cursor-pointer"
          >
            + Top Up
          </button>
          <p className="text-[10px] text-white/50">Powered by Embedly</p>
        </div>
      </div>

      {showTopUp && (
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
  wallet: CooperativeWallet;
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
        <div className="bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-4 space-y-2">
          <div className="flex justify-between">
            <span className="font-['Albert_Sans',sans-serif] text-[12px] text-[#6b7280]">
              Wallet Name
            </span>
            <span className="font-['Albert_Sans',sans-serif] text-[13px] font-bold text-[#101828]">
              {wallet.walletName}
            </span>
          </div>
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
        </div>
        <p className="font-['Albert_Sans',sans-serif] text-[11px] text-[#6b7280] text-center mt-3">
          Transfer to the account above from any bank to top up this wallet.
        </p>
      </div>
    </div>
  );
}

// ─── Add Wallet Modal ─────────────────────────────────────────────────────────

function AddWalletModal({
  cooperativeId,
  onClose,
}: {
  cooperativeId: string;
  onClose: () => void;
}) {
  const [walletName, setWalletName] = useState("");
  const mutation = useCreateCooperativeWallet(cooperativeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(walletName.trim(), {
      onSuccess: () => {
        toast.success(
          "Cooperative wallet will be created in the background. Refresh in a few minutes.",
          { duration: 6000 },
        );
        onClose();
      },
      onError: (err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to create wallet";
        toast.error(msg);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 font-['Albert_Sans',sans-serif]">
        <h2 className="text-[18px] font-semibold text-[#101828] mb-1">
          Add Cooperative Wallet
        </h2>
        <p className="text-[13px] text-[#6b7280] mb-6">
          Enter a name for the new wallet.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Wallet Name
            </label>
            <input
              type="text"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              placeholder="e.g. Main Wallet, Savings Wallet"
              required
              className="w-full border border-[#e5e7eb] rounded-[10px] px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#1BAFD6] placeholder:text-[#99a1af]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="flex-1 cursor-pointer border border-[#e5e7eb] rounded-[10px] py-2.5 text-[14px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !walletName.trim()}
              className="flex-1 cursor-pointer py-2.5 rounded-[10px] text-[14px] font-semibold text-white bg-gradient-to-r from-[#1BAFD6] to-[#0D8FAF] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {mutation.isPending ? "Creating..." : "Create Wallet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Wallets Section ──────────────────────────────────────────────────────────

function WalletsSection({ cooperativeId }: { cooperativeId: string }) {
  const { data: wallets, isLoading } = useCooperativeWallets(cooperativeId);
  const [showAddWallet, setShowAddWallet] = useState(false);

  const atMax = (wallets?.length ?? 0) >= MAX_WALLETS;

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="font-['Albert_Sans',sans-serif] text-[16px] font-semibold text-[#101828]">
          Cooperative Wallets
        </p>
        <button
          onClick={() => setShowAddWallet(true)}
          disabled={atMax || isLoading}
          title={
            atMax ? `Maximum of ${MAX_WALLETS} wallets reached` : undefined
          }
          className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white bg-gradient-to-r from-[#1BAFD6] to-[#0D8FAF] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add Wallet
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5 animate-pulse"
              style={{
                background:
                  "linear-gradient(135deg, #1BAFD6 0%, #0D8FAF 100%)",
                opacity: 0.4,
              }}
            >
              <div className="h-4 bg-white/30 rounded w-32 mb-4" />
              <div className="h-8 bg-white/30 rounded w-40 mb-3" />
              <div className="h-3 bg-white/30 rounded w-44 mb-1" />
              <div className="h-3 bg-white/30 rounded w-32" />
            </div>
          ))}
        </div>
      ) : !wallets || wallets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 text-center">
          <p className="font-['Albert_Sans',sans-serif] text-[14px] text-[#6b7280]">
            No wallets yet. Add one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((wallet) => (
            <CoopWalletCard
              key={wallet.id}
              wallet={wallet}
              cooperativeId={cooperativeId}
            />
          ))}
        </div>
      )}

      {showAddWallet && (
        <AddWalletModal
          cooperativeId={cooperativeId}
          onClose={() => setShowAddWallet(false)}
        />
      )}
    </>
  );
}

// ─── Coming Soon Section ──────────────────────────────────────────────────────

function ComingSoonSection({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="font-['Albert_Sans',sans-serif] text-[16px] font-semibold text-[#101828]">
          {title}
        </p>
        <span className="text-[10px] font-semibold bg-[#f3f4f6] text-[#9ca3af] px-2 py-1 rounded">
          Coming Soon
        </span>
      </div>
      <p className="font-['Albert_Sans',sans-serif] text-[13px] text-[#6b7280]">
        🚧 This section is under construction.
      </p>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const { activeCooperativeId } = useAuth();
  const cooperativeId = activeCooperativeId ?? "";

  return (
    <ManagerLayout>
      <div className="font-['Albert_Sans',sans-serif] p-6 space-y-8">
        {/* Section 1: Summary */}
        <section>
          <p className="text-[16px] font-semibold text-[#101828] mb-3">
            Overview
          </p>
          <SummaryCards cooperativeId={cooperativeId} />
        </section>

        {/* Section 2: Wallets */}
        <section>
          <WalletsSection cooperativeId={cooperativeId} />
        </section>

        {/* Section 3: Dues & Levies */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ComingSoonSection title="Dues" />
          <ComingSoonSection title="Levies" />
        </section>

        {/* Section 4: Savings */}
        <section>
          <ComingSoonSection title="Savings Summary" />
        </section>

        {/* Section 5: Loans */}
        <section>
          <ComingSoonSection title="Loans" />
        </section>
      </div>
    </ManagerLayout>
  );
}
