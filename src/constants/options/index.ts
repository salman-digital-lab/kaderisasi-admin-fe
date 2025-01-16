import {
  ACTIVITY_TYPE_ENUM,
  ACTIVITY_CATEGORY_ENUM,
  ACTIVITY_REGISTRANT_STATUS_ENUM,
} from "../../types/constants/activity";
import { USER_LEVEL_ENUM } from "../../types/constants/profile";

export const USER_LEVEL_OPTIONS = [
  {
    value: USER_LEVEL_ENUM.JAMAAH,
    label: "Jamaah",
  },
  {
    value: USER_LEVEL_ENUM.AKTIVIS,
    label: "Aktivis",
  },
  {
    value: USER_LEVEL_ENUM.AKTIVIS_KK,
    label: "Aktivis KK",
  },
  {
    value: USER_LEVEL_ENUM.KADER,
    label: "Kader",
  },
  {
    value: USER_LEVEL_ENUM.KADER_INVENTRA,
    label: "Kader Inventra",
  },
  {
    value: USER_LEVEL_ENUM.KADER_KOMPROF,
    label: "Kader Komprof",
  },
  {
    value: USER_LEVEL_ENUM.KADER_LANJUT,
    label: "Kader Lanjut",
  },
];

export const ACTIVITY_TYPE_OPTIONS = [
  {
    value: ACTIVITY_TYPE_ENUM.COMMON,
    label: "Umum",
  },
  {
    value: ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY,
    label: "Umum - Hanya Pendaftaran",
  },
  {
    value: ACTIVITY_TYPE_ENUM.SSC,
    label: "SSC",
  },
  {
    value: ACTIVITY_TYPE_ENUM.KK,
    label: "Kelompok Keluarga",
  },
  {
    value: ACTIVITY_TYPE_ENUM.LMD,
    label: "LMD",
  },
  {
    value: ACTIVITY_TYPE_ENUM.INVENTRA,
    label: "Inventra",
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
