import {
  type ClubMemberRole,
  type ClubMemberRoleCreateRequest,
  type ClubMemberRoleUpdateRequest,
} from "../model/clubMemberRole";

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
