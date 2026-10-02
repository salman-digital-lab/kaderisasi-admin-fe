import dayjs from "dayjs";
import { DATE_TIME_SECONDS_FORMAT } from "./date-format";

export function formatRegistrationTime(value?: string | null): string {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format(DATE_TIME_SECONDS_FORMAT) : "-";
}
