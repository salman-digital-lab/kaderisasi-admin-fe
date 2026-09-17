import axios from "../axios";
import type { FormSchema } from "../../types/model/customForm";

export interface ResponseAttachment {
  id: string;
  name: string;
  download_name: string;
  mime_type: string;
  size: number;
}
export interface SavedFormResponse {
  id: string;
  user_id: number | null;
  created_at: string;
  form_snapshot: { title: string; schema: FormSchema };
  answers: Record<string, unknown>;
  attachments: ResponseAttachment[];
}
export async function getFormResponses(
  id: number,
  page: number,
): Promise<{ data: SavedFormResponse[]; total: number }> {
  return (
    await axios.get<{ data: { data: SavedFormResponse[]; total: number } }>(
      `/custom-forms/${id}/responses`,
      { params: { page, per_page: 20 } },
    )
  ).data.data;
}
export async function getFormResponse(
  id: number,
  responseId: string,
): Promise<SavedFormResponse> {
  return (
    await axios.get<{ data: SavedFormResponse }>(
      `/custom-forms/${id}/responses/${responseId}`,
    )
  ).data.data;
}
export async function downloadFormFile(
  id: number,
  file: ResponseAttachment,
): Promise<void> {
  const response = await axios.get<Blob>(
    `/custom-forms/${id}/files/${file.id}`,
    { responseType: "blob" },
  );
  saveBlob(response.data, file.download_name);
}
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function downloadAttachmentById(
  formId: number,
  attachmentId: string,
): Promise<void> {
  const response = await axios.get<Blob>(
    `/custom-forms/${formId}/files/${attachmentId}`,
    { responseType: "blob" },
  );
  const header = String(response.headers["content-disposition"] ?? "");
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
  const plain = /filename="?([^";]+)"?/i.exec(header)?.[1];
  saveBlob(
    response.data,
    encoded
      ? decodeURIComponent(encoded)
      : (plain ??
          (response.data.type === "application/pdf"
            ? "berkas.pdf"
            : "gambar.webp")),
  );
}
export async function exportFormResponses(id: number): Promise<void> {
  const response = await axios.get<Blob>(
    `/custom-forms/${id}/export-responses`,
    { responseType: "blob" },
  );
  saveBlob(response.data, "respons-formulir.xlsx");
}
