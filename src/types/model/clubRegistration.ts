import type { Club } from "./club";
import type { ClubMemberRole } from "./clubMemberRole";
import type { EducationEntry, WorkEntry } from "../../utils/profile-history";

export interface Profile {
  id: number;
  name: string;
  picture?: string;
  personal_id?: string;
  gender?: string;
  whatsapp?: string;
  line?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  province_id?: number;
  city_id?: number;
  origin_province_id?: number;
  origin_city_id?: number;
  country?: string;
  university_id?: number;
  major?: string;
  intake_year?: string | number;
  birth_date?: string;
  level?: number;
  badges?: string[];
  education_history?: EducationEntry[] | string | null;
  work_history?: WorkEntry[] | string | null;
  extra_data?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUserWithProfile {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface ClubRegistration {
  id: number;
  club_id: number;
  member_id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  additional_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;

  // Relations
  club?: Club;
  member?: PublicUserWithProfile;
  roles?: ClubMemberRole[];
}

export interface ClubRegistrationCreateRequest {
  member_id: number;
  additional_data?: Record<string, unknown>;
}

export interface ClubRegistrationUpdateRequest {
  status: "PENDING" | "APPROVED" | "REJECTED";
  additional_data?: Record<string, unknown>;
}

export interface ClubRegistrationBulkUpdateRequest {
  registrations: Array<{
    id: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    additional_data?: Record<string, unknown>;
  }>;
}

export interface ClubRegistrationInfoUpdateRequest {
  registration_info: string;
}
