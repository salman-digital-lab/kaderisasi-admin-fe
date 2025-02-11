import { notification } from "antd";
import { removeEmptyValueFromObj } from "../../functions";
import {
  GetAchievementReq,
  GetAchievementResp,
  GetAchievementsReq,
  PutAchievementReq,
  PutAchievementResp,
  ApproveAchievementReq,
  ApproveAchievementResp,
} from "../../types/services/achievement";
import { GetAchievementsResp } from "../../types/services/achievement";
import axios from "../axios";
import { handleError } from "../errorHandling";
import { renderNotification } from "../../constants/render";

export const getAchievements = async (props: GetAchievementsReq) => {
  try {
    const propsData = removeEmptyValueFromObj(props);
    const urlSearch = new URLSearchParams(propsData).toString();
    const res = await axios.get<GetAchievementsResp>(
      "/achievements?" + urlSearch,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
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
  }
};

export const putAchievement = async (props: PutAchievementReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props.data);
    const res = await axios.put<PutAchievementResp>(
      "/achievements/" + props.id,
      bodyData,
    );
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const approveAchievement = async (props: ApproveAchievementReq) => {
  try {
    const res = await axios.put<ApproveAchievementResp>(
      "/achievements/" + props.id + "/approve-reject",
      { status: props.status },
    );
    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};
