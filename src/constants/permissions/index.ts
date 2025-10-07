import { ADMIN_ROLE_ENUM } from "../../types/constants/profile";

export const ADMIN_ROLE_PERMISSION = {
  [ADMIN_ROLE_ENUM.SUPER_ADMIN]: [
    "ruangcurhat",
    "akunadmin",
    "anggota",
    "kegiatan",
    "pusatdata",
    "kegiatan.show",
    "leaderboard",
    "klub",
    "formkustom",
  ],
  [ADMIN_ROLE_ENUM.ADMIN]: [
    "ruangcurhat",
    "anggota",
    "kegiatan",
    "pusatdata",
    "kegiatan.show",
    "leaderboard",
    "klub",
    "formkustom",
  ],
  [ADMIN_ROLE_ENUM.ASMEN]: ["anggota", "kegiatan", "leaderboard", "klub", "formkustom"],
  [ADMIN_ROLE_ENUM.KAPRO]: ["kegiatan", "klub", "formkustom"],
  [ADMIN_ROLE_ENUM.KONSELOR]: ["ruangcurhat"],
  [ADMIN_ROLE_ENUM.LEADERBOARD]: ["leaderboard"],
};
