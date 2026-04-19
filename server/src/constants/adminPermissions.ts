export const ADMIN_PERMISSION_KEYS = [
  'CoopAdminRead',
  'CoopAdminWrite',
  'CoopCooperativesRead',
  'CoopCooperativesWrite',
  'CoopManagersRead',
  'CoopManagersWrite',
  'CoopMembersRead',
  'CoopMembersWrite',
  'CoopLoansRead',
  'CoopLoansWrite',
  'CoopDuesRead',
  'CoopDuesWrite',
  'CoopAjoManagementRead',
  'CoopAjoManagementWrite',
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[number];

export type AdminRole = 'RootAdmin' | 'SuperAdmin' | 'Admin';
