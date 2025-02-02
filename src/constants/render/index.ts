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
    case "LOGIN_SUCCESS":
      return "Anda berhasil masuk";
    case "USER_NOT_FOUND":
      return "Anda tidak terdaftar";
    case "UPDATE_DATA_SUCCESS":
      return "Data berhasil diubah";
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
