export interface DashboardStatsResp {
  message: string;
  data: {
    totalProfiles: number;
    totalActivities: number;
    totalClubs: number;
    totalRuangCurhats: number;
  };
}
