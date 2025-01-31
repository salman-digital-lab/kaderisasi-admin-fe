import { AdminUser } from "../model/adminuser";
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
  search: string;
};

export type GetAdminsUserReq = {
  id: string;
};

export type GetAdminUserResp = {
  message: string;
  data: AdminUser;
};

export type PostAdminUserReq = Partial<
  Omit<AdminUser, "id" | "createdAt" | "updatedAt">
>;

export type PostAdminUserResp = {
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

export type PutAdminUserPasswordReq = {
  id: string;
  data: {
    password: string;
  };
};

export type PutAdminUserPasswordResp = {
  message: string;
};
