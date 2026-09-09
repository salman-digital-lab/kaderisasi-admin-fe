import dayjs from "dayjs";

export function formatRegistrationTime(value?: string | null): string {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("DD MMM YYYY HH:mm:ss") : "-";
}
