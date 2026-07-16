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
  CertificatePayload,
  GetIssuedCertificatesReq,
  IssuedCertificate,
  CertificateTemplateStatus,
  CertificateTemplate,
  CertificateTemplateData,
} from "../../types/services/certificateTemplate";
import axios from "../axios";
import { handleError } from "../errorHandling";
import { isAxiosError } from "axios";

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
) => {
  try {
    const searchParams = removeEmptyValueFromObj(props);
    const urlSearch = new URLSearchParams(searchParams).toString();
    const res = await axios.get<GetCertificateTemplatesResp>(
      "/certificate-templates?" + urlSearch,
    );
    return {
      ...res.data.data,
      data: res.data.data.data.map(normalizeCertificateTemplate),
    };
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const getCertificateTemplate = async (id: number) => {
  try {
    const res = await axios.get<GetCertificateTemplateResp>(
      "/certificate-templates/" + id,
    );
    return normalizeCertificateTemplate(res.data.data);
  } catch (error) {
    handleError(error);
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
) => {
  try {
    const res = await axios.put<UpdateCertificateTemplateResp>(
      "/certificate-templates/" + id,
      data,
    );
    return normalizeCertificateTemplate(res.data.data);
  } catch (error) {
    if (!isAxiosError(error) || error.response?.status !== 422) {
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
) => {
  if (status === "draft") {
    return updateCertificateTemplate(id, { status, isActive: false });
  }

  const action = status === "published" ? "publish" : "archive";
  try {
    const res = await axios.post<UpdateCertificateTemplateResp>(
      `/certificate-templates/${id}/${action}`,
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
    const fetchPage = async (page: number) => {
      const queryParams = new URLSearchParams();
      if (request.activity_id) {
        queryParams.set("activity_id", String(request.activity_id));
      }
      queryParams.set("page", String(page));
      queryParams.set(
        "per_page",
        String(Math.min(request.per_page || 100, 100)),
      );
      if (request.status) queryParams.set("status", request.status);

      const res = await axios.get<GetIssuedCertificatesResp>(
        `/certificates?${queryParams.toString()}`,
      );
      return res.data.data;
    };

    const firstPage = await fetchPage(request.page || 1);
    if (Array.isArray(firstPage) || request.page) {
      return Array.isArray(firstPage) ? firstPage : firstPage.data;
    }

    const remainingPages = Array.from(
      { length: Math.max(firstPage.meta.last_page - 1, 0) },
      (_, index) => index + 2,
    );
    const remainingResults = await Promise.all(
      remainingPages.map((page) => fetchPage(page)),
    );

    return [
      ...firstPage.data,
      ...remainingResults.flatMap((page) =>
        Array.isArray(page) ? page : page.data,
      ),
    ];
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
