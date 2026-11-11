import { GENDER_OPTION, USER_LEVEL_OPTIONS } from "../constants/options";
import { EMPTY_VALUE } from "../theme/tokens";
import type {
  MemberAuditAction,
  MemberAuditChange,
} from "../types/model/member-audit";
import { formatDate } from "./date-format";

export const AUDIT_ACTION_LABEL: Record<MemberAuditAction, string> = {
  created: "Anggota ditambahkan",
  profile_updated: "Data diubah",
  regional_assignment_updated: "Penugasan regional diubah",
  credentials_updated: "Email atau kata sandi diubah",
  account_generated: "Akun dibuat",
  deleted: "Anggota dihapus",
};

const FIELD_LABEL: Record<string, string> = {
  name: "Nama Lengkap",
  gender: "Jenis Kelamin",
  personal_id: "Nomor Identitas",
  picture: "Foto",
  whatsapp: "WhatsApp",
  line: "ID Line",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  province_id: "Provinsi",
  city_id: "Kota / Kabupaten",
  university_id: "Kampus",
  major: "Jurusan",
  intake_year: "Tahun Masuk",
  level: "Jenjang",
  birth_date: "Tanggal Lahir",
  origin_province_id: "Provinsi Asal",
  origin_city_id: "Kota / Kabupaten Asal",
  country: "Negara",
  badges: "Lencana",
  education_history: "Riwayat Pendidikan",
  work_history: "Riwayat Pekerjaan",
  email: "Email",
  password: "Kata Sandi",
  member_id: "ID Anggota",
  account_status: "Status Akun",
  extra_data: "Data Tambahan",
  "extra_data.preferred_name": "Nama Panggilan",
  "extra_data.address_detail": "Alamat Detail",
  "extra_data.salman_activity_history": "Riwayat Aktivitas Salman",
  "extra_data.current_activity_focus": "Fokus Aktivitas Saat Ini",
  "extra_data.alumni_regional_assignment": "Penugasan Regional Alumni",
};

const ACCOUNT_STATUS: Record<string, string> = {
  active: "Aktif",
  no_account: "Tanpa Akun",
};

const DEGREE: Record<string, string> = {
  high_school: "SMP/SMA/SMK",
  diploma: "D3",
  bachelor: "S1",
  master: "S2",
  doctoral: "S3",
};

/** The Indonesian label of an audited field; unknown fields keep their key. */
export const auditFieldLabel = (field: string): string =>
  FIELD_LABEL[field] ?? field.replace(/^extra_data\./, "");

const plain = (value: unknown): string => {
  if (value == null || value === "") return EMPTY_VALUE;
  if (Array.isArray(value))
    return value.length ? value.map(plain).join("; ") : EMPTY_VALUE;
  if (typeof value === "object") {
    const parts = Object.values(value as Record<string, unknown>)
      .filter((part) => part != null && part !== "")
      .map(plain);
    return parts.length ? parts.join(", ") : EMPTY_VALUE;
  }
  return String(value);
};

/**
 * A recorded value as text. `names` resolves ids the page already knows
 * (provinces); other ids are shown as recorded.
 */
export const auditValue = (
  field: string,
  value: unknown,
  names: { provinces?: Record<number, string> } = {},
): string => {
  if (value == null || value === "") return EMPTY_VALUE;
  switch (field) {
    case "gender":
      return (
        GENDER_OPTION.find((option) => option.value === value)?.label ??
        plain(value)
      );
    case "level":
      return (
        USER_LEVEL_OPTIONS.find((option) => option.value === value)?.label ??
        plain(value)
      );
    case "account_status":
      return ACCOUNT_STATUS[String(value)] ?? plain(value);
    case "birth_date":
      return formatDate(String(value));
    case "education_history":
      return plain(
        Array.isArray(value)
          ? value.map((entry: { degree?: string }) =>
              entry && typeof entry === "object" && entry.degree
                ? { ...entry, degree: DEGREE[entry.degree] ?? entry.degree }
                : entry,
            )
          : value,
      );
    case "province_id":
    case "origin_province_id":
      return names.provinces?.[Number(value)] ?? `ID ${plain(value)}`;
    case "city_id":
    case "origin_city_id":
    case "university_id":
      return `ID ${plain(value)}`;
    default:
      return plain(value);
  }
};

export type AuditLine = { field: string; label: string; text: string };

/** The changes of one entry as readable lines, in a stable order. */
export const auditLines = (
  changes: Record<string, MemberAuditChange>,
  names: { provinces?: Record<number, string> } = {},
): AuditLine[] =>
  Object.entries(changes)
    .map(([field, change]) => {
      const label = auditFieldLabel(field);
      if (change.changed) return { field, label, text: "diubah" };
      const before = auditValue(field, change.before, names);
      const after = auditValue(field, change.after, names);
      if (before === EMPTY_VALUE) return { field, label, text: after };
      if (after === EMPTY_VALUE)
        return { field, label, text: `${before} → dikosongkan` };
      return { field, label, text: `${before} → ${after}` };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "id"));
