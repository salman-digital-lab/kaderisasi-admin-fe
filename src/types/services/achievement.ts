import {
  ACHIEVEMENT_STATUS_ENUM,
  ACHIEVEMENT_TYPE_ENUM,
} from "../constants/achievement";
import { Achievement } from "../model/achievements";
import { Pagination } from "./base";

export type AchievementSortBy = "achievement_date" | "created_at";
export type SortOrder = "asc" | "desc";

export type GetAchievementsReq = {
  per_page: string;
  page: string;
  status?: ACHIEVEMENT_STATUS_ENUM;
  email?: string;
  name?: string;
  type?: ACHIEVEMENT_TYPE_ENUM;
  sort_by?: AchievementSortBy;
  sort_order?: SortOrder;
};

export type GetAchievementsResp = {
  message: string;
  data: {
    meta: Pagination;
    data: Achievement[];
  };
};

export type GetAchievementReq = {
  id: string;
};

export type GetAchievementResp = {
  message: string;
  data: Achievement;
};

export type PutAchievementReq = {
  id: string;
  data: Partial<Achievement>;
};

export type PutAchievementResp = {
  message: string;
  data: Achievement;
};

export type ApproveAchievementReq = {
  id: string;
  status: ACHIEVEMENT_STATUS_ENUM;
  remark?: string;
  score?: number;
};

export type ApproveAchievementResp = {
  message: string;
  data: Achievement;
};
