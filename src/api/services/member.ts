import { notification } from "antd";

import {
  getProfileResp,
  getProfilesReq,
  getProfilesResp,
  putProfileReq,
  putProfileResp,
} from "../../types/services/member";
import axios from "../axios";
import { handleError } from "../errorHandling";
import { removeEmptyValueFromObj } from "../../functions";
import { renderNotification } from "../../constants/render";

export const getProfiles = async (props: getProfilesReq) => {
  try {
    const urlSearch = new URLSearchParams(props).toString();
    const res = await axios.get<getProfilesResp>("/profiles?" + urlSearch);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getProfile = async (id: string) => {
  try {
    const res = await axios.get<getProfileResp>(`/profiles/${id}`);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const putProfile = async (id: string, props: putProfileReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props.data);
    const res = await axios.put<putProfileResp>(`/profiles/${id}`, bodyData);
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};
