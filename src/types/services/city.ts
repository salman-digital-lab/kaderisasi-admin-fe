import { City } from "../model/city";
export type getCitiesReq = {
  per_page: string;
  page: string;
  search?: string;
  province_id?: number;
};

export type getCitiesResp = {
  message: string;
  data: City[];
};
