import axios from "../axios";
import type { Activity } from "../../types/model/activity";

export type SetupReadiness = {
  can_publish: boolean;
  can_open_registration: boolean;
  issues: {
    code: string;
    message: string;
    step: number;
    scope: "publication" | "registration";
  }[];
  actions: {
    can_edit: boolean;
    can_publish: boolean;
    can_manage_registration: boolean;
  };
};
export function setupActivityConfig(
  current: Activity["additional_config"] | undefined,
  allowGuestRegistration: boolean,
): Activity["additional_config"] {
  return {
    ...current,
    custom_selection_status: current?.custom_selection_status ?? [],
    mandatory_profile_data: current?.mandatory_profile_data ?? [],
    additional_questionnaire: current?.additional_questionnaire ?? [],
    allow_guest_registration: allowGuestRegistration,
  };
}
export async function getSetupActivity(id: number): Promise<Activity> {
  return (await axios.get<{ data: Activity }>(`/activities/${id}`)).data.data;
}
export async function saveSetupActivity(
  id: number | undefined,
  data: Partial<Activity>,
): Promise<Activity> {
  const response = id
    ? await axios.put<{ data: Activity }>(`/activities/${id}`, data)
    : await axios.post<{ data: Activity }>("/activities", {
        ...data,
        is_published: 0,
        is_registration_open: false,
      });
  return response.data.data;
}
export async function getActivityReadiness(
  id: number,
): Promise<SetupReadiness> {
  return (
    await axios.get<{ data: SetupReadiness }>(`/activities/${id}/readiness`)
  ).data.data;
}
