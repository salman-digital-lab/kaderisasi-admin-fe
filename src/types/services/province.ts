import { Province } from "../model/province";
export type getProvincesReq = {
  search?: string;
};

export type getProvincesResp = {
  message: string;
  data: Province[];
};

export type postProvinceResp = {
  message: string;
  data: Province;
};

export type putProvinceResp = {
  message: string;
  data: Province;
};
