export const MANAGER_PERMISSION_KEYS = [
  "ManagementAdminRead",
  "ManagementAdminWrite",
  "ManagementMembersRead",
  "ManagementMembersWrite",
  "ManagementLoansRead",
  "ManagementLoansWrite",
  "ManagementDuesRead",
  "ManagementDuesWrite",
  "ManagementLeviesRead",
  "ManagementLeviesWrite",
  "ManagementSavingsRead",
  "ManagementSavingsWrite",
  "ManagementAjoManagementRead",
  "ManagementAjoManagementWrite",
  "ManagementReportsRead",
  "ManagementReportsWrite",
] as const;

export type ManagerPermissionKey = (typeof MANAGER_PERMISSION_KEYS)[number];

export type ManagerRole = "RootManager" | "SuperManager" | "Support";
