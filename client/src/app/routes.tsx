import { createBrowserRouter } from "react-router";
import PortalSelection from "./pages/PortalSelection";
import ManagerLoginStub from "./pages/manager/ManagerLoginStub";
import MemberLoginStub from "./pages/member/MemberLoginStub";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminChangePassword from "./pages/admin/AdminChangePassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCooperatives from "./pages/admin/AdminCooperatives";
import AdminCooperativeDetail from "./pages/admin/AdminCooperativeDetail";
import AdminManagement from "./pages/admin/AdminManagement";
import PlaceholderPage from "./pages/admin/PlaceholderPage";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  // Public
  { path: "/", Component: PortalSelection },
  { path: "/admin/login", Component: AdminLogin },
  { path: "/admin/change-password", Component: AdminChangePassword },
  { path: "/manager/login", Component: ManagerLoginStub },
  { path: "/member/login", Component: MemberLoginStub },

  // Protected admin routes
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute userType="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/cooperatives",
    element: (
      <ProtectedRoute userType="admin">
        <AdminCooperatives />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/cooperatives/:cooperativeId",
    element: (
      <ProtectedRoute userType="admin">
        <AdminCooperativeDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/cooperatives/:cooperativeId/:tab",
    element: (
      <ProtectedRoute userType="admin">
        <AdminCooperativeDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/admin-management",
    element: (
      <ProtectedRoute userType="admin">
        <AdminManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/loans",
    element: (
      <ProtectedRoute userType="admin">
        <PlaceholderPage title="Loans" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/dues",
    element: (
      <ProtectedRoute userType="admin">
        <PlaceholderPage title="Dues" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <ProtectedRoute userType="admin">
        <PlaceholderPage title="Settings" />
      </ProtectedRoute>
    ),
  },
]);
