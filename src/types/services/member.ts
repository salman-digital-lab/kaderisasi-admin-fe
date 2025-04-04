import { Member } from "../model/members";
import { Pagination } from "./base";

export type getProfilesResp = {
  message: string;
  data: {
    meta: Pagination;
    data: Member[];
  };
};

export type getProfilesReq = {
  per_page: string;
  page: string;
  search?: string;
  badge?: string;
  email?: string;
};

export type getProfileResp = {
  message: string;
  data: {
    profile: Member[];
  };
};

export type putProfileReq = {
  data: Partial<
    Omit<Member, "id" | "user_id" | "created_at" | "updated_at" | "badges">
  > & {
    badges: string;
  };
};

export type putProfileResp = {
  message: string;
  data: Member;
};

export type putProfileAuthReq = {
  email?: string;
  password?: string;
};

export type putProfileAuthResp = {
  message: string;
  data: { email?: string; password?: string };
};
