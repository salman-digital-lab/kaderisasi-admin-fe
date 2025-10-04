import { Pagination } from "./base";
import { CustomForm } from "../model/customForm";

// Request types
export interface GetCustomFormsReq {
  page?: string;
  per_page?: string;
  search?: string;
  feature_type?: 'activity_registration' | 'club_registration' | 'independent_form';
  feature_id?: string;
  is_active?: string;
}

export interface CreateCustomFormReq {
  formName: string;
  formDescription?: string;
  featureType?: 'activity_registration' | 'club_registration' | 'independent_form';
  featureId?: number | null;
  formSchema?: {
    fields: {
      section_name: string;
      fields: {
        key: string;
        label: string;
        required: boolean;
        type: string;
      }[];
    }[];
  };
  isActive?: boolean;
}

export interface UpdateCustomFormReq extends Partial<CreateCustomFormReq> {}

// Response types
export interface GetCustomFormsResp {
  message: string;
  data: {
    meta: Pagination;
    data: CustomForm[];
  };
}

export interface GetCustomFormResp {
  message: string;
  data: CustomForm;
}

export interface CreateCustomFormResp {
  message: string;
  data: CustomForm;
}

export interface UpdateCustomFormResp {
  message: string;
  data: CustomForm;
}

export interface DeleteCustomFormResp {
  message: string;
}
