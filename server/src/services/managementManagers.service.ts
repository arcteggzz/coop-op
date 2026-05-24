import * as managersService from './managers.service';

export async function inviteManager(
  dto: { fullName: string; email: string; role: string; permissions?: string[] },
  cooperativeId: string,
  callingManagerId: string,
) {
  return managersService.inviteManager(dto, cooperativeId, callingManagerId, 'Manager');
}

export async function listManagers(
  cooperativeId: string,
  query: { page: number; pageSize: number },
) {
  return managersService.listManagers(cooperativeId, query);
}

export async function getManager(cooperativeId: string, managerId: string) {
  return managersService.getManager(cooperativeId, managerId);
}

export async function updateManagerPermissions(
  cooperativeId: string,
  managerId: string,
  permissions: string[],
) {
  return managersService.updateManagerPermissions(cooperativeId, managerId, permissions);
}

export async function revokeManager(cooperativeId: string, managerId: string) {
  return managersService.revokeManager(cooperativeId, managerId);
}
