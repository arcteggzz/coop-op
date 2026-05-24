import * as membersService from './members.service';

export async function inviteMember(
  dto: { firstName: string; lastName: string; email: string },
  cooperativeId: string,
  callingManagerId: string,
) {
  return membersService.inviteMember(dto, cooperativeId, callingManagerId, 'Manager');
}

export async function listMembers(
  cooperativeId: string,
  query: { page: number; pageSize: number },
) {
  return membersService.listMembers(cooperativeId, query);
}

export async function getMember(cooperativeId: string, memberId: string) {
  return membersService.getMember(cooperativeId, memberId);
}

export async function revokeMember(cooperativeId: string, memberId: string) {
  return membersService.revokeMember(cooperativeId, memberId);
}
