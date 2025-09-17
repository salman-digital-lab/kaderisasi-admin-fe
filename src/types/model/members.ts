import { GENDER, USER_LEVEL_ENUM } from "../constants/profile";
import { Province } from "./province";
import { University } from "./university";

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
  
  created_at: string;
  updated_at: string;
};

export type PublicUser = {
  id: number;
  email: string;
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
    level?: number;
    badges?: string;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
};
