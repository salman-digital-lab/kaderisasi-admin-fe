import { message } from "antd";

import {
  type createMemberReq,
  type createMemberResp,
  type generateAccountReq,
  type generateAccountResp,
  type getActivityByUserIdResp,
  type getProfileResp,
  type getProfilesReq,
  type getProfilesResp,
  type putProfileAuthReq,
  type putProfileAuthResp,
  type putProfileReq,
  type putProfileResp,
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
    throw error;
  }
};

export const getProfile = async (id: string) => {
  try {
    const res = await axios.get<getProfileResp>(`/profiles/${id}`);
    return res.data.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};

export const getProfileByUserId = async (userId: string) => {
  try {
    const res = await axios.get<getProfileResp>(`/profiles/user/${userId}`);
    return res.data.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};

export const getActivityByUserId = async (userId: string) => {
  try {
    const res = await axios.get<getActivityByUserIdResp>(
      `/activity-registrations/user/${userId}`,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};

export const putProfile = async (id: string, props: putProfileReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props.data);
    const res = await axios.put<putProfileResp>(`/profiles/${id}`, bodyData);
    message.success(renderNotification(res.data.message));
    return res.data.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};

export const putProfileAuth = async (id: string, props: putProfileAuthReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props);
    const res = await axios.put<putProfileAuthResp>(
      `/profiles/auth/${id}`,
      bodyData,
    );
    message.success(renderNotification(res.data.message));
    return res.data.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};

export const createMember = async (props: createMemberReq) => {
  try {
    const res = await axios.post<createMemberResp>("/members", props);
    message.success(renderNotification(res.data.message));
    return res.data.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};

export const generateAccount = async (
  id: string,
  props: generateAccountReq,
) => {
  try {
    const res = await axios.post<generateAccountResp>(
      `/members/${id}/generate-account`,
      props,
    );
    message.success(renderNotification(res.data.message));
    return res.data.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};
