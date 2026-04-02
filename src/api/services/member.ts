import { notification } from "antd";

import {
  createMemberReq,
  createMemberResp,
  generateAccountReq,
  generateAccountResp,
  getActivityByUserIdResp,
  getProfileResp,
  getProfilesReq,
  getProfilesResp,
  putProfileAuthReq,
  putProfileAuthResp,
  putProfileReq,
  putProfileResp,
  putRegionalAssignmentResp,
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

export const getProfileByUserId = async (userId: string) => {
  try {
    const res = await axios.get<getProfileResp>(`/profiles/user/${userId}`);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getActivityByUserId = async (userId: string) => {
  try {
    const res = await axios.get<getActivityByUserIdResp>(`/activity-registrations/user/${userId}`);
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

export const putProfileAuth = async (id: string, props: putProfileAuthReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props);
    const res = await axios.put<putProfileAuthResp>(
      `/profiles/auth/${id}`,
      bodyData,
    );
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const createMember = async (props: createMemberReq) => {
  try {
    const res = await axios.post<createMemberResp>("/members", props);
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const generateAccount = async (id: string, props: generateAccountReq) => {
  try {
    const res = await axios.post<generateAccountResp>(
      `/members/${id}/generate-account`,
      props,
    );
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const putRegionalAssignment = async (
  id: string,
  alumni_regional_assignment: string[],
) => {
  try {
    const res = await axios.put<putRegionalAssignmentResp>(
      `/profiles/${id}/regional-assignment`,
      { alumni_regional_assignment },
    );
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};
