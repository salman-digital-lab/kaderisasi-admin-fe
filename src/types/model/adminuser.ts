export type AdminUser = {
  id: number;
  email: string;
  display_name: string;
  role_id: number;
  created_at: string;
  updated_at: string;
};

export type Role = {
  id: number;
  role_name: string;
};

export type Permission = {
  id: number;
  permission_code: string;
};
