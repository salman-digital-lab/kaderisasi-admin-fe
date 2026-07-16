import { Pagination } from "./base";

export type CertificateTemplateStatus = "draft" | "published" | "archived";

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
  assetKey?: string;
  opacity?: number;
  rotation?: number;
  borderRadius?: number;
  objectFit?: "contain" | "cover" | "fill";
  visible?: boolean;
  locked?: boolean;
}

export interface CertificateTemplateData {
  backgroundUrl: string | null;
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
}

export interface CertificateTemplateSnapshot {
  id: number;
  name: string;
  background_image: string | null;
  template_data: CertificateTemplateData;
}

// Request types
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
  backgroundImage?: string | null;
}

// Response types
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

export interface GenerateCertificatesReq {
  activity_id: number;
  template_id: number;
  status?: string;
}

export interface CertificateParticipant {
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
  activity: {
    id: number;
    name: string;
    activity_start: string | null;
  };
  template: CertificateTemplateSnapshot;
  participant: CertificateParticipant;
  certificate?: {
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

export interface GenerateCertificatesResp {
  message: string;
  data: {
    activity: {
      id: number;
      name: string;
      activity_start: string;
    };
    template: CertificateTemplate;
    participants: CertificateParticipant[];
    total: number;
  };
}

export interface GenerateSingleCertificateReq {
  registration_id: number;
}

export interface GenerateSingleCertificateResp {
  message: string;
  data: CertificatePayload;
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
  activity_id?: number;
  page?: number;
  per_page?: number;
  status?: "issued" | "revoked";
}

export interface IssueCertificateResp {
  message: string;
  data: CertificatePayload;
}

export interface IssueBulkCertificatesReq {
  registration_ids: number[];
}

export interface IssueBulkCertificatesResp {
  message: string;
  data: IssueBulkCertificatesResult;
}

export interface IssueBulkCertificateDetail {
  registration_id: number;
  reason?: string;
  certificate_id?: number;
  certificate_code?: string;
}

export interface IssueBulkCertificatesResult {
  created: CertificatePayload[];
  issued?: CertificatePayload[];
  already_issued: CertificatePayload[];
  skipped: IssueBulkCertificateDetail[];
  failed: IssueBulkCertificateDetail[];
  total_requested: number;
  total_created: number;
  total_issued?: number;
  total_already_issued: number;
  total_skipped: number;
  total_failed: number;
}

export interface RevokeCertificateReq {
  reason?: string | null;
}

export interface RevokeCertificateResp {
  message: string;
  data: CertificatePayload;
}
