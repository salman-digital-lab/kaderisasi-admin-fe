import axios from "../../api/axios";

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  link_label: string | null;
  link_url: string | null;
  published_at: string;
  read_at: string | null;
}
export interface InboxPage {
  items: NotificationItem[];
  next_cursor: string;
  cutoff: string;
}
export async function notificationRequest<T>(
  path = "",
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await axios.request<{ data: T }>({
    url: `/notifications${path}`,
    method,
    data: body,
    signal,
  });
  return response.data.data;
}
export function notificationChanged(): void {
  window.dispatchEvent(new Event("notifications-changed"));
}
