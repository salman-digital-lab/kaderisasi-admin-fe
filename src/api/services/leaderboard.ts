import { toSearchParams } from "../../functions";
import {
  type GetMonthlyLeaderboardReq,
  type GetMonthlyLeaderboardResp,
} from "../../types/services/leaderboard";
import axios from "../axios";
import { handleError } from "../errorHandling";

export const getMonthlyLeaderboard = async (
  props: GetMonthlyLeaderboardReq,
) => {
  try {
    const urlSearch = toSearchParams(props).toString();
    const res = await axios.get<GetMonthlyLeaderboardResp>(
      "/leaderboards/monthly?" + urlSearch,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};
