import { useQuery } from "@tanstack/react-query";
import * as api from "../api/memberDashboard.api";

export function useMemberDashboard(cooperativeId: string) {
  return useQuery({
    queryKey: ["member-dashboard", cooperativeId],
    queryFn: () => api.getMemberDashboard(cooperativeId),
    enabled: !!cooperativeId,
  });
}
