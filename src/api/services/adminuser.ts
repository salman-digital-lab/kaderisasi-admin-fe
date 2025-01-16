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
  GetRolesReq,
  GetRolesResp,
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

export const getRoles = async (props: GetRolesReq) => {
  try {
    const urlSearch = new URLSearchParams(props).toString();
    const res = await axios.get<GetRolesResp>("/roles?" + urlSearch);
    return res.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getPermissions = async (props: GetRolesReq) => {
  try {
    const urlSearch = new URLSearchParams(props).toString();
    const res = await axios.get<GetRolesResp>("/permissions?" + urlSearch);
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
