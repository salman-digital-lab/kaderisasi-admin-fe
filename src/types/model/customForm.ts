import type { SectionNavigation } from "../../utils/form-routing";

export interface CustomForm {
  id: number;
  form_name: string;
  form_description?: string;
  post_submission_info?: string;
  feature_type:
    | "activity_registration"
    | "club_registration"
    | "independent_form";
  feature_id: number | null;
  form_schema: FormSchema;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  key: string;
  label: string;
  required: boolean;
  type: string;
  placeholder?: string;
  helpText?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  disabled?: boolean;
  hidden?: boolean;
  description?: string;
  defaultValue?: unknown;
}

export interface FieldOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
}

export interface FormSection {
  id?: string;
  section_name: string;
  description?: string;
  navigation?: SectionNavigation;
  fields: FormField[];
}

export interface FormSchema {
  version?: number;
  fields: FormSection[];
}
