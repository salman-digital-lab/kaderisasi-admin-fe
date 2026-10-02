import dayjs from "dayjs";
import type { ConfigType } from "dayjs";
import { EMPTY_VALUE } from "../theme/tokens";

/** Display formats. API payloads keep using ISO `YYYY-MM-DD`. */
export const DATE_FORMAT = "DD MMM YYYY";
export const DATE_LONG_FORMAT = "DD MMMM YYYY";
export const DATE_TIME_FORMAT = "DD MMM YYYY, HH:mm";
export const DATE_TIME_SECONDS_FORMAT = "DD MMM YYYY, HH:mm:ss";
export const MONTH_FORMAT = "MMMM YYYY";
export const MONTH_SHORT_FORMAT = "MMM YYYY";

const format = (value: ConfigType, pattern: string): string => {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  const date = dayjs(value);
  return date.isValid() ? date.format(pattern) : EMPTY_VALUE;
};

export const formatDate = (value: ConfigType): string =>
  format(value, DATE_FORMAT);

export const formatLongDate = (value: ConfigType): string =>
  format(value, DATE_LONG_FORMAT);

export const formatDateTime = (value: ConfigType): string =>
  format(value, DATE_TIME_FORMAT);

export const formatMonth = (value: ConfigType): string =>
  format(value, MONTH_FORMAT);
