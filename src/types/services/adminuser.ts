import { AdminUser, Permission, Role } from "../model/adminuser";
import { Pagination } from "./base";

export type GetAdminUsersResp = {
  message: string;
  data: {
    meta: Pagination;
    data: AdminUser[];
  };
};

export type GetAdminUsersReq = {
  per_page: string;
  page: string;
};

export type GetRolesResp = {
  message: string;
  data: {
    meta: Pagination;
    data: Role[];
  };
};

export type GetRolesReq = {
  per_page: string;
  page: string;
};

export type GetPermissionsResp = {
  message: string;
  data: {
    meta: Pagination;
    data: Permission[];
  };
};

export type GetPermissionsReq = {
  per_page: string;
  page: string;
};

export type GetAdminsUserReq = {
  id: string;
};

export type GetAdminUserResp = {
  message: string;
  data: AdminUser;
};

export type PutAdminUserReq = {
  id: string;
  data: Partial<AdminUser>;
};

export type PutAdminUserResp = {
  message: string;
  data: AdminUser;
};
