export type AssignedRole = {
  code: string;
  name: string;
};

export type SessionUser = {
  id: number;
  email: string;
  display_name: string;
  is_active: boolean;
  role: AssignedRole | null;
};

export type AuthSession = {
  access_token: string;
  access_token_expires_in: number;
  user: SessionUser;
  authentication_methods: string[];
  permissions: string[];
  is_super_admin: boolean;
};

export type AuthSessionResponse = { message: string; data: AuthSession };
export type PutLogoutResp = { message: string };
