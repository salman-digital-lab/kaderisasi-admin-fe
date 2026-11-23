import { type Pagination } from "./base";
import type { PublishedScoringResult } from "./scoring";

export type CertificateTemplateStatus = "draft" | "published" | "archived";

export interface CertificateApproval {
  signer_name: string;
  signer_title: string;
  approved_at: string;
}

export interface CertificateTemplateElement {
  id: string;
  type: "static-text" | "variable-text" | "image" | "qr-code" | "signature";
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  variable?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  lineHeight?: number;
  letterSpacing?: number;
  imageUrl?: string;
  opacity?: number;
  rotation?: number;
  borderRadius?: number;
  objectFit?: "contain" | "cover" | "fill";
  visible?: boolean;
  locked?: boolean;
}

export interface CertificateTemplateData {
  backgroundUrl: string | null;
  scoreSheetLayout?: "salman-v1";
  elements: CertificateTemplateElement[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface CertificateTemplate {
  id: number;
  name: string;
  description: string | null;
  background_image: string | null;
  template_data: CertificateTemplateData;
  is_active: boolean;
  status?: CertificateTemplateStatus;
  lifecycle_status?: CertificateTemplateStatus;
  published_at?: string | null;
  archived_at?: string | null;
  activity_usage_count?: number;
  issued_certificate_count?: number;
  readiness?: {
    ready: boolean;
    errors: Array<
      | string
      | {
          code?: string;
          message: string;
          severity?: "error" | "warning";
        }
    >;
  };
  created_at: string;
  updated_at: string;
  version?: string | number;
}

export interface CertificateTemplateSnapshot {
  id: number;
  name: string;
  background_image: string | null;
  template_data: CertificateTemplateData;
}

export interface GetCertificateTemplatesReq {
  page?: string;
  per_page?: string;
  search?: string;
  is_active?: string;
  status?: CertificateTemplateStatus;
}

export interface CreateCertificateTemplateReq {
  name: string;
  description?: string | null;
  templateData?: CertificateTemplateData;
  isActive?: boolean;
  status?: CertificateTemplateStatus;
}

export interface UpdateCertificateTemplateReq extends Partial<CreateCertificateTemplateReq> {
  expectedVersion: number;
  backgroundImage?: string | null;
}

export interface GetCertificateTemplatesResp {
  message: string;
  data: {
    meta: Pagination;
    data: CertificateTemplate[];
  };
}

export interface GetCertificateTemplateResp {
  message: string;
  data: CertificateTemplate;
}

export interface CreateCertificateTemplateResp {
  message: string;
  data: CertificateTemplate;
}

export interface UpdateCertificateTemplateResp {
  message: string;
  data: CertificateTemplate;
}

export interface DeleteCertificateTemplateResp {
  message: string;
}

export interface CertificateParticipant {
  scoring_result?: PublishedScoringResult;
  registration_id: number;
  user_id: number | null;
  name: string;
  email: string;
  university: string;
  gender?: string;
  guest_name?: string;
  is_guest?: boolean;
  activity_name: string;
  activity_date: string;
}

export interface IssuedCertificate {
  id: number;
  certificate_code: string;
  registration_id: number;
  activity_id: number;
  participant_name: string;
  participant_email: string;
  activity_name: string;
  template_name: string;
  issued_by: number | null;
  issued_by_name: string | null;
  issued_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  revoked_by: number | null;
  revoked_by_name: string | null;
  state: "issued_active" | "issued_revoked";
}

export interface CertificatePayload {
  document_signer?: { key: string; name: string; title: string };
  activity: {
    id: number;
    name: string;
    activity_start: string | null;
    certificate_settings?: CertificateSettings;
  };
  template: CertificateTemplateSnapshot;
  participant: CertificateParticipant;
  certificate?: {
    approval?: CertificateApproval;
    id: number;
    certificate_code: string;
    registration_id: number;
    activity_id: number;
    template_id: number;
    issued_at: string;
    revoked_at: string | null;
    revoked_reason: string | null;
  };
}

export interface CertificateSettings {
  version: 1;
  institution: string;
  role: string;
  event_date: string;
  hijri_date: string;
  delivery_mode: string;
  venue: string;
  organizer: string;
  document_place: string;
  document_date: string;
  /** e.g. 1719/S.4/YPM-5000/IV-1448; absent on settings saved before it existed. */
  certificate_activity_number?: string;
  include_scores: boolean;
}

export interface GetIssuedCertificatesResp {
  message: string;
  data:
    | IssuedCertificate[]
    | {
        meta: Pagination;
        data: IssuedCertificate[];
      };
}

export interface GetIssuedCertificatesReq {
  registration_ids?: number[];
  activity_id?: number;
  page?: number;
  per_page?: number;
  status?: "issued" | "revoked";
}

export interface LookupCertificatesReq {
  activity_id?: number;
  registration_ids: number[];
}

export interface LookupCertificatesResp {
  message: string;
  data: IssuedCertificate[];
}

export interface RevokeCertificateReq {
  reason?: string | null;
}

export interface RevokeCertificateResp {
  message: string;
  data: CertificatePayload;
}
