import axios from "../axios";
import type { AccessTicket, RbacRole } from "../../types/model/access";

type ApiResponse<T> = { message: string; data: T };

export async function getRequestableTargets() {
  return (
    await axios.get<ApiResponse<{ roles: RbacRole[] }>>(
      "/rbac/requestable-targets",
    )
  ).data.data;
}

export async function getMyRequests() {
  return (await axios.get<ApiResponse<AccessTicket[]>>("/access-requests")).data
    .data;
}

export async function getMyRequest(id: string) {
  return (await axios.get<ApiResponse<AccessTicket>>(`/access-requests/${id}`))
    .data.data;
}

export async function createAccessRequest(payload: {
  role_code: string;
  reason: string;
}) {
  return (
    await axios.post<ApiResponse<AccessTicket>>("/access-requests", payload)
  ).data.data;
}

export async function cancelMyRequest(id: number) {
  return (
    await axios.post<ApiResponse<AccessTicket>>(`/access-requests/${id}/cancel`)
  ).data.data;
}

export async function getReviewTickets(status?: string) {
  return (
    await axios.get<ApiResponse<AccessTicket[]>>("/tickets/review", {
      params: { status },
    })
  ).data.data;
}

export async function getReviewTicket(id: string) {
  return (await axios.get<ApiResponse<AccessTicket>>(`/tickets/review/${id}`))
    .data.data;
}

export async function approveReviewTicket(id: number) {
  return (
    await axios.post<ApiResponse<AccessTicket>>(`/tickets/review/${id}/approve`)
  ).data.data;
}

export async function rejectReviewTicket(id: number, reason: string) {
  return (
    await axios.post<ApiResponse<AccessTicket>>(
      `/tickets/review/${id}/reject`,
      { rejection_reason: reason },
    )
  ).data.data;
}

export async function getRoles() {
  return (await axios.get<ApiResponse<RbacRole[]>>("/rbac/roles")).data.data;
}
