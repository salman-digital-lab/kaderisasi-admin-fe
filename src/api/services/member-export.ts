import axios from "../axios";

export type MemberExportFilters = {
  search: string;
  badge: string;
  member_id: string;
  education_institution: string;
};

export type MemberExportPreview = {
  total: number;
  columns: { key: string; label: string }[];
};

export type MemberExportFormat = "xlsx" | "csv";

function filterQuery(filters: MemberExportFilters): string {
  return new URLSearchParams({
    search: filters.search,
    badge: filters.badge,
    member_id: filters.member_id,
    education_institution: filters.education_institution,
  }).toString();
}

export async function getMemberExportPreview(
  filters: MemberExportFilters,
): Promise<MemberExportPreview> {
  const response = await axios.get<{ data: MemberExportPreview }>(
    `/profiles/export/preview?${filterQuery(filters)}`,
  );
  return response.data.data;
}

export async function downloadMemberExport(
  filters: MemberExportFilters,
  columns: string[],
  format: MemberExportFormat,
): Promise<void> {
  const response = await axios.post<Blob>(
    `/profiles/export?${filterQuery(filters)}`,
    { columns, format },
    { responseType: "blob", timeout: 120000 },
  );
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `anggota.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
