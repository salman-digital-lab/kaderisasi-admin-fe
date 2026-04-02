import type { EducationEntry } from "../types/model/members";

const DEGREE_LABEL: Record<string, string> = {
  bachelor: "S1",
  master: "S2",
  doctoral: "S3",
};

export function formatCurrentEducation(entry: EducationEntry | undefined): string {
  if (!entry?.institution) return "-";
  const degree = DEGREE_LABEL[entry.degree] ?? entry.degree;
  const parts = [entry.institution, entry.major].filter(Boolean).join(", ");
  return `${degree} - ${parts}${entry.intake_year ? ` (${entry.intake_year})` : ""}`;
}
