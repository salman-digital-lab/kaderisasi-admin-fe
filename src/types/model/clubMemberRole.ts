import type { ClubRegistration } from "./clubRegistration";

export interface ClubMemberRole {
  id: number;
  club_registration_id: number;
  role_name: string;
  start_date?: string | null;
  end_date?: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  registration?: ClubRegistration;
}

export interface ClubMemberRoleCreateRequest {
  club_registration_id: number;
  role_name: string;
  start_date?: string;
  end_date?: string;
  is_primary?: boolean;
  sort_order?: number;
}

export interface ClubMemberRoleUpdateRequest {
  role_name?: string;
  start_date?: string | null;
  end_date?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}
