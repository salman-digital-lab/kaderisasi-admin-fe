import { Pagination } from "./base";

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
}

export interface CreateCertificateTemplateReq {
  name: string;
  description?: string | null;
  templateData?: CertificateTemplateData;
  isActive?: boolean;
}

export interface UpdateCertificateTemplateReq extends Partial<CreateCertificateTemplateReq> {}

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

export interface UploadBackgroundResp {
  message: string;
  data: { backgroundImage: string };
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
  activity_name: string;
  activity_date: string;
}

export interface IssuedCertificate {
  id: number;
  certificate_code: string;
  registration_id: number;
  activity_id: number;
  template_id: number;
  template_snapshot: CertificateTemplateSnapshot;
  participant_snapshot: CertificateParticipant;
  issued_by: number | null;
  issued_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  created_at: string;
  updated_at: string;
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
  data: IssuedCertificate[];
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
  data: {
    issued: CertificatePayload[];
    skipped: Array<{
      registration_id: number;
      reason: string;
    }>;
    total_issued: number;
    total_skipped: number;
  };
}

export interface RevokeCertificateReq {
  reason?: string | null;
}

export interface RevokeCertificateResp {
  message: string;
  data: CertificatePayload;
}
