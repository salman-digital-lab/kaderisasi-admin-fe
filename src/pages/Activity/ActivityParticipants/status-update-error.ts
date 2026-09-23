import { isAxiosError } from "axios";
import { actionError } from "../../../utils/action-error";

interface ValidationIssue {
  field?: string;
  rule?: string;
  message?: string;
}

interface StatusErrorResponse {
  message?: string;
  errors?: ValidationIssue[];
}

export function statusUpdateError(
  error: unknown,
  emails: string[] = [],
): string {
  const fallback =
    "Status belum diubah. Coba lagi atau hubungi pengelola sistem.";
  if (!isAxiosError<StatusErrorResponse>(error)) {
    return error instanceof Error ? error.message : fallback;
  }
  if (!error.response) {
    return "Tidak dapat menghubungi server. Periksa koneksi internet lalu coba lagi.";
  }
  const { status, data } = error.response;
  if (status === 422) {
    const issues = Array.isArray(data?.errors) ? data.errors : [];
    const details = issues.map((issue): string => {
      const match = /^emails\.(\d+)$/.exec(issue.field ?? "");
      if (match) {
        const index = Number(match[1]);
        const email = emails[index];
        return `Email ke-${index + 1}${email ? ` (${email})` : ""}: format email tidak valid.`;
      }
      if (issue.field === "status") {
        return "Pilih status peserta yang valid.";
      }
      if (issue.field === "emails") {
        return "Masukkan daftar email peserta yang valid.";
      }
      if (issue.field?.startsWith("registrations_id")) {
        return "Pilihan peserta tidak valid. Muat ulang daftar dan pilih kembali peserta.";
      }
      return issue.message || "Periksa kembali data yang dimasukkan.";
    });
    return `Status belum diubah. ${[...new Set(details)].join(" ") || "Data tidak valid. Periksa daftar email dan status yang dipilih."}`;
  }
  if (data?.message === "NO_USERS_FOUND") {
    return "Tidak ada akun yang cocok dengan daftar email tersebut. Periksa kembali alamat email peserta.";
  }
  if (data?.message === "NO_REGISTRATIONS_FOUND") {
    return "Akun ditemukan, tetapi tidak terdaftar dalam kegiatan ini. Periksa kegiatan dan daftar email peserta.";
  }
  if (status === 401)
    return "Sesi berakhir. Masuk kembali lalu ulangi perubahan status.";
  return actionError(error, fallback);
}
