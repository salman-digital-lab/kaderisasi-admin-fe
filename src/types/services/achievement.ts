import { ACHIEVEMENT_STATUS_ENUM } from "../constants/achievement";
import { Achievement } from "../model/achievements";
import { Pagination } from "./base";

export type GetAchievementsReq = {
  per_page: string;
  page: string;
  status?: ACHIEVEMENT_STATUS_ENUM;
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
  score?: number;
};

export type ApproveAchievementResp = {
  message: string;
  data: Achievement;
};
