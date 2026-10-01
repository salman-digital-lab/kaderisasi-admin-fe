import type { AssignedRole } from "../services/auth";

export type AdminUser = {
  id: number;
  email: string;
  display_name: string;
  role: AssignedRole | null;
  roles?: AssignedRole[];
  role_codes?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  effective_permissions: string[];
  authentication_methods: string[];
  is_super_admin: boolean;
  google_linked: boolean;
  // Sent only to Super Admins on the account list.
  talent_assessment_completed?: boolean;
};
