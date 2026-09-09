import type { Pagination } from "../../types/services/base";
import type { CertificateTemplate } from "../../types/services/certificateTemplate";
import type {
  BatchResult,
  IssuancePlan,
  RecipientPage,
  RecipientState,
  TemplateSummary,
} from "../../types/services/certificateWorkflow";
import axios from "../axios";

export async function getCertificateRecipients(
  activityId: number,
  params: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_order?: "asc" | "desc";
    state?: RecipientState;
    registration_ids?: number[];
  },
  signal?: AbortSignal,
): Promise<RecipientPage> {
  const response = await axios.get<{ data: RecipientPage }>(
    `/certificates/activities/${activityId}/recipients`,
    { params, signal },
  );
  return response.data.data;
}
export async function getTemplateSummaries(
  params: { page: number; search?: string },
  signal?: AbortSignal,
): Promise<{ data: TemplateSummary[]; meta: Pagination }> {
  const response = await axios.get<{
    data: { data: TemplateSummary[]; meta: Pagination };
  }>("/certificate-templates", {
    params: { ...params, per_page: 12, status: "published", view: "summary" },
    signal,
  });
  return response.data.data;
}
export async function prepareIssuance(
  activityId: number,
  registrationIds?: number[],
): Promise<IssuancePlan> {
  const response = await axios.post<{ data: IssuancePlan }>(
    "/certificates/prepare-issuance",
    { activity_id: activityId, registration_ids: registrationIds },
  );
  return response.data.data;
}
export async function issueCertificateBatch(
  plan: IssuancePlan,
  registrationIds: number[],
): Promise<BatchResult> {
  const response = await axios.post<{ data: BatchResult }>(
    "/certificates/issue-bulk",
    {
      registration_ids: registrationIds,
      response_mode: "compact",
      expected: {
        activity_id: plan.activity_id,
        template_id: plan.template_id,
        template_version: plan.template_version,
      },
    },
    { timeout: 60_000 },
  );
  return response.data.data;
}
export async function duplicateTemplate(
  id: number,
): Promise<CertificateTemplate> {
  const response = await axios.post<{ data: CertificateTemplate }>(
    `/certificate-templates/${id}/duplicate`,
  );
  return response.data.data;
}
export async function assignCertificateTemplate(
  activityId: number,
  templateId: number | null,
): Promise<void> {
  await axios.put(`/activities/${activityId}`, {
    certificate_template_id: templateId,
  });
}
