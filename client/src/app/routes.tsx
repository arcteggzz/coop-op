import { createBrowserRouter } from "react-router";
import PortalSelection from "./pages/PortalSelection";

// Admin
import AdminLogin from "./pages/admin/AdminLogin";
import AdminChangePassword from "./pages/admin/AdminChangePassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCooperatives from "./pages/admin/AdminCooperatives";
import AdminCooperativeDetail from "./pages/admin/AdminCooperativeDetail";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminDuesPage from "./pages/admin/AdminDuesPage";
import AdminLeviesPage from "./pages/admin/AdminLeviesPage";
import PlaceholderPage from "./pages/admin/PlaceholderPage";

// Manager
import ManagerLogin from "./pages/manager/ManagerLogin";
import ManagerChangePassword from "./pages/manager/ManagerChangePassword";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerManagers from "./pages/manager/ManagerManagers";
import ManagerMembers from "./pages/manager/ManagerMembers";
import ManagerDues from "./pages/manager/ManagerDues";
import ManagerDueScheduleDetail from "./pages/manager/ManagerDueScheduleDetail";
import ManagerLevies from "./pages/manager/ManagerLevies";
import ManagerLevyDetail from "./pages/manager/ManagerLevyDetail";
import ManagerPlaceholderPage from "./pages/manager/ManagerPlaceholderPage";

// Member
import MemberLogin from "./pages/member/MemberLogin";
import MemberChangePassword from "./pages/member/MemberChangePassword";
import MemberDashboard from "./pages/member/MemberDashboard";
import MemberTransactions from "./pages/member/MemberTransactions";
import MemberDues from "./pages/member/MemberDues";
import MemberPlaceholderPage from "./pages/member/MemberPlaceholderPage";

import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  // Public
  { path: "/", Component: PortalSelection },

  // Admin public
  { path: "/admin/login", Component: AdminLogin },
  { path: "/admin/change-password", Component: AdminChangePassword },

  // Manager public
  { path: "/manager/login", Component: ManagerLogin },
  { path: "/manager/change-password", Component: ManagerChangePassword },

  // Member public
  { path: "/member/login", Component: MemberLogin },
  { path: "/member/change-password", Component: MemberChangePassword },

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
    path: "/admin/cooperatives/:cooperativeId/dues/:scheduleId",
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
        <AdminDuesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/levies",
    element: (
      <ProtectedRoute userType="admin">
        <AdminLeviesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/cooperatives/:cooperativeId/levies/:levyId",
    element: (
      <ProtectedRoute userType="admin">
        <AdminCooperativeDetail />
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

  // Protected manager routes
  {
    path: "/manager/dashboard",
    element: (
      <ProtectedRoute userType="manager">
        <ManagerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/managers",
    element: (
      <ProtectedRoute userType="manager">
        <ManagerManagers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/members",
    element: (
      <ProtectedRoute userType="manager">
        <ManagerMembers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/loans",
    element: (
      <ProtectedRoute userType="manager">
        <ManagerPlaceholderPage title="Loans" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/dues",
    element: (
      <ProtectedRoute userType="manager">
        <ManagerDues />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/dues/:scheduleId",
    element: (
      <ProtectedRoute userType="manager">
        <ManagerDueScheduleDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/levies",
    element: (
      <ProtectedRoute userType="manager">
        <ManagerLevies />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/levies/:levyId",
    element: (
      <ProtectedRoute userType="manager">
        <ManagerLevyDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/settings",
    element: (
      <ProtectedRoute userType="manager">
        <ManagerPlaceholderPage title="Settings" />
      </ProtectedRoute>
    ),
  },

  // Protected member routes
  {
    path: "/member/dashboard",
    element: (
      <ProtectedRoute userType="member">
        <MemberDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/member/transactions",
    element: (
      <ProtectedRoute userType="member">
        <MemberTransactions />
      </ProtectedRoute>
    ),
  },
  {
    path: "/member/dues",
    element: (
      <ProtectedRoute userType="member">
        <MemberDues />
      </ProtectedRoute>
    ),
  },
  {
    path: "/member/loans",
    element: (
      <ProtectedRoute userType="member">
        <MemberPlaceholderPage title="Loans" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/member/savings",
    element: (
      <ProtectedRoute userType="member">
        <MemberPlaceholderPage title="Savings" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/member/settings",
    element: (
      <ProtectedRoute userType="member">
        <MemberPlaceholderPage title="Settings" />
      </ProtectedRoute>
    ),
  },
]);
