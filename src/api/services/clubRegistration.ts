import { notification } from "antd";
import { removeEmptyValueFromObj } from "../../functions";
import {
  getClubRegistrationsReq,
  getClubRegistrationsResp,
  getClubRegistrationResp,
  postClubRegistrationReq,
  postClubRegistrationResp,
  putClubRegistrationReq,
  putClubRegistrationResp,
  putClubRegistrationsBulkReq,
  putClubRegistrationsBulkResp,
  deleteClubRegistrationResp,
  putClubRegistrationInfoReq,
  putClubRegistrationInfoResp,
} from "../../types/services/clubRegistration";
import axios from "../axios";
import { handleError } from "../errorHandling";
import { renderNotification } from "../../constants/render";

export const getClubRegistrations = async (clubId: number, props: getClubRegistrationsReq) => {
  try {
    const searchParams = removeEmptyValueFromObj(props);
    const urlSearch = new URLSearchParams(searchParams).toString();
    const res = await axios.get<getClubRegistrationsResp>(`/clubs/${clubId}/registrations?${urlSearch}`);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const createClubRegistration = async (clubId: number, props: postClubRegistrationReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props);
    const res = await axios.post<postClubRegistrationResp>(`/clubs/${clubId}/registrations`, bodyData);
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getClubRegistration = async (registrationId: number) => {
  try {
    const res = await axios.get<getClubRegistrationResp>(`/club-registrations/${registrationId}`);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateClubRegistration = async (registrationId: number, props: putClubRegistrationReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props);
    const res = await axios.put<putClubRegistrationResp>(`/club-registrations/${registrationId}`, bodyData);
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const bulkUpdateClubRegistrations = async (props: putClubRegistrationsBulkReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props);
    const res = await axios.put<putClubRegistrationsBulkResp>(`/club-registrations/bulk-update`, bodyData);
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const deleteClubRegistration = async (registrationId: number) => {
  try {
    const res = await axios.delete<deleteClubRegistrationResp>(`/club-registrations/${registrationId}`);
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const exportClubRegistrations = async (clubId: number) => {
  try {
    const res = await axios.get(`/clubs/${clubId}/registrations/export`, {
      responseType: 'blob',
    });
    return res.data;
  } catch (error) {
    handleError(error);
  }
};



export const updateClubRegistrationInfo = async (clubId: number, props: putClubRegistrationInfoReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props);
    const res = await axios.put<putClubRegistrationInfoResp>(`/clubs/${clubId}/registration-info`, bodyData);
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};
