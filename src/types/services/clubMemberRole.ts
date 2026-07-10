import {
  ClubMemberRole,
  ClubMemberRoleCreateRequest,
  ClubMemberRoleUpdateRequest,
} from "../model/clubMemberRole";

export type getClubMemberRolesResp = {
  message: string;
  data: ClubMemberRole[];
};

export type getClubMemberRoleSuggestionsResp = {
  message: string;
  data: string[];
};

export type postClubMemberRoleReq = ClubMemberRoleCreateRequest;

export type postClubMemberRoleResp = {
  message: string;
  data: ClubMemberRole;
};

export type putClubMemberRoleReq = ClubMemberRoleUpdateRequest;

export type putClubMemberRoleResp = {
  message: string;
  data: ClubMemberRole;
};

export type deleteClubMemberRoleResp = {
  message: string;
};
