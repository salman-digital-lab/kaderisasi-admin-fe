import { Pagination } from "./base";
import { RuangCurhatData } from "../model/ruangcurhat";
import { PROBLEM_STATUS_ENUM } from "../constants/ruangcurhat";
import { GENDER } from "../constants/profile";
export type GetRuangCurhatsResp = {
  message: string;
  data: {
    meta: Pagination;
    data: RuangCurhatData[];
  };
};

export type GetRuangCurhatsReq = {
  per_page: string;
  page: string;
  status?: PROBLEM_STATUS_ENUM;
  name?: string;
  gender?: GENDER;
};

export type GetRuangCurhatReq = {
  id: string;
};

export type GetRuangCurhatResp = {
  message: string;
  data: RuangCurhatData;
};

export type PutRuangCurhatReq = {
  id: string;
  data: Partial<
    Omit<RuangCurhatData, "id" | "user_id" | "created_at" | "updated_at">
  >;
};

export type PutRuangCurhatResp = {
  message: string;
  data: RuangCurhatData;
};
