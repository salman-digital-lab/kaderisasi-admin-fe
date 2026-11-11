import type { MemberAuditLogList } from "../../types/model/member-audit";
import axios from "../axios";
import { handleError } from "../errorHandling";

export const getMemberAuditLogs = async (
  profileId: string,
  page: number,
  perPage: number,
) => {
  try {
    const res = await axios.get<{ data: MemberAuditLogList }>(
      `/profiles/${profileId}/audit-logs`,
      { params: { page, per_page: perPage } },
    );
    return res.data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};
