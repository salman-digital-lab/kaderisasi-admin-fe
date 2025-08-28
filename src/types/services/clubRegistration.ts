import { ClubRegistration } from "../model/clubRegistration";
import { Pagination } from "./base";

export type getClubRegistrationsReq = {
  page: string;
  limit: string;
  status?: string;
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
  additional_data?: Record<string, any>;
};

export type postClubRegistrationResp = {
  message: string;
  data: ClubRegistration;
};

export type putClubRegistrationReq = {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  additional_data?: Record<string, any>;
};

export type putClubRegistrationResp = {
  message: string;
  data: ClubRegistration;
};

export type putClubRegistrationsBulkReq = {
  registrations: Array<{
    id: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    additional_data?: Record<string, any>;
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
  after_registration_info: string;
};

export type putClubRegistrationInfoResp = {
  message: string;
  data: {
    registration_info: {
      registration_info: string;
      after_registration_info: string;
    };
  };
};
