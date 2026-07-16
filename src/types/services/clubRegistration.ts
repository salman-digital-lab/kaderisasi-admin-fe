import type { ClubRegistration } from "../model/clubRegistration";
import type { Pagination } from "./base";

export type getClubRegistrationsReq = {
  page: string;
  limit: string;
  status?: string;
  search?: string;
};

export type getClubRegistrationsResp = {
  message: string;
  data: {
    meta: Pagination;
    data: ClubRegistration[];
  };
};

export type getClubRegistrationResp = {
  message: string;
  data: ClubRegistration;
};

export type postClubRegistrationReq = {
  member_id: number;
  additional_data?: Record<string, unknown>;
};

export type postClubRegistrationResp = {
  message: string;
  data: ClubRegistration;
};

export type putClubRegistrationReq = {
  status: "PENDING" | "APPROVED" | "REJECTED";
  additional_data?: Record<string, unknown>;
};

export type putClubRegistrationResp = {
  message: string;
  data: ClubRegistration;
};

export type putClubRegistrationsBulkReq = {
  registrations: Array<{
    id: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    additional_data?: Record<string, unknown>;
  }>;
};

export type putClubRegistrationsBulkResp = {
  message: string;
  data: ClubRegistration[];
};

export type deleteClubRegistrationResp = {
  message: string;
};

export type putClubRegistrationInfoReq = {
  registration_info: string;
};

export type putClubRegistrationInfoResp = {
  message: string;
  data: {
    registration_info: {
      registration_info: string;
    };
  };
};
