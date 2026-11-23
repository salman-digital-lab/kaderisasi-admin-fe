import { message } from "antd";
import { removeEmptyValueFromObj } from "../../functions";
import {
  type deleteClubMemberRoleResp,
  type postClubMemberRoleReq,
  type postClubMemberRoleResp,
  type putClubMemberRoleReq,
  type putClubMemberRoleResp,
} from "../../types/services/clubMemberRole";
import { renderNotification } from "../../constants/render";
import axios from "../axios";
import { handleError } from "../errorHandling";

export const createClubMemberRole = async (
  clubId: number,
  props: postClubMemberRoleReq,
) => {
  try {
    const bodyData = removeEmptyValueFromObj(props);
    const res = await axios.post<postClubMemberRoleResp>(
      `/clubs/${clubId}/member-roles`,
      bodyData,
    );
    message.success(renderNotification(res.data.message));
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const updateClubMemberRole = async (
  roleId: number,
  props: putClubMemberRoleReq,
) => {
  try {
    const bodyData = removeEmptyValueFromObj(props);
    const res = await axios.put<putClubMemberRoleResp>(
      `/club-registrations/member-roles/${roleId}`,
      bodyData,
    );
    message.success(renderNotification(res.data.message));
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const deleteClubMemberRole = async (roleId: number) => {
  try {
    const res = await axios.delete<deleteClubMemberRoleResp>(
      `/club-registrations/member-roles/${roleId}`,
    );
    message.success(renderNotification(res.data.message));
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};
