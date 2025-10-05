import { notification } from "antd";
import { removeEmptyValueFromObj } from "../../functions";
import {
  GetCustomFormsReq,
  GetCustomFormsResp,
  GetCustomFormResp,
  CreateCustomFormReq,
  CreateCustomFormResp,
  UpdateCustomFormReq,
  UpdateCustomFormResp,
  DeleteCustomFormResp,
} from "../../types/services/customForm";
import axios from "../axios";
import { handleError } from "../errorHandling";

export const getCustomForms = async (props: GetCustomFormsReq) => {
  try {
    const searchParams = removeEmptyValueFromObj(props);
    const urlSearch = new URLSearchParams(searchParams).toString();
    const res = await axios.get<GetCustomFormsResp>("/custom-forms?" + urlSearch);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getCustomForm = async (id: number) => {
  try {
    const res = await axios.get<GetCustomFormResp>("/custom-forms/" + id);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const createCustomForm = async (data: CreateCustomFormReq) => {
  try {
    const res = await axios.post<CreateCustomFormResp>("/custom-forms", data);
    notification.success({
      message: "Berhasil",
      description: "Form berhasil dibuat",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const updateCustomForm = async (id: number, data: UpdateCustomFormReq) => {
  try {
    const res = await axios.put<UpdateCustomFormResp>("/custom-forms/" + id, data);
    notification.success({
      message: "Berhasil",
      description: "Form berhasil diubah",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const deleteCustomForm = async (id: number) => {
  try {
    const res = await axios.delete<DeleteCustomFormResp>("/custom-forms/" + id);
    notification.success({
      message: "Berhasil",
      description: "Form berhasil dihapus",
    });
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const toggleCustomFormActive = async (id: number) => {
  try {
    const res = await axios.put<UpdateCustomFormResp>("/custom-forms/" + id + "/toggle-active");
    notification.success({
      message: "Berhasil",
      description: "Status form berhasil diubah",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const getCustomFormByFeature = async (featureType: string, featureId: string) => {
  try {
    const res = await axios.get<GetCustomFormResp>(`/custom-forms/by-feature?feature_type=${featureType}&feature_id=${featureId}`);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getUnattachedForms = async (props: { page?: string; per_page?: string; search?: string }) => {
  try {
    const searchParams = removeEmptyValueFromObj(props);
    const urlSearch = new URLSearchParams(searchParams).toString();
    const res = await axios.get<GetCustomFormsResp>("/custom-forms/unattached?" + urlSearch);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getAvailableActivities = async (currentFormId?: number) => {
  try {
    const params = currentFormId ? `?current_form_id=${currentFormId}` : '';
    const res = await axios.get(`/custom-forms/available-activities${params}`);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getAvailableClubs = async (currentFormId?: number) => {
  try {
    const params = currentFormId ? `?current_form_id=${currentFormId}` : '';
    const res = await axios.get(`/custom-forms/available-clubs${params}`);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const attachFormToClub = async (formId: number, clubId: number) => {
  try {
    const res = await axios.put<UpdateCustomFormResp>(`/custom-forms/${formId}/attach-club`, { clubId });
    notification.success({
      message: "Berhasil",
      description: "Form berhasil dilampirkan ke klub",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const detachFormFromClub = async (formId: number) => {
  try {
    const res = await axios.put<UpdateCustomFormResp>(`/custom-forms/${formId}/detach-club`);
    notification.success({
      message: "Berhasil",
      description: "Form berhasil dilepas dari klub",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const attachFormToActivity = async (formId: number, activityId: number) => {
  try {
    const res = await axios.put<UpdateCustomFormResp>(`/custom-forms/${formId}/attach-activity`, { activityId });
    notification.success({
      message: "Berhasil",
      description: "Form berhasil dilampirkan ke kegiatan",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const detachFormFromActivity = async (formId: number) => {
  try {
    const res = await axios.put<UpdateCustomFormResp>(`/custom-forms/${formId}/detach-activity`);
    notification.success({
      message: "Berhasil",
      description: "Form berhasil dilepas dari kegiatan",
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};
