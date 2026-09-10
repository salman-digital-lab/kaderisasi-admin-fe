import axios from "../axios";
import type { CertificatePayload } from "../../types/services/certificateTemplate";
import type { Pagination } from "../../types/services/base";
import type { IssuancePlan } from "../../types/services/certificateWorkflow";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";
export interface ApprovalSummary {
  id: number;
  registration_id: number;
  activity_id: number;
  signer_id: number;
  requested_by: number;
  signer_name: string;
  signer_title: string;
  participant_name: string;
  activity_name: string;
  content_hash: string;
  status: ApprovalStatus;
  decided_at: string | null;
  reason: string | null;
  certificate_id: number | null;
  created_at: string;
}
export interface ApprovalDetail extends ApprovalSummary {
  snapshot: CertificatePayload;
}
export interface ApprovalOutcome {
  id: number;
  registration_id: number;
  status: ApprovalStatus | "failed";
  reason?: string;
  certificate_id?: number;
}
export async function getCertificateSigners(
  signal?: AbortSignal,
): Promise<Array<{ id: number; name: string }>> {
  const response = await axios.get<{
    data: Array<{ id: number; name: string }>;
  }>("/certificates/signers", { signal });
  return response.data.data;
}
export async function requestCertificateApprovals(
  plan: IssuancePlan,
  ids: number[],
  signerId: number,
  signerTitle: string,
): Promise<ApprovalOutcome[]> {
  const response = await axios.post<{ data: ApprovalOutcome[] }>(
    "/certificates/approvals",
    {
      registration_ids: ids,
      signer_id: signerId,
      signer_title: signerTitle,
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
export async function getCertificateApprovals(
  params: { activity_id?: number; page: number; status: ApprovalStatus },
  signal?: AbortSignal,
): Promise<{ data: ApprovalSummary[]; meta: Pagination }> {
  const response = await axios.get<{
    data: { data: ApprovalSummary[]; meta: Pagination };
  }>("/certificates/approvals", {
    params: { ...params, per_page: 20 },
    signal,
  });
  return response.data.data;
}
export async function getCertificateApproval(
  id: number,
): Promise<ApprovalDetail> {
  const response = await axios.get<{ data: ApprovalDetail }>(
    `/certificates/approvals/${id}`,
  );
  return response.data.data;
}
export async function decideCertificateApprovals(
  items: Pick<ApprovalSummary, "id" | "content_hash">[],
  action: "approve" | "reject" | "cancel",
  consent: boolean,
  reason?: string,
): Promise<ApprovalOutcome[]> {
  const response = await axios.post<{ data: ApprovalOutcome[] }>(
    "/certificates/approvals/decide",
    {
      items: items.map(({ id, content_hash }) => ({ id, content_hash })),
      action,
      consent,
      reason,
    },
    { timeout: 60_000 },
  );
  return response.data.data;
}
export const APPROVAL_ERRORS: Record<string, string> = {
  CERTIFICATE_CONTEXT_CHANGED:
    "Data atau desain berubah. Batalkan permintaan lama dan ajukan kembali untuk ditinjau.",
  CERTIFICATE_APPROVAL_PENDING:
    "Masih ada permintaan dengan penandatangan atau data berbeda. Batalkan permintaan lama terlebih dahulu.",
  CERTIFICATE_ALREADY_ISSUED: "Sertifikat sudah diterbitkan.",
  APPROVAL_ALREADY_DECIDED: "Permintaan ini sudah diproses. Muat ulang daftar.",
  APPROVAL_SIGNER_REQUIRED:
    "Hanya penandatangan yang ditunjuk dengan akses aktif yang dapat menyetujui.",
  INVALID_CERTIFICATE_SIGNER:
    "Penandatangan tidak memiliki nama atau akses persetujuan aktif.",
  REGISTRATION_NOT_ELIGIBLE: "Peserta belum memenuhi syarat penerbitan.",
  APPROVAL_BLOCK_REQUIRED:
    "Tambahkan blok persetujuan elektronik pada template.",
};
