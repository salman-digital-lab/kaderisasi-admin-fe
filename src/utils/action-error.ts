import { isAxiosError } from "axios";

const messages: Record<string, string> = {
  ACTIVITY_DESCRIPTION_REQUIRED:
    "Kegiatan yang tayang wajib memiliki deskripsi. Isi deskripsi sebelum menyimpan.",
  ACTIVITY_POSTER_REQUIRED:
    "Kegiatan yang tayang wajib memiliki poster. Unggah penggantinya sebelum menghapus poster terakhir.",
  DUPLICATE_OPEN_REQUEST:
    "Anda sudah mengajukan peran ini. Buka pengajuan yang masih menunggu untuk melihat statusnya.",
  TICKET_ALREADY_TERMINAL:
    "Pengajuan ini sudah diproses. Muat ulang untuk melihat status terbaru.",
  ROLE_NOT_REQUESTABLE:
    "Peran ini tidak dapat diajukan. Muat ulang daftar peran.",
  ACTIVITY_PUBLICATION_FORBIDDEN:
    "Penayangan memerlukan Admin Operasional atau Super Admin. Perubahan belum disimpan.",
  ACTIVITY_REGISTRATION_CONTROL_FORBIDDEN:
    "Pembukaan atau penutupan pendaftaran memerlukan Admin Operasional atau Super Admin.",
  ACTIVITY_NOT_READY:
    "Masih ada informasi yang perlu dilengkapi. Periksa daftar di bawah sebelum mencoba lagi.",
  CLOSE_REGISTRATION_BEFORE_FORM_CHANGE:
    "Minta admin menutup pendaftaran sebelum menonaktifkan atau melepas formulir.",
  FORBIDDEN:
    "Akses Anda tidak mengizinkan tindakan ini. Muat ulang akses atau hubungi admin.",
};
export function actionError(
  error: unknown,
  fallback = "Perubahan belum tersimpan. Periksa koneksi lalu coba lagi.",
): string {
  if (isAxiosError<{ message?: string }>(error))
    return messages[error.response?.data.message ?? ""] ?? fallback;
  return fallback;
}
