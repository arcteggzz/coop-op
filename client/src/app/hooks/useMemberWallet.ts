import { useQuery } from "@tanstack/react-query";
import {
  getMemberWallet,
  getMemberWalletTransactions,
} from "../api/memberDashboard.api";

export function useMemberWallet(cooperativeId: string) {
  return useQuery({
    queryKey: ["member-wallet", cooperativeId],
    queryFn: () => getMemberWallet(cooperativeId),
    enabled: !!cooperativeId,
  });
}

export function useMemberWalletTransactions(cooperativeId: string) {
  return useQuery({
    queryKey: ["member-wallet-transactions", cooperativeId],
    queryFn: () => getMemberWalletTransactions(cooperativeId),
    enabled: !!cooperativeId,
  });
}
