import { Pagination } from "./base";

export interface MonthlyLeaderboardType {
  id: number;
  userId: number;
  month: string;
  score: number;
  scoreAcademic: number;
  scoreCompetition: number;
  scoreOrganizational: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
    profile: {
      id: number;
      name: string;
      whatsapp?: string;
      university: {
        id: number;
        name: string;
      };
    };
  };
}

// Request types
export interface GetMonthlyLeaderboardReq {
  page?: string;
  per_page?: string;
  month?: string;
  year?: string;
  email?: string;
  name?: string;
}

// Response types
export interface GetMonthlyLeaderboardResp {
  message: string;
  data: {
    meta: Pagination;
    data: MonthlyLeaderboardType[];
  };
}
