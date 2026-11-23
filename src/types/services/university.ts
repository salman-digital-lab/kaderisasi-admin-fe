import { type Pagination } from "./base";
import { type University } from "../model/university";
export type getUniversitiesResp = {
  message: string;
  data: {
    meta: Pagination;
    data: University[];
  };
};

export type getUniversitiesReq = {
  per_page: string;
  page: string;
  search?: string;
};

export type universityReq = {
  data: {
    name: string;
    provinceId: number;
  };
};

export type universityResp = {
  message: string;
  data: University;
};
