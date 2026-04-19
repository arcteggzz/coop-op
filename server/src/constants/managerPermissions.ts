export const MANAGER_PERMISSION_KEYS = [
  "ManagementMembersRead",
  "ManagementMembersWrite",
  "ManagementLoansRead",
  "ManagementLoansWrite",
  "ManagementDuesRead",
  "ManagementDuesWrite",
  "ManagementAjoManagementRead",
  "ManagementAjoManagementWrite",
  "ManagementReportsRead",
  "ManagementReportsWrite",
] as const;

export type ManagerPermissionKey = (typeof MANAGER_PERMISSION_KEYS)[number];

export type ManagerRole = "RootManager" | "SuperManager" | "Support";
