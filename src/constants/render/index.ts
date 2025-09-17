import { ACHIEVEMENT_STATUS_ENUM, ACHIEVEMENT_TYPE_ENUM } from "../../types/constants/achievement";
import {
  ACTIVITY_TYPE_ENUM,
  ACTIVITY_CATEGORY_ENUM,
} from "../../types/constants/activity";
import { ADMIN_ROLE_ENUM, USER_LEVEL_ENUM } from "../../types/constants/profile";
import {
  PROBLEM_OWNER_ENUM,
  PROBLEM_STATUS_ENUM,
} from "../../types/constants/ruangcurhat";

export function renderUserLevel(level: USER_LEVEL_ENUM | undefined) {
  switch (level) {
    case USER_LEVEL_ENUM.JAMAAH:
      return "Jamaah";
    case USER_LEVEL_ENUM.AKTIVIS:
      return "Aktivis";
    case USER_LEVEL_ENUM.KADER:
      return "Kader";
    case USER_LEVEL_ENUM.KADER_LANJUT:
      return "Kader Lanjut";
    default:
      "-";
  }
}

export function renderActivityType(level: ACTIVITY_TYPE_ENUM) {
  switch (level) {
    case ACTIVITY_TYPE_ENUM.COMMON:
      return "Umum";
    case ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY:
      return "Umum - Hanya Pendaftaran";
    case ACTIVITY_TYPE_ENUM.SSC:
      return "Spiritual Camp";
    case ACTIVITY_TYPE_ENUM.LMD:
      return "LMD";
    case ACTIVITY_TYPE_ENUM.KOMPROF:
      return "Komunitas Profesi";
    case ACTIVITY_TYPE_ENUM.SPECTRA:
      return "SPECTRA";
    default:
      return "-";
  }
}

export function renderActivityCategory(level: ACTIVITY_CATEGORY_ENUM) {
  switch (level) {
    case ACTIVITY_CATEGORY_ENUM.PELATIHAN:
      return "Pelatihan";
    case ACTIVITY_CATEGORY_ENUM.KEASRAMAAN:
      return "Keasramaan";
    case ACTIVITY_CATEGORY_ENUM.KADERISASI:
      return "Kaderisasi";
    case ACTIVITY_CATEGORY_ENUM.AKTUALISASI_DIRI:
      return "Aktualisasi Diri";
    case ACTIVITY_CATEGORY_ENUM.KEALUMNIAN:
      return "Kealumnian";
    default:
      return "-";
  }
}

