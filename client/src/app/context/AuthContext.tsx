import { createContext, useContext, useState, ReactNode } from "react";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: "RootAdmin" | "SuperAdmin" | "Admin";
  isActive: number;
  defaultPasswordChanged: number;
  dateInvited: string;
}

export interface ManagerUser {
  id: string;
  fullName: string;
  email: string;
}

export interface MemberUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CooperativeRef {
  cooperativeId: string;
  cooperativeName: string;
  isDefault: boolean;
  role?: string;
  permissions?: string[];
}

interface AuthContextValue {
  token: string | null;
  user: AdminUser | ManagerUser | MemberUser | null;
  userType: "admin" | "manager" | "member" | null;
  cooperatives: CooperativeRef[];
  activeCooperativeId: string | null;
  isAuthenticated: boolean;
  login(
    token: string,
    user: AdminUser | ManagerUser | MemberUser,
    type: "admin" | "manager" | "member",
    cooperatives?: CooperativeRef[],
  ): void;
  logout(): void;
  setActiveCooperative(id: string): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadFromStorage(): Pick<
  AuthContextValue,
  "token" | "user" | "userType" | "cooperatives" | "activeCooperativeId"
> {
  try {
    const token = localStorage.getItem("coop_token");
    const user = JSON.parse(localStorage.getItem("coop_user") ?? "null");
    const userType = (localStorage.getItem("coop_user_type") ?? null) as
      | "admin"
      | "manager"
      | "member"
      | null;
    const cooperatives = JSON.parse(
      localStorage.getItem("coop_cooperatives") ?? "[]",
    ) as CooperativeRef[];
    const activeCooperativeId =
      localStorage.getItem("coop_active_coop_id") ?? null;
    return { token, user, userType, cooperatives, activeCooperativeId };
  } catch {
    return {
      token: null,
      user: null,
      userType: null,
      cooperatives: [],
      activeCooperativeId: null,
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage();
  const [token, setToken] = useState<string | null>(stored.token);
  const [user, setUser] = useState<AdminUser | ManagerUser | MemberUser | null>(
    stored.user,
  );
  const [userType, setUserType] = useState<
    "admin" | "manager" | "member" | null
  >(stored.userType);
  const [cooperatives, setCooperatives] = useState<CooperativeRef[]>(
    stored.cooperatives,
  );
  const [activeCooperativeId, setActiveCooperativeIdState] = useState<
    string | null
  >(stored.activeCooperativeId);

  const isAuthenticated =
    user !== null && localStorage.getItem("coop_token") !== null;

  const login = (
    newToken: string,
    newUser: AdminUser | ManagerUser | MemberUser,
    type: "admin" | "manager" | "member",
    coops?: CooperativeRef[],
  ) => {
    localStorage.setItem("coop_token", newToken);
    localStorage.setItem("coop_user", JSON.stringify(newUser));
    localStorage.setItem("coop_user_type", type);

    const coopList = coops ?? [];
    localStorage.setItem("coop_cooperatives", JSON.stringify(coopList));

    const defaultCoop = coopList.find((c) => c.isDefault);
    const activeCoop =
      defaultCoop?.cooperativeId ?? coopList[0]?.cooperativeId ?? null;
    if (activeCoop) localStorage.setItem("coop_active_coop_id", activeCoop);

    setToken(newToken);
    setUser(newUser);
    setUserType(type);
    setCooperatives(coopList);
    setActiveCooperativeIdState(activeCoop);
  };

  const logout = () => {
    localStorage.removeItem("coop_token");
    localStorage.removeItem("coop_user");
    localStorage.removeItem("coop_user_type");
    localStorage.removeItem("coop_cooperatives");
    localStorage.removeItem("coop_active_coop_id");
    setToken(null);
    setUser(null);
    setUserType(null);
    setCooperatives([]);
    setActiveCooperativeIdState(null);
  };

  const setActiveCooperative = (id: string) => {
    localStorage.setItem("coop_active_coop_id", id);
    setActiveCooperativeIdState(id);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        userType,
        cooperatives,
        activeCooperativeId,
        isAuthenticated,
        login,
        logout,
        setActiveCooperative,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
