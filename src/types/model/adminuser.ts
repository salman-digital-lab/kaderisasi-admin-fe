import type { AssignedRole } from "../services/auth";

export type AdminUser = {
  id: number;
  email: string;
  display_name: string;
  role: AssignedRole | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  effective_permissions: string[];
  authentication_methods: string[];
  is_super_admin: boolean;
  google_linked: boolean;
};