export function renderNotification(code: string) {
  switch (code) {
    // Authentication Messages
    case "LOGIN_SUCCESS":
      return "Anda berhasil masuk";
    case "REGISTER_SUCCESS":
      return "Registrasi berhasil";
    case "LOGOUT_SUCCESS":
      return "Anda berhasil keluar";
    case "USER_NOT_FOUND":
      return "Pengguna tidak ditemukan";
    case "WRONG_PASSWORD":
      return "Password salah";
    case "EMAIL_ALREADY_REGISTERED":
      return "Email sudah terdaftar";

    // General Messages
    case "GENERAL_ERROR":
      return "Terjadi kesalahan sistem";
    case "GET_DATA_SUCCESS":
      return "Data berhasil diambil";
    case "CREATE_DATA_SUCCESS":
      return "Data berhasil dibuat";
    case "UPDATE_DATA_SUCCESS":
      return "Data berhasil diubah";
    case "DELETE_DATA_SUCCESS":
      return "Data berhasil dihapus";

    // Activity Messages
    case "ACTIVITY_NOT_FOUND":
      return "Kegiatan tidak ditemukan";
    case "UPLOAD_IMAGE_SUCCESS":
      return "Gambar berhasil diupload";
    case "DELETE_IMAGE_SUCCESS":
      return "Gambar berhasil dihapus";

    // Club Messages
    case "CLUB_NOT_FOUND":
      return "Unit Kegiatan tidak ditemukan";
    case "UPLOAD_LOGO_SUCCESS":
      return "Logo berhasil diupload";
    case "UPLOAD_MEDIA_SUCCESS":
      return "Media berhasil diupload";
    case "INVALID_YOUTUBE_URL":
      return "URL YouTube tidak valid";
    case "ADD_YOUTUBE_MEDIA_SUCCESS":
      return "Media YouTube berhasil ditambahkan";
    case "DELETE_MEDIA_SUCCESS":
      return "Media berhasil dihapus";
    case "MEDIA_NOT_FOUND":
      return "Media tidak ditemukan";
    case "INVALID_MEDIA_INDEX":
      return "Indeks media tidak valid";
    case "REGISTRATION_INFO_UPDATED":
      return "Informasi pendaftaran berhasil diperbarui";

    // Club Registration Messages
    case "CLUB_REGISTRATIONS_RETRIEVED":
      return "Data pendaftaran klub berhasil diambil";
    case "CLUB_REGISTRATION_CREATED":
      return "Pendaftaran klub berhasil dibuat";
    case "CLUB_REGISTRATION_RETRIEVED":
      return "Data pendaftaran klub berhasil diambil";
    case "CLUB_REGISTRATION_UPDATED":
      return "Pendaftaran klub berhasil diperbarui";
    case "CLUB_REGISTRATIONS_BULK_UPDATED":
      return "Pendaftaran klub berhasil diperbarui secara massal";
    case "CLUB_REGISTRATION_DELETED":
      return "Pendaftaran klub berhasil dihapus";
    case "MEMBER_ALREADY_REGISTERED":
      return "Anggota sudah terdaftar di klub ini";

    // Activity Registration Messages
    case "ALREADY_REGISTERED":
      return "Anda sudah terdaftar untuk kegiatan ini";
    case "UNMATCHED_LEVEL":
      return "Level tidak sesuai dengan persyaratan kegiatan";
    case "NO_USERS_FOUND":
      return "Tidak ada pengguna yang ditemukan";
    case "NO_REGISTRATIONS_FOUND":
      return "Tidak ada pendaftaran yang ditemukan";
    case "REGISTRATIONS_NOT_AVAILABLE":
      return "Pendaftaran tidak tersedia";
    case "REGISTRATION_NOT_FOUND":
      return "Pendaftaran tidak ditemukan";

    // Profile Messages
    case "PROFILE_NOT_FOUND":
      return "Profil tidak ditemukan";
    case "UPDATE_MEMBER_SUCCESS":
      return "Data anggota berhasil diperbarui";

    // Leaderboard Messages
    case "ACHIEVEMENT_NOT_FOUND":
      return "Pencapaian tidak ditemukan";
    case "INVALID_STATUS":
      return "Status tidak valid";

    // Admin User Messages
    case "NOT_FOUND":
      return "Data tidak ditemukan";
    case "RESET_PASSWORD_SUCCESS":
      return "Password berhasil direset";

    // Province Messages
    case "PROVINCE_NOT_FOUND":
      return "Provinsi tidak ditemukan";

    // City Messages
    case "CITY_NOT_FOUND":
      return "Kota tidak ditemukan";

    // University Messages
    case "UNIVERSITY_NOT_FOUND":
      return "Universitas tidak ditemukan";

    // Custom Form Messages
    case "CUSTOM_FORM_NOT_FOUND":
      return "Formulir tidak ditemukan";
    case "CUSTOM_FORM_CREATED_SUCCESS":
      return "Formulir berhasil dibuat";
    case "CUSTOM_FORM_UPDATED_SUCCESS":
      return "Formulir berhasil diperbarui";
    case "CUSTOM_FORM_DELETED_SUCCESS":
      return "Formulir berhasil dihapus";
    case "VALIDATION_ERROR":
      return "Terjadi kesalahan validasi";
    case "FEATURE_TYPE_AND_ID_REQUIRED":
      return "Tipe fitur dan ID diperlukan";
    case "CUSTOM_FORM_NOT_FOUND_FOR_FEATURE":
      return "Formulir tidak ditemukan untuk fitur ini";
    case "CUSTOM_FORM_STATUS_UPDATED":
      return "Status formulir berhasil diperbarui";
    case "GET_UNATTACHED_FORMS_SUCCESS":
      return "Formulir yang belum dilampirkan berhasil diambil";
    case "CLUB_ID_REQUIRED":
      return "ID klub diperlukan";
    case "FORM_ALREADY_ATTACHED":
      return "Formulir sudah dilampirkan";
    case "FORM_ATTACHED_TO_CLUB_SUCCESS":
      return "Formulir berhasil dilampirkan ke klub";
    case "FORM_DETACHED_FROM_CLUB_SUCCESS":
      return "Formulir berhasil dilepas dari klub";

    default:
      return code;
  }
}

