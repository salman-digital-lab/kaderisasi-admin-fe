export interface CustomForm {
  id: number;
  form_name: string;
  form_description?: string;
  feature_type: 'activity_registration' | 'club_registration';
  feature_id: number;
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
  description?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  defaultValue?: any;
  hidden?: boolean;
  disabled?: boolean;
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
  section_name: string;
  fields: FormField[];
}

export interface FormSchema {
  fields: FormSection[];
}
