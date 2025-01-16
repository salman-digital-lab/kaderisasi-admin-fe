import { notification } from "antd";
import {
  getProvincesReq,
  getProvincesResp,
  postProvinceResp,
  putProvinceResp,
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
  }
};

export const getDataProvinceId = async (id: string) => {
  try {
    const res = await axios.get<getProvincesResp>(`/provinces/${id}/cities`);
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const addProvince = async (props: { name: string }) => {
  try {
    const res = await axios.post<postProvinceResp>("/provinces", props);
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateProvince = async (id: number, props: { name: string }) => {
  try {
    const res = await axios.put<putProvinceResp>("/provinces/" + id, props);
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};
