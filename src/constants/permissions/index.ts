import { ADMIN_ROLE_ENUM } from "../../types/constants/profile";

export const ADMIN_ROLE_PERMISSION = {
  [ADMIN_ROLE_ENUM.SUPER_ADMIN]: [
    "ruangcurhat",
    "akunadmin",
    "anggota",
    "kegiatan",
    "pusatdata",
  ],
  [ADMIN_ROLE_ENUM.ADMIN]: ["ruangcurhat", "anggota", "kegiatan", "pusatdata"],
  [ADMIN_ROLE_ENUM.ASMEN]: ["anggota", "kegiatan"],
  [ADMIN_ROLE_ENUM.KAPRO]: ["kegiatan"],
  [ADMIN_ROLE_ENUM.KONSELOR]: ["ruangcurhat"],
};
