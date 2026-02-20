import { Pagination } from "./base";

export interface CertificateTemplateElement {
  id: string;
  type: "static-text" | "variable-text" | "image" | "qr-code" | "signature";
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
  imageUrl?: string;
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
  user_id: number;
  name: string;
  email: string;
  activity_name: string;
  activity_date: string;
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
  data: {
    activity: {
      id: number;
      name: string;
      activity_start: string;
    };
    template: {
      id: number;
      name: string;
      background_image: string | null;
      template_data: CertificateTemplateData;
    };
    participant: CertificateParticipant;
  };
}
