import { DashboardStatsResp } from "../../types/services/dashboard";
import axios from "../axios";
import { handleError } from "../errorHandling";

export const getDashboardStats = async () => {
  try {
    const res = await axios.get<DashboardStatsResp>("/dashboard/stats");
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};
