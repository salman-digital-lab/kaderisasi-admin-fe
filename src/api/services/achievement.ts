import { message } from "antd";
import { toSearchParams } from "../../functions";
import {
  type GetAchievementReq,
  type GetAchievementResp,
  type GetAchievementsReq,
  type ApproveAchievementReq,
  type ApproveAchievementResp,
} from "../../types/services/achievement";
import { type GetAchievementsResp } from "../../types/services/achievement";
import axios from "../axios";
import { handleError } from "../errorHandling";
import { renderNotification } from "../../constants/render";

export const getAchievements = async (props: GetAchievementsReq) => {
  try {
    const urlSearch = toSearchParams(props).toString();
    const res = await axios.get<GetAchievementsResp>(
      "/achievements?" + urlSearch,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};

export const exportAchievements = async () => {
  try {
    const res = await axios.get<Blob>("/achievements/export", {
      responseType: "blob",
    });
    return res.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};

export const getAchievement = async (props: GetAchievementReq) => {
  try {
    const res = await axios.get<GetAchievementResp>(
      "/achievements/" + props.id,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    return undefined;
  }
};

export const approveAchievement = async (props: ApproveAchievementReq) => {
  const res = await axios.put<ApproveAchievementResp>(
    "/achievements/" + props.id + "/approve-reject",
    {
      status: props.status,
      score: props.score,
      remark: props.remark,
    },
  );
  message.success(renderNotification(res.data.message));
  return res.data.data;
};
