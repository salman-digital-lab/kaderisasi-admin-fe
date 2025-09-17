import { ACHIEVEMENT_STATUS_ENUM, ACHIEVEMENT_TYPE_ENUM } from "../../types/constants/achievement";
import {
  ACTIVITY_TYPE_ENUM,
  ACTIVITY_CATEGORY_ENUM,
  ACTIVITY_REGISTRANT_STATUS_ENUM,
} from "../../types/constants/activity";
import {
  ADMIN_ROLE_ENUM,
  USER_LEVEL_ENUM,
} from "../../types/constants/profile";
import { PROBLEM_STATUS_ENUM } from "../../types/constants/ruangcurhat";

export const USER_LEVEL_OPTIONS = [
  {
    value: USER_LEVEL_ENUM.JAMAAH,
    label: "Jamaah",
    title: "Jamaah umum/mahasiswa/masyarakat umum",
  },
  {
    value: USER_LEVEL_ENUM.AKTIVIS,
    label: "Aktivis",
    title: "Jamaah yang sudah menyelesaikan SSC",
  },
  {
    value: USER_LEVEL_ENUM.KADER,
    label: "Kader",
    title: "Aktivis yang sudah menyelesaikan LMD",
  },
  {
    value: USER_LEVEL_ENUM.KADER_LANJUT,
    label: "Kader Lanjut",
    title: "Kader yang sudah menyelesaikan Spectra",
  },
];

export const ACTIVITY_TYPE_OPTIONS = [
  {
    value: ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY,
    label: "Umum - Hanya Pendaftaran",
    title:
      "Hanya memakai fitur publikasi dan pendaftaran saja, tidak memerlukan fitur penuh manajemen kegiatan",
  },
  {
    value: ACTIVITY_TYPE_ENUM.COMMON,
    label: "Umum",
  },
  {
    value: ACTIVITY_TYPE_ENUM.SSC,
    label: "SSC",
  },
  {
    value: ACTIVITY_TYPE_ENUM.LMD,
    label: "LMD",
  },
  {
    value: ACTIVITY_TYPE_ENUM.KOMPROF,
    label: "Komprof",
  },
  {
    value: ACTIVITY_TYPE_ENUM.SPECTRA,
    label: "Spectra",
  },
];

export const ACTIVITY_CATEGORY_OPTIONS = [
  {
    value: ACTIVITY_CATEGORY_ENUM.PELATIHAN,
    label: "Pelatihan",
  },
  {
    value: ACTIVITY_CATEGORY_ENUM.KEASRAMAAN,
    label: "Keasramaan",
  },
  {
    value: ACTIVITY_CATEGORY_ENUM.KADERISASI,
    label: "Kaderisasi",
  },
  {
    value: ACTIVITY_CATEGORY_ENUM.AKTUALISASI_DIRI,
    label: "Aktualisasi Diri",
  },
  {
    value: ACTIVITY_CATEGORY_ENUM.KEALUMNIAN,
    label: "Kealumnian",
  },
];

export const ACTIVITY_REGISTRANT_STATUS_OPTIONS = [
  {
    value: ACTIVITY_REGISTRANT_STATUS_ENUM.TERDAFTAR,
    label: "TERDAFTAR",
  },
  {
    value: ACTIVITY_REGISTRANT_STATUS_ENUM.DITERIMA,
    label: "DITERIMA",
  },
  {
    value: ACTIVITY_REGISTRANT_STATUS_ENUM.LULUS_KEGIATAN,
    label: "LULUS KEGIATAN",
  },
  {
    value: ACTIVITY_REGISTRANT_STATUS_ENUM.TIDAK_LULUS,
    label: "TIDAK LULUS",
  },
  {
    value: ACTIVITY_REGISTRANT_STATUS_ENUM.TIDAK_DITERIMA,
    label: "TIDAK DITERIMA",
  },
];

export const CLUB_REGISTRATION_STATUS_OPTIONS = [
  {
    value: "PENDING",
    label: "Menunggu",
  },
  {
    value: "APPROVED",
    label: "Diterima",
  },
  {
    value: "REJECTED",
    label: "Ditolak",
  },
];

export const GENDER_OPTION = [
  {
    label: "Laki-Laki",
    value: "M",
  },
  {
    label: "Perempuan",
    value: "F",
  },
];

export const ADMIN_ROLE_OPTIONS = [
  {
    label: "Super Admin",
    value: ADMIN_ROLE_ENUM.SUPER_ADMIN,
  },
  {
    label: "Admin",
    value: ADMIN_ROLE_ENUM.ADMIN,
  },
  {
    label: "Asmen",
    value: ADMIN_ROLE_ENUM.ASMEN,
  },
  {
    label: "Kapro",
    value: ADMIN_ROLE_ENUM.KAPRO,
  },
  {
    label: "Konselor",
    value: ADMIN_ROLE_ENUM.KONSELOR,
  },
  {
    label: "Leaderboard",
    value: ADMIN_ROLE_ENUM.LEADERBOARD,
  },
];

export const PROBLEM_STATUS_OPTIONS = [
  {
    label: "Belum Ditangani",
    value: PROBLEM_STATUS_ENUM.BELUM_DITANGANI,
  },
  {
    label: "Sedang Memilih Jadwal",
    value: PROBLEM_STATUS_ENUM.SEDANG_MEMILIH_JADWAL,
  },
  {
    label: "Sedang Ditangani",
    value: PROBLEM_STATUS_ENUM.SEDANG_DITANGANI,
  },
  {
    label: "Sudah Ditangani",
    value: PROBLEM_STATUS_ENUM.SUDAH_DITANGANI,
  },
  {
    label: "Batal",
    value: PROBLEM_STATUS_ENUM.BATAL,
  },
];

export const ACHIEVEMENT_STATUS_OPTIONS = [
  {
    label: "Menunggu Persetujuan",
    value: ACHIEVEMENT_STATUS_ENUM.PENDING,
  },
  {
    label: "Diterima",
    value: ACHIEVEMENT_STATUS_ENUM.APPROVED,
  },
  {
    label: "Ditolak",
    value: ACHIEVEMENT_STATUS_ENUM.REJECTED,
  },
];

export const ACHIEVEMENT_TYPE_OPTIONS = [
  {
    label: "Kompetensi",
    value: ACHIEVEMENT_TYPE_ENUM.KOMPETENSI,
  },
  {
    label: "Organisasi",
    value: ACHIEVEMENT_TYPE_ENUM.ORGANISASI,
  },
  {
    label: "Akademik",
    value: ACHIEVEMENT_TYPE_ENUM.AKADEMIK,
  },
];
