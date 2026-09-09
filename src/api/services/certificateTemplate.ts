import { isAxiosError, isCancel } from "axios";
import { removeEmptyValueFromObj } from "../../functions";
import {
  CertificatePayload,
  CertificateTemplate,
  CertificateTemplateData,
  CertificateTemplateStatus,
  CreateCertificateTemplateReq,
  CreateCertificateTemplateResp,
  DeleteCertificateTemplateResp,
  GenerateCertificatesReq,
  GenerateCertificatesResp,
  GenerateSingleCertificateReq,
  GenerateSingleCertificateResp,
  GetCertificateTemplateResp,
  GetCertificateTemplatesReq,
  GetCertificateTemplatesResp,
  GetIssuedCertificatesReq,
  GetIssuedCertificatesResp,
  IssueBulkCertificatesReq,
  IssueBulkCertificatesResp,
  IssueCertificateResp,
  IssuedCertificate,
  LookupCertificatesReq,
  LookupCertificatesResp,
  RevokeCertificateReq,
  RevokeCertificateResp,
  UpdateCertificateTemplateReq,
  UpdateCertificateTemplateResp,
} from "../../types/services/certificateTemplate";
import axios from "../axios";
import { handleError } from "../errorHandling";

const isUnsupportedEndpoint = (error: unknown): boolean =>
  isAxiosError(error) &&
  (error.response?.status === 404 || error.response?.status === 405);

export const normalizeCertificateTemplate = <T extends CertificateTemplate>(
  template: T,
): T => ({
  ...template,
  template_data: normalizeCertificateTemplateData(template.template_data),
  status:
    template.status ??
    template.lifecycle_status ??
    (template.is_active ? "published" : "draft"),
});

function normalizeCertificateTemplateData(
  templateData: CertificateTemplateData,
): CertificateTemplateData {
  const value = templateData as Partial<CertificateTemplateData> | null;

  return {
    backgroundUrl:
      typeof value?.backgroundUrl === "string" ? value.backgroundUrl : null,
    elements: Array.isArray(value?.elements)
      ? value.elements.map((item) => {
          const legacyItem = item as typeof item & {
            assetKey?: string;
            asset_key?: string;
          };
          const { assetKey: _unusedAssetKey, ...element } = legacyItem;
          const legacyElement = element as typeof element & {
            asset_key?: string;
          };
          const imageUrl =
            element.imageUrl || legacyElement.asset_key || _unusedAssetKey;
          const canonicalElement = { ...legacyElement };
          delete canonicalElement.asset_key;
          return imageUrl
            ? { ...canonicalElement, imageUrl }
            : canonicalElement;
        })
      : [],
    canvasWidth:
      typeof value?.canvasWidth === "number" &&
      Number.isFinite(value.canvasWidth)
        ? value.canvasWidth
        : 800,
    canvasHeight:
      typeof value?.canvasHeight === "number" &&
      Number.isFinite(value.canvasHeight)
        ? value.canvasHeight
        : 566,
  };
}

export const getCertificateTemplates = async (
  props: GetCertificateTemplatesReq,
  signal?: AbortSignal,
) => {
  try {
    const searchParams = removeEmptyValueFromObj(props);
    const urlSearch = new URLSearchParams(searchParams).toString();
    const res = await axios.get<GetCertificateTemplatesResp>(
      "/certificate-templates?" + urlSearch,
      { signal },
    );
    return {
      ...res.data.data,
      data: res.data.data.data.map(normalizeCertificateTemplate),
    };
  } catch (error) {
    if (!isCancel(error)) handleError(error);
    throw error;
  }
};

