import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getManagerCooperativeSummary,
  getManagerCooperativeWallets,
  getManagerCooperativeWalletBalance,
  createManagerCooperativeWallet,
} from "../api/managerDashboard.api";

export function useCooperativeSummary(cooperativeId: string) {
  return useQuery({
    queryKey: ["coop-summary", cooperativeId],
    queryFn: () => getManagerCooperativeSummary(cooperativeId),
    enabled: !!cooperativeId,
  });
}

export function useCooperativeWallets(cooperativeId: string) {
  return useQuery({
    queryKey: ["coop-wallets", cooperativeId],
    queryFn: () => getManagerCooperativeWallets(cooperativeId),
    enabled: !!cooperativeId,
  });
}

export function useCooperativeWalletBalance(
  cooperativeId: string,
  accountNumber: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["coop-wallet-balance", accountNumber],
    queryFn: () =>
      getManagerCooperativeWalletBalance(cooperativeId, accountNumber),
    enabled: enabled && !!cooperativeId && !!accountNumber,
  });
}

export function useCreateCooperativeWallet(cooperativeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletName: string) =>
      createManagerCooperativeWallet(cooperativeId, walletName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coop-wallets", cooperativeId] });
      queryClient.invalidateQueries({ queryKey: ["coop-summary", cooperativeId] });
    },
  });
}
