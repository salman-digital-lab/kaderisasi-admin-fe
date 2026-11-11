import type { Pagination } from "../services/base";

export type MemberAuditAction =
  | "created"
  | "profile_updated"
  | "regional_assignment_updated"
  | "credentials_updated"
  | "account_generated"
  | "deleted";

/** One field of a change. A password only ever reports `changed`. */
export type MemberAuditChange = {
  before?: unknown;
  after?: unknown;
  changed?: boolean;
};

export type MemberAuditLog = {
  id: number;
  action: MemberAuditAction;
  changes: Record<string, MemberAuditChange>;
  source: string;
  actor_admin_user_id: number | null;
  actor_name: string;
  created_at: string | null;
};

export type MemberAuditLogList = {
  meta: Pagination;
  data: MemberAuditLog[];
};
