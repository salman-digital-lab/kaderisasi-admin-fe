import { removeEmptyValueFromObj } from "../../functions";
import {
  GetCertificateTemplatesReq,
  GetCertificateTemplatesResp,
  GetCertificateTemplateResp,
  CreateCertificateTemplateReq,
  CreateCertificateTemplateResp,
  UpdateCertificateTemplateReq,
  UpdateCertificateTemplateResp,
  DeleteCertificateTemplateResp,
  UploadBackgroundResp,
  GenerateCertificatesReq,
  GenerateCertificatesResp,
  GenerateSingleCertificateReq,
  GenerateSingleCertificateResp,
  GetIssuedCertificatesResp,
  IssueBulkCertificatesReq,
  IssueBulkCertificatesResp,
  IssueCertificateResp,
  RevokeCertificateReq,
  RevokeCertificateResp,
} from "../../types/services/certificateTemplate";
import axios from "../axios";
import { handleError } from "../errorHandling";

export const getCertificateTemplates = async (
  props: GetCertificateTemplatesReq,
) => {
  try {
    const searchParams = removeEmptyValueFromObj(props);
    const urlSearch = new URLSearchParams(searchParams).toString();
    const res = await axios.get<GetCertificateTemplatesResp>(
      "/certificate-templates?" + urlSearch,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getCertificateTemplate = async (id: number) => {
  try {
    const res = await axios.get<GetCertificateTemplateResp>(
      "/certificate-templates/" + id,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const createCertificateTemplate = async (
  data: CreateCertificateTemplateReq,
) => {
  try {
    const res = await axios.post<CreateCertificateTemplateResp>(
      "/certificate-templates",
      data,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const updateCertificateTemplate = async (
  id: number,
  data: UpdateCertificateTemplateReq,
) => {
  try {
    const res = await axios.put<UpdateCertificateTemplateResp>(
      "/certificate-templates/" + id,
      data,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const deleteCertificateTemplate = async (id: number) => {
  try {
    const res = await axios.delete<DeleteCertificateTemplateResp>(
      "/certificate-templates/" + id,
    );
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const uploadCertificateBackground = async (id: number, file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post<UploadBackgroundResp>(
      `/certificate-templates/${id}/background`,
      formData,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const generateCertificates = async (data: GenerateCertificatesReq) => {
  try {
    const res = await axios.post<GenerateCertificatesResp>(
      "/certificates/generate",
      data,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const generateSingleCertificate = async (
  data: GenerateSingleCertificateReq,
) => {
  try {
    const res = await axios.post<GenerateSingleCertificateResp>(
      "/certificates/generate-single",
      data,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const getIssuedCertificates = async (activityId?: number) => {
  try {
    const query = activityId ? `?activity_id=${activityId}` : "";
    const res = await axios.get<GetIssuedCertificatesResp>(
      `/certificates${query}`,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const issueSingleCertificate = async (
  data: GenerateSingleCertificateReq,
) => {
  try {
    const res = await axios.post<IssueCertificateResp>(
      "/certificates/issue-single",
      data,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const issueBulkCertificates = async (data: IssueBulkCertificatesReq) => {
  try {
    const res = await axios.post<IssueBulkCertificatesResp>(
      "/certificates/issue-bulk",
      data,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const revokeCertificate = async (
  id: number,
  data: RevokeCertificateReq,
) => {
  try {
    const res = await axios.post<RevokeCertificateResp>(
      `/certificates/${id}/revoke`,
      data,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};
