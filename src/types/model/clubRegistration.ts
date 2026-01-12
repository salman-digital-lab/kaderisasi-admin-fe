import { Club } from "./club";

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
  university_id?: number;
  major?: string;
  intake_year?: string;
  birth_date?: string;
  level?: number;
  badges?: string;
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
  additional_data: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Relations
  club?: Club;
  member?: PublicUserWithProfile;
}

export interface ClubRegistrationCreateRequest {
  member_id: number;
  additional_data?: Record<string, any>;
}

export interface ClubRegistrationUpdateRequest {
  status: "PENDING" | "APPROVED" | "REJECTED";
  additional_data?: Record<string, any>;
}

export interface ClubRegistrationBulkUpdateRequest {
  registrations: Array<{
    id: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    additional_data?: Record<string, any>;
  }>;
}

export interface ClubRegistrationInfoUpdateRequest {
  registration_info: string;
}
