import { GENDER, USER_LEVEL_ENUM } from "../constants/profile";
import { Province } from "./province";
import { University } from "./university";

export type EducationEntry = {
  degree: "bachelor" | "master" | "doctoral";
  institution: string;
  major: string;
  intake_year: number;
};

export type WorkEntry = {
  job_title: string;
  company: string;
  start_year?: number;
  end_year?: number;
};

export type ExtraData = {
  preferred_name?: string;
  salman_activity_history?: string[];
  current_activity_focus?: string[];
  alumni_regional_assignment?: string[];
};

export type Member = {
  id: number;
  name: string;
  user_id: number | undefined;
  publicUser?: PublicUser;
  picture: string | undefined;
  personal_id: string | undefined;
  gender: GENDER | undefined;
  level: USER_LEVEL_ENUM | undefined;
  badges: string[] | undefined;

  whatsapp: string | undefined;
  line: string | undefined;
  instagram: string | undefined;
  tiktok: string | undefined;
  linkedin: string | undefined;

  province_id: number | undefined;
  province?: Province;
  city_id: number | undefined;

  university_id: number | undefined;
  university?: University;

  major: string | undefined;
  intake_year: number | undefined;
  birth_date: string | undefined;

  origin_province_id: number | undefined;
  origin_city_id: number | undefined;
  country: string | undefined;
  education_history: EducationEntry[] | undefined;
  work_history: WorkEntry[] | undefined;
  extra_data: ExtraData | undefined;

  created_at: string;
  updated_at: string;
};

export type PublicUser = {
  id: number;
  email: string | null;
  member_id: string | null;
  account_status: "no_account" | "active";
  profile?: {
    id: number;
    name: string;
    personal_id?: string;
    gender?: string;
    whatsapp?: string;
    line?: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
    province_id?: number;
    city_id?: number;
    university_id?: number;
    major?: string;
    intake_year?: string;
    birth_date?: string;
    level?: number;
    badges?: string;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
};
