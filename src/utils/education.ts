import {
  normalizeEducationHistory,
  normalizeWorkHistory,
} from "./profile-history";

const DEGREE_LABEL: Record<string, string> = {
  bachelor: "S1",
  master: "S2",
  doctoral: "S3",
};

export function formatCurrentEducation(value: unknown): string {
  const entry = normalizeEducationHistory([value])[0];
  if (!entry) return "-";
  const degree = entry.degree ? DEGREE_LABEL[entry.degree] : "";
  const parts = [entry.institution, entry.faculty, entry.major]
    .filter(Boolean)
    .join(", ");
  return (
    [degree, parts].filter(Boolean).join(" - ") +
      (entry.intake_year ? ` (${entry.intake_year})` : "") || "-"
  );
}

export function currentEducation(
  history: unknown,
  guest?: Record<string, unknown>,
): unknown {
  const entries = normalizeEducationHistory(history);
  const guestEntries = normalizeEducationHistory(guest?.education_history);
  return (
    entries[entries.length - 1] ??
    guest?.current_education ??
    guestEntries[guestEntries.length - 1]
  );
}

export function formatEducationHistory(value: unknown): string {
  return (
    normalizeEducationHistory(value).map(formatCurrentEducation).join("; ") ||
    "-"
  );
}

export function formatWorkHistory(value: unknown): string {
  return (
    normalizeWorkHistory(value)
      .map((entry) => {
        const years =
          entry.start_year !== undefined || entry.end_year !== undefined
            ? `${entry.start_year ?? "?"} - ${entry.end_year ?? "Sekarang"}`
            : "";
        return [entry.job_title, entry.company, years]
          .filter(Boolean)
          .join(" - ");
      })
      .filter(Boolean)
      .join("; ") || "-"
  );
}

export function formatProfileValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (Array.isArray(value))
    return value.map(formatProfileValue).join(", ") || "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
