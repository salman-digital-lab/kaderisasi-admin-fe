import type { Pagination } from "./base";
import type {
  CertificatePayload,
  CertificateTemplate,
} from "./certificateTemplate";

export type RecipientState =
  | "eligible_not_issued"
  | "not_eligible"
  | "issued_active"
  | "issued_revoked";
export interface CertificateRecipient {
  registration_id: number;
  created_at: string | null;
  name: string;
  status: string;
  state: RecipientState;
  certificate_id: number | null;
  certificate_code: string | null;
}
export type TemplateSummary = Pick<
  CertificateTemplate,
  "id" | "name" | "description" | "version" | "status" | "readiness"
>;
export interface RecipientPage {
  activity: { id: number; name: string };
  template: TemplateSummary | null;
  counts: Record<RecipientState, number>;
  meta: Pagination;
  data: CertificateRecipient[];
}
export interface IssuancePlan {
  activity_id: number;
  template_id: number;
  template_version: number;
  registration_ids: number[];
  excluded: {
    already_issued: number;
    revoked: number;
    not_eligible: number;
    missing: number;
  };
  preview: CertificatePayload | null;
}
export interface IssuanceResult {
  registration_id: number;
  name: string;
  state: "created" | "already_issued" | "skipped" | "failed";
  reason?: string;
  certificate_id?: number;
  certificate_code?: string;
}
export interface BatchResult {
  results: IssuanceResult[];
  paused: boolean;
  remaining_ids: number[];
}
