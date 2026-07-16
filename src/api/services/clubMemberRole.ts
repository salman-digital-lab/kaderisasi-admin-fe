import { notification } from "antd";
import { removeEmptyValueFromObj } from "../../functions";
import {
  deleteClubMemberRoleResp,
  getClubMemberRoleSuggestionsResp,
  getClubMemberRolesResp,
  postClubMemberRoleReq,
  postClubMemberRoleResp,
  putClubMemberRoleReq,
  putClubMemberRoleResp,
} from "../../types/services/clubMemberRole";
import { renderNotification } from "../../constants/render";
import axios from "../axios";
import { handleError } from "../errorHandling";

export const getClubMemberRoles = async (clubId: number) => {
  try {
    const res = await axios.get<getClubMemberRolesResp>(
      `/clubs/${clubId}/member-roles`,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const getClubMemberRoleSuggestions = async (clubId: number) => {
  try {
    const res = await axios.get<getClubMemberRoleSuggestionsResp>(
      `/clubs/${clubId}/member-role-suggestions`,
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

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
    notification.success({
      title: "Berhasil",
      description: renderNotification(res.data.message),
    });
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
    notification.success({
      title: "Berhasil",
      description: renderNotification(res.data.message),
    });
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
    notification.success({
      title: "Berhasil",
      description: renderNotification(res.data.message),
    });
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};
