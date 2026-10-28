import { P3riForm, P3riStatus } from "../../types/model/p3ri";

export const P3RI_STATUSES: P3riStatus[] = ["terdaftar", "diterima"];

export const P3RI_STATUS_LABELS: Record<P3riStatus, string> = {
  terdaftar: "Terdaftar",
  diterima: "Diterima",
};

export const P3RI_STATUS_COLORS: Record<P3riStatus, string> = {
  terdaftar: "default",
  diterima: "success",
};

export const P3RI_STATUS_OPTIONS = P3RI_STATUSES.map((value) => ({
  value,
  label: P3RI_STATUS_LABELS[value],
}));

export const divisionName = (form: P3riForm | undefined, code: string) =>
  form?.divisions.find((division) => division.code === code)?.name ?? code;

/** Renders a stored answer as text. */
export const answerText = (value: unknown): string => {
  if (value === undefined || value === null || value === "") return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object")
    return Object.entries(value as Record<string, unknown>)
      .map(([row, column]) => `${row}: ${String(column)}`)
      .join("\n");
  return String(value);
};
