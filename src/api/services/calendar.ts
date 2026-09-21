import axios from "../axios";
import type { CalendarEvent, CalendarInput } from "../../types/model/calendar";

export async function getCalendarEvents(
  start: string,
  end: string,
  signal?: AbortSignal,
): Promise<CalendarEvent[]> {
  const response = await axios.get<{ data: CalendarEvent[] }>(
    "/admin/calendar-events",
    { params: { start, end }, signal },
  );
  return response.data.data;
}

export async function saveCalendarEvent(
  id: number | null,
  input: CalendarInput,
): Promise<CalendarEvent> {
  const response =
    id === null
      ? await axios.post<{ data: CalendarEvent }>(
          "/admin/calendar-events",
          input,
        )
      : await axios.put<{ data: CalendarEvent }>(
          `/admin/calendar-events/${id}`,
          input,
        );
  return response.data.data;
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  await axios.delete(`/admin/calendar-events/${id}`);
}
