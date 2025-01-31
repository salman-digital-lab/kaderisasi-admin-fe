import axios from "../axios";
import { handleError } from "../errorHandling";

import { removeEmptyValueFromObj } from "../../functions";
import { notification } from "antd";
import { renderNotification } from "../../constants/render";
import {
  GetAdminsUserReq,
  GetAdminUserResp,
  GetAdminUsersReq,
  GetAdminUsersResp,
  PostAdminUserReq,
  PostAdminUserResp,
  PutAdminUserPasswordReq,
  PutAdminUserPasswordResp,
  PutAdminUserReq,
  PutAdminUserResp,
} from "../../types/services/adminuser";

export const getAdminUsers = async (props: GetAdminUsersReq) => {
  try {
    const urlSearch = new URLSearchParams(props).toString();
    const res = await axios.get<GetAdminUsersResp>("/admin-users?" + urlSearch);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getAdminUser = async (props: GetAdminsUserReq) => {
  try {
    const res = await axios.get<GetAdminUserResp>("/admin-users/" + props.id);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const postAdminUser = async (props: PostAdminUserReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props);

    const res = await axios.post<PostAdminUserResp>("/admin-users", bodyData);

    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const putAdminUser = async (props: PutAdminUserReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props.data);

    const res = await axios.put<PutAdminUserResp>(
      "/admin-users/" + props.id,
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

export const putAdminUserPassword = async (props: PutAdminUserPasswordReq) => {
  try {
    const bodyData = removeEmptyValueFromObj(props.data);

    const res = await axios.put<PutAdminUserPasswordResp>(
      "/admin-users/" + props.id + "/password",
      bodyData,
    );

    notification.success({
      message: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return;
  } catch (error) {
    handleError(error);
  }
};
