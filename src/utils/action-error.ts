import { isAxiosError } from "axios";

const messages: Record<string, string> = {
  CUSTOM_FORM_NOT_FOUND:
    "Formulir tidak ditemukan. Kembali ke daftar formulir dan pilih formulir yang tersedia.",
  INVALID_FORM_SCHEMA:
    "Pengaturan formulir belum valid. Periksa pertanyaan dan alur sebelum menyimpan kembali.",
  INVALID_ACTIVITY_FORM_SCHEMA:
    "Formulir kegiatan belum valid. Periksa pertanyaan dan alur sebelum menyimpan kembali.",
  FORM_RESPONSE_NOT_FOUND:
    "Respons tidak ditemukan. Tutup detail ini, lalu muat ulang daftar respons.",
  STORAGE_UNAVAILABLE:
    "Penyimpanan berkas sedang tidak tersedia. Coba lagi nanti atau hubungi admin.",
  ADMIN_ORIGIN_NOT_CONFIGURED:
    "Ekspor belum tersedia karena alamat situs admin belum dikonfigurasi. Hubungi pengelola sistem.",
  FORM_HAS_ATTACHMENTS:
    "Formulir tidak dapat dihapus karena masih memiliki berkas. Unggahan yang belum dikirim dibersihkan setelah 24 jam; berkas yang sudah dikirim tetap disimpan.",
  FORM_HAS_RESPONSES:
    "Formulir sudah memiliki respons. Tutup penerimaan respons untuk menghentikan pengisian; formulir tidak dapat dihapus atau dipindahkan.",
  ATTACHMENT_NOT_FOUND:
    "Berkas tidak ditemukan atau tidak tersedia untuk formulir ini.",
  LAST_SUPER_ADMIN_REQUIRED:
    "Minimal satu Super Admin aktif harus tetap tersedia. Tetapkan Super Admin lain sebelum melepas peran ini atau menonaktifkan akun.",
  SELF_DEACTIVATION_NOT_ALLOWED: "Anda tidak dapat menonaktifkan akun sendiri.",
  SUPER_ADMIN_REQUIRED:
    "Pengelolaan akun memerlukan peran Super Admin. Perbarui akses Anda.",
  UNKNOWN_ROLE:
    "Salah satu peran sudah tidak tersedia. Muat ulang daftar peran sebelum menyimpan.",
  EMAIL_ALREADY_REGISTERED:
    "Email ini sudah digunakan. Gunakan email lain atau ubah akun yang sudah ada.",
  INVALID_CLUB_COURSES:
    "Pilihan kelas tidak valid. Muat ulang pilihan dan coba lagi.",
  INVALID_COURSE_PROGRESS_FILTER:
    "Filter kelas tidak valid. Kelas terkait mungkin sudah berubah; reset filter lalu coba lagi.",
  INVALID_ACTIVITY_COURSES:
    "Pilihan kelas tidak valid atau kelas sudah dihapus. Muat ulang daftar kelas lalu coba lagi.",
  INVALID_ACTIVITY_COURSE_FILTER:
    "Kelas terkait telah berubah. Muat ulang peserta dan pilih kembali filter progres.",
  SCORING_REVISION_CONFLICT:
    "Data penilaian telah berubah. Muat ulang halaman sebelum menyimpan atau menerbitkan lagi.",
  SCORING_RUBRIC_LOCKED:
    "Rubrik sudah digunakan untuk menilai peserta dan tidak dapat diubah.",
  SCORING_INCOMPLETE:
    "Lengkapi semua aspek peserta yang dipilih sebelum menerbitkan.",
  SCORING_TEMPLATE_MISMATCH:
    "Templat bukan milik kegiatan ini atau sudah kedaluwarsa. Unduh templat terbaru.",
  SCORING_IMPORT_CHANGED_REVIEW_AGAIN:
    "Data berubah sejak pratinjau. Periksa ulang berkas sebelum menyimpan.",
  SCORING_NOT_PUBLISHED:
    "Hasil belum diterbitkan atau sudah ditarik. Muat ulang halaman.",
  ACTIVITY_HAS_SCORING_HISTORY:
    "Kegiatan memiliki riwayat penilaian yang harus dipertahankan dan tidak dapat dihapus.",
  DELETE_CONFIRMATION_MISMATCH:
    "Nama konfirmasi tidak cocok. Muat ulang detail lalu ketik nama persis seperti yang ditampilkan.",
  ACTIVITY_HAS_CERTIFICATE_HISTORY:
    "Kegiatan memiliki riwayat penerbitan atau persetujuan sertifikat dan tidak dapat dihapus. Kembalikan kegiatan ke draf jika ingin menyembunyikannya.",
  ACTIVITY_NOT_FOUND:
    "Kegiatan sudah dihapus atau tidak ditemukan. Muat ulang halaman.",
  CLUB_NOT_FOUND:
    "Klub sudah dihapus atau tidak ditemukan. Muat ulang halaman.",
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
    "Penayangan memerlukan Asisten Manager Program atau Super Admin. Perubahan belum disimpan.",
  ACTIVITY_REGISTRATION_CONTROL_FORBIDDEN:
    "Pembukaan atau penutupan pendaftaran memerlukan Asisten Manager Program atau Super Admin.",
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