export const getCertificateTemplate = async (
  id: number,
  signal?: AbortSignal,
) => {
  try {
    const res = await axios.get<GetCertificateTemplateResp>(
      "/certificate-templates/" + id,
      { signal },
    );
    return normalizeCertificateTemplate(res.data.data);
  } catch (error) {
    if (!isCancel(error)) handleError(error);
    throw error;
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
    return normalizeCertificateTemplate(res.data.data);
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const updateCertificateTemplate = async (
  id: number,
  data: UpdateCertificateTemplateReq,
  options?: { silent?: boolean },
) => {
  try {
    const res = await axios.put<UpdateCertificateTemplateResp>(
      "/certificate-templates/" + id,
      data,
    );
    return normalizeCertificateTemplate(res.data.data);
  } catch (error) {
    if (
      !options?.silent &&
      (!isAxiosError(error) ||
        (error.response?.status !== 409 && error.response?.status !== 422))
    ) {
      handleError(error);
    }
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

export const uploadCertificateAsset = async (id: number, file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post<{
      message: string;
      data: { asset_key?: string; assetKey?: string; url: string };
    }>(`/certificate-templates/${id}/assets`, formData);
    return {
      assetKey: res.data.data.asset_key || res.data.data.assetKey,
      url: res.data.data.url,
    };
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const updateCertificateTemplateLifecycle = async (
  id: number,
  status: CertificateTemplateStatus,
  expectedVersion: number,
) => {
  if (status === "draft") {
    return updateCertificateTemplate(id, {
      status,
      isActive: false,
      expectedVersion,
    });
  }

  const action = status === "published" ? "publish" : "archive";
  try {
    const res = await axios.post<UpdateCertificateTemplateResp>(
      `/certificate-templates/${id}/${action}`,
      { expectedVersion },
    );
    return normalizeCertificateTemplate(res.data.data);
  } catch (error) {
    if (!isUnsupportedEndpoint(error)) {
      if (!isAxiosError(error) || error.response?.status !== 422) {
        handleError(error);
      }
      throw error;
    }

    return updateCertificateTemplate(id, {
      status,
      isActive: status === "published",
      expectedVersion,
    });
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

export const getIssuedCertificates = async (
  activityOrRequest?: number | GetIssuedCertificatesReq,
): Promise<IssuedCertificate[]> => {
  try {
    const request =
      typeof activityOrRequest === "number"
        ? { activity_id: activityOrRequest }
        : activityOrRequest || {};
    if (request.registration_ids) {
      return await lookupCertificates({
        activity_id: request.activity_id,
        registration_ids: request.registration_ids,
      });
    }
    const res = await axios.get<GetIssuedCertificatesResp>("/certificates", {
      params: {
        activity_id: request.activity_id,
        page: request.page || 1,
        per_page: request.per_page || 20,
      },
    });
    return Array.isArray(res.data.data) ? res.data.data : res.data.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

async function lookupCertificates(
  request: LookupCertificatesReq,
): Promise<IssuedCertificate[]> {
  const ids = [...new Set(request.registration_ids)];
  const batches = Array.from(
    { length: Math.ceil(ids.length / 100) },
    (_, index) => ids.slice(index * 100, (index + 1) * 100),
  );
  const results = await Promise.all(
    batches.map(async (registrationIds) => {
      const response = await axios.post<LookupCertificatesResp>(
        "/certificates/lookup",
        { activity_id: request.activity_id, registration_ids: registrationIds },
      );
      return response.data.data;
    }),
  );
  return results.flat();
}

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
    const result = res.data.data;
    const created = result.created || result.issued || [];
    const alreadyIssued = result.already_issued || [];
    const skipped = result.skipped || [];
    const failed = result.failed || [];
    return {
      ...result,
      created,
      already_issued: alreadyIssued,
      skipped,
      failed,
      total_requested:
        result.total_requested ??
        created.length + alreadyIssued.length + skipped.length + failed.length,
      total_created:
        result.total_created ?? result.total_issued ?? created.length,
      total_already_issued: result.total_already_issued ?? alreadyIssued.length,
      total_skipped: result.total_skipped ?? skipped.length,
      total_failed: result.total_failed ?? failed.length,
    };
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const getIssuedCertificate = async (
  id: number,
): Promise<CertificatePayload> => {
  try {
    const res = await axios.get<{ message: string; data: CertificatePayload }>(
      `/certificates/${id}`,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const getIssuedCertificateByCode = async (
  code: string,
): Promise<CertificatePayload> => {
  try {
    const res = await axios.get<{ message: string; data: CertificatePayload }>(
      `/certificates/code/${encodeURIComponent(code)}`,
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
