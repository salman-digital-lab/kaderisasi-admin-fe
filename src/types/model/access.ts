export type AccessTarget = {
  code: string;
  name: string;
  description: string | null;
};

export type AccessTicket = {
  id: number;
  number: string;
  status: "open" | "resolved" | "cancelled";
  resolution: "approved" | "rejected" | null;
  reason: string;
  rejection_reason: string | null;
  requester_admin_user_id: number;
  requester_name?: string;
  requester_email?: string;
  requested_role_code: string;
  role_name: string;
  created_at: string;
  updated_at: string | null;
  resolved_at?: string | null;
  cancelled_at?: string | null;
  reviewer_name?: string | null;
};

export type RbacRole = AccessTarget & {
  capabilities: string[];
  limitation: string;
  is_requestable: boolean;
  permissions: string[];
};
