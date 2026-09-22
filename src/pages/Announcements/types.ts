export interface Audience {
  all_members: boolean;
  member_ids: number[];
  activity_ids: number[];
  activity_statuses: string[];
  club_ids: number[];
  club_statuses: string[];
  all_admins: boolean;
  admin_ids: number[];
  role_codes: string[];
}
export interface AnnouncementInput {
  title: string;
  body: string;
  link_label: string | null;
  link_url: string | null;
  audience: Audience;
  version: number;
}
export interface Announcement extends AnnouncementInput {
  id: number;
  state: "draft" | "published" | "withdrawn";
  recipient_count: number;
  published_at: string | null;
}
export interface Preview {
  eligible: number;
  excluded: number;
  members: number;
  admins: number;
}
export const emptyAudience: Audience = {
  all_members: false,
  member_ids: [],
  activity_ids: [],
  activity_statuses: [],
  club_ids: [],
  club_statuses: ["APPROVED"],
  all_admins: false,
  admin_ids: [],
  role_codes: [],
};
