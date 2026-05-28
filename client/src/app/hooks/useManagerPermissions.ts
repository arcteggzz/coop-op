import { useAuth } from "../context/AuthContext";

export function useManagerPermissions() {
  const { cooperatives, activeCooperativeId } = useAuth();
  const active = cooperatives.find((c) => c.cooperativeId === activeCooperativeId);

  return {
    role: active?.role ?? null,
    permissions: active?.permissions ?? [],
    can: (perm: string) =>
      active?.role === "RootManager" || active?.role === "SuperManager"
        ? true
        : (active?.permissions ?? []).includes(perm),
  };
}
