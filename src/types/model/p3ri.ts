import { Pagination } from "../services/base";

export type P3riStatus = "terdaftar" | "diterima";

export type P3riQuestion = {
  id: string;
  label: string;
  help?: string;
  type:
    | "short"
    | "long"
    | "date"
    | "radio"
    | "dropdown"
    | "checkbox"
    | "scale"
    | "grid"
    | "file";
  required: boolean;
  options?: string[];
  rows?: string[];
  columns?: string[];
};

export type P3riForm = {
  code: string;
  title: string;
  opens_at: string;
  closes_at: string;
  sections: { id: string; title: string; questions: P3riQuestion[] }[];
  choice_questions: P3riQuestion[];
  divisions: { code: string; name: string; questions: P3riQuestion[] }[];
};

export type P3riFile = {
  field: string;
  key: string;
  name: string;
  mime: string;
  size: number;
};

export type P3riRegistration = {
  id: number;
  user_id: number;
  email: string;
  status: P3riStatus;
  choices: string[];
  accepted_division: string | null;
  answers: {
    common: Record<string, unknown>;
    divisions: Record<string, Record<string, unknown>>;
  };
  files: P3riFile[];
  admin_note: string | null;
  status_updated_by_name?: string | null;
  status_updated_at: string | null;
  submitted_at: string;
  updated_at: string;
};

export type P3riRegistrationList = {
  meta: Pagination;
  data: P3riRegistration[];
  counts: Record<P3riStatus, number>;
};

export type P3riRegistrationFilter = {
  page: number;
  per_page: number;
  status?: P3riStatus;
  division?: string;
  choice_rank?: number;
  gender?: string;
  search?: string;
};
