import { message } from "antd";
import {
  type getProvincesReq,
  type getProvincesResp,
  type postProvinceResp,
  type putProvinceResp,
} from "../../types/services/province";
import axios from "../axios";
import { handleError } from "../errorHandling";
import { renderNotification } from "../../constants/render";

export const getProvinces = async (props: getProvincesReq) => {
  try {
    const urlSearch = new URLSearchParams(props).toString();
    const res = await axios.get<getProvincesResp>("/provinces?" + urlSearch);
    return res.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};

export const getDataProvinceId = async (id: string) => {
  try {
    const res = await axios.get<getProvincesResp>(`/provinces/${id}/cities`);
    return res.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};

export const addProvince = async (props: { name: string }) => {
  try {
    const res = await axios.post<postProvinceResp>("/provinces", props);
    message.success(renderNotification(res.data.message));
    return res.data.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};

export const updateProvince = async (id: number, props: { name: string }) => {
  try {
    const res = await axios.put<putProvinceResp>("/provinces/" + id, props);
    message.success(renderNotification(res.data.message));
    return res.data.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};