export function renderProblemOwner(code: PROBLEM_OWNER_ENUM | undefined) {
  switch (code) {
    case PROBLEM_OWNER_ENUM.DIRI_SENDIRI:
      return "Diri Sendiri";
    case PROBLEM_OWNER_ENUM.TEMAN:
      return "Teman";
    default:
      "-";
  }
}

export function renderProblemStatus(code: PROBLEM_STATUS_ENUM | undefined) {
  switch (code) {
    case PROBLEM_STATUS_ENUM.BELUM_DITANGANI:
      return "Belum Ditangani";
    case PROBLEM_STATUS_ENUM.SEDANG_MEMILIH_JADWAL:
      return "Sedang Memilih Jadwal";
    case PROBLEM_STATUS_ENUM.SEDANG_DITANGANI:
      return "Sedang Ditangani";
    case PROBLEM_STATUS_ENUM.SUDAH_DITANGANI:
      return "Sudah Ditangani";
    case PROBLEM_STATUS_ENUM.BATAL:
      return "Batal";

    default:
      "-";
  }
}

export function renderProblemStatusColor(
  code: PROBLEM_STATUS_ENUM | undefined,
) {
  switch (code) {
    case PROBLEM_STATUS_ENUM.BELUM_DITANGANI:
      return undefined;
    case PROBLEM_STATUS_ENUM.SEDANG_MEMILIH_JADWAL:
      return "yellow";
    case PROBLEM_STATUS_ENUM.SEDANG_DITANGANI:
      return "yellow";
    case PROBLEM_STATUS_ENUM.SUDAH_DITANGANI:
      return "blue";
    case PROBLEM_STATUS_ENUM.BATAL:
      return "red";

    default:
      "-";
  }
}

export function renderAdminRole(code: ADMIN_ROLE_ENUM | undefined) {
  switch (code) {
    case ADMIN_ROLE_ENUM.SUPER_ADMIN:
      return "Super Admin";
    case ADMIN_ROLE_ENUM.ADMIN:
      return "Admin";
    case ADMIN_ROLE_ENUM.KONSELOR:
      return "Konselor";
    case ADMIN_ROLE_ENUM.ASMEN:
      return "Asmen";
    case ADMIN_ROLE_ENUM.KAPRO:
      return "Kapro";
    default:
      return "-";
  }
}

export function renderAchievementStatus(
  code: ACHIEVEMENT_STATUS_ENUM | undefined,
) {
  switch (code) {
    case ACHIEVEMENT_STATUS_ENUM.PENDING:
      return "Menunggu Persetujuan";
    case ACHIEVEMENT_STATUS_ENUM.APPROVED:
      return "Diterima";
    case ACHIEVEMENT_STATUS_ENUM.REJECTED:
      return "Ditolak";
    default:
      return "-";
  }
}

export function renderAchievementStatusColor(
  code: ACHIEVEMENT_STATUS_ENUM | undefined,
) {
  switch (code) {
    case ACHIEVEMENT_STATUS_ENUM.PENDING:
      return "blue";
    case ACHIEVEMENT_STATUS_ENUM.APPROVED:
      return "green";
    case ACHIEVEMENT_STATUS_ENUM.REJECTED:
      return "red";
    default:
      return "-";
  }
}

export function renderAchievementType(
  code: ACHIEVEMENT_TYPE_ENUM | undefined,
) {
  switch (code) {
    case ACHIEVEMENT_TYPE_ENUM.KOMPETENSI:
      return "Kompetensi";
    case ACHIEVEMENT_TYPE_ENUM.ORGANISASI:
      return "Organisasi";
    case ACHIEVEMENT_TYPE_ENUM.AKADEMIK:
      return "Akademik";
    default:
      return "-";
  }
}
