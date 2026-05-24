import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  userType: "admin" | "manager" | "member";
  children: ReactNode;
}

export default function ProtectedRoute({ userType, children }: ProtectedRouteProps) {
  const { isAuthenticated, userType: currentType } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (currentType !== userType) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
