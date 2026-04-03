import { Activity, Registrant } from "../model/activity";
import { Member, PublicUser } from "../model/members";
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
  member_id?: string;
  education_institution?: string;
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

export type createMemberReq = {
  name: string;
  email?: string;
  password?: string;
  member_id?: string;
  gender?: string;
  personal_id?: string;
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  line?: string;
  birth_date?: string;
  province_id?: number;
  city_id?: number;
  country?: string;
};

export type createMemberResp = {
  message: string;
  data: { user: PublicUser; profile: Member };
};

export type generateAccountReq = {
  email: string;
  password: string;
};

export type generateAccountResp = {
  message: string;
  data: { email: string };
};

export type putRegionalAssignmentReq = {
  alumni_regional_assignment: string[];
};

export type putRegionalAssignmentResp = {
  message: string;
  data: { alumni_regional_assignment: string[] };
};

export type getActivityByUserIdResp = {
  message: string;
  data: (Registrant & { activity: Activity })[];
};
