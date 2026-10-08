import { removeEmptyValueFromObj } from "../../functions";
import {
  GetMonthlyLeaderboardReq,
  GetMonthlyLeaderboardResp,
} from "../../types/services/leaderboard";
import axios from "../axios";
import { handleError } from "../errorHandling";

export const getMonthlyLeaderboard = async (
  props: GetMonthlyLeaderboardReq,
) => {
  try {
    const propsData = removeEmptyValueFromObj(props);
    const urlSearch = new URLSearchParams(propsData).toString();
    const res = await axios.get<GetMonthlyLeaderboardResp>(
      "/leaderboards/monthly?" + urlSearch,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};
