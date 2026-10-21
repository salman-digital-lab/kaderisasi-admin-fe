import type {
  CertificateApproval,
  CertificateParticipant,
  CertificateSettings,
} from "../../../types/services/certificateTemplate";
import type { CertificateElement, CertificateTemplate } from "../types";

export const CERTIFICATE_SAMPLE_PARTICIPANT: CertificateParticipant = {
  registration_id: 1,
  user_id: 1,
  name: "Ahmad Fauzan",
  email: "",
  university: "Institut Teknologi Bandung",
  gender: "Laki-laki",
  activity_name: "Pelatihan Dasar Kaderisasi",
  activity_date: "13 Februari 2026",
};

export const CERTIFICATE_SAMPLE_CODE = "CERT-2026-001";
export const CERTIFICATE_SAMPLE_ACTIVITY_NUMBER = "1719/S.4/YPM-5000/IV-1448";

export const ACTIVITY_NUMBER_INFIX = "S.4/YPM-5000";
export const HIJRI_MONTH_NUMERALS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

const ACTIVITY_NUMBER_PATTERN =
  /^(\d{1,10})\/S\.4\/YPM-5000\/(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)-(\d{4})$/;

export interface CertificateActivityNumberParts {
  sequence: string;
  hijriMonth: number;
  hijriYear: number;
}

/** Builds 1719/S.4/YPM-5000/IV-1448 from its editable parts. */
export function formatCertificateActivityNumber({
  sequence,
  hijriMonth,
  hijriYear,
}: CertificateActivityNumberParts): string {
  return `${sequence}/${ACTIVITY_NUMBER_INFIX}/${HIJRI_MONTH_NUMERALS[hijriMonth - 1]}-${hijriYear}`;
}

export function parseCertificateActivityNumber(
  value?: string | null,
): CertificateActivityNumberParts | null {
  const match = value?.match(ACTIVITY_NUMBER_PATTERN);
  if (!match) return null;
  return {
    sequence: match[1],
    hijriMonth:
      HIJRI_MONTH_NUMERALS.indexOf(
        match[2] as (typeof HIJRI_MONTH_NUMERALS)[number],
      ) + 1,
    hijriYear: Number(match[3]),
  };
}

/** Hijri (Umm al-Qura) month and year of a date in Jakarta time. */
export function getHijriMonthYear(date: Date): {
  hijriMonth: number;
  hijriYear: number;
} {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
    timeZone: "Asia/Jakarta",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date);
  const read = (type: "month" | "year"): number =>
    Number.parseInt(parts.find((part) => part.type === type)?.value ?? "", 10);
  return { hijriMonth: read("month"), hijriYear: read("year") };
}

export function getCertificateAssetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (
    path.startsWith("data:") ||
    path.startsWith("blob:") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  const imageBaseUrl = import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL || "";
  return `${imageBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function getCertificatePublicBaseUrl(): string | null {
  const configuredUrl = import.meta.env.VITE_PUBLIC_WEB_URL?.trim();
  if (!configuredUrl) return null;

  try {
    const parsedUrl = new URL(configuredUrl);
    const isSecure = parsedUrl.protocol === "https:";
    const isLocalHttp =
      parsedUrl.protocol === "http:" &&
      (parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1");
    if (!isSecure && !isLocalHttp) return null;

    parsedUrl.search = "";
    parsedUrl.hash = "";
    return parsedUrl.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getCertificateVerificationUrl(
  certificateCode?: string | null,
): string | null {
  if (!certificateCode) return null;
  const baseUrl = getCertificatePublicBaseUrl();
  return baseUrl
    ? `${baseUrl}/certificate/verify/${encodeURIComponent(certificateCode)}`
    : null;
}

export function resolveCertificateText(
  element: CertificateElement,
  participant: CertificateParticipant,
  certificateCode?: string | null,
  approval?: CertificateApproval,
  settings?: CertificateSettings,
): string {
  if (element.type === "static-text") return element.content || "";
  // A QR code's text is the caption printed under it: the unique code moves
  // there once the activity number takes its place at the top.
  if (element.type === "qr-code")
    return settings?.certificate_activity_number ? certificateCode || "" : "";

  switch (element.variable) {
    case "{{institution}}":
      return settings?.institution ?? "YAYASAN PEMBINA MASJID (YPM) SALMAN ITB";
    case "{{role}}":
      return settings?.role ?? "PESERTA";
    case "{{event_details}}":
      return [
        settings?.delivery_mode,
        settings?.event_date ?? participant.activity_date,
        settings?.hijri_date,
        settings?.venue,
      ]
        .filter(Boolean)
        .join("\n");
    case "{{organizer}}":
      return (
        settings?.organizer ??
        "Bidang Mahasiswa, Kaderisasi, dan Alumni Salman ITB"
      );
    case "{{document_place_date}}":
      return [
        settings?.document_place ?? "Bandung",
        settings?.document_date ?? "[Tanggal sertifikat]",
      ]
        .filter(Boolean)
        .join(", ");
    case "{{approval}}": {
      if (!approval)
        return "Menunggu persetujuan\n[Nama penandatangan]\n[Jabatan]\n[Tanggal persetujuan]";
      const date = new Date(approval.approved_at).toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return `Disetujui secara elektronik oleh\n${approval.signer_name}\n${approval.signer_title}\n${date}`;
    }
    case "{{name}}":
      return participant.guest_name || participant.name;
    case "{{activity_name}}":
      return participant.activity_name;
    case "{{activity_date}}":
    case "{{date}}":
      return participant.activity_date;
    case "{{certificate_activity_number}}":
      return settings?.certificate_activity_number || "";
    case "{{certificate_id}}":
    case "{{certificate_code}}":
      if (element.id !== "salman-code") return certificateCode || "";
      return `Nomor: ${settings?.certificate_activity_number || certificateCode || "[Kode sertifikat]"}`;
    case "{{university}}":
      return participant.university || "-";
    case "{{gender}}":
      return participant.gender || "-";
    default:
      return element.content || "";
  }
}

export function resolveCertificateSampleText(
  element: CertificateElement,
): string {
  // Only the activity number is sampled; other settings fall back to their defaults.
  return resolveCertificateText(
    element,
    CERTIFICATE_SAMPLE_PARTICIPANT,
    CERTIFICATE_SAMPLE_CODE,
    undefined,
    {
      certificate_activity_number: CERTIFICATE_SAMPLE_ACTIVITY_NUMBER,
    } as CertificateSettings,
  );
}

/** Activity-wide settings an admin fills in once for every certificate of an activity. */
export type ActivitySettingField = Exclude<
  keyof CertificateSettings,
  "version" | "include_scores"
>;

const ACTIVITY_SETTING_FIELDS: Record<string, ActivitySettingField[]> = {
  "{{institution}}": ["institution"],
  "{{role}}": ["role"],
  "{{event_details}}": ["delivery_mode", "event_date", "hijri_date", "venue"],
  "{{organizer}}": ["organizer"],
  "{{document_place_date}}": ["document_place", "document_date"],
  "{{certificate_activity_number}}": ["certificate_activity_number"],
};

/** Values filled automatically from each participant and the activity. */
const AUTOMATIC_VARIABLES: Record<string, string> = {
  "{{name}}": "Nama peserta",
  "{{university}}": "Universitas",
  "{{gender}}": "Jenis kelamin",
  "{{activity_name}}": "Nama kegiatan",
  "{{activity_date}}": "Tanggal kegiatan",
  "{{date}}": "Tanggal kegiatan",
  "{{certificate_code}}": "Kode unik sertifikat",
  "{{certificate_id}}": "Kode unik sertifikat",
  "{{approval}}": "Persetujuan elektronik",
};

const normalizeVariable = (variable?: string): string =>
  `{{${(variable ?? "").replace(/\{\{|\}\}/g, "").trim()}}}`;

/**
 * Which activity settings and automatic values a template prints. Mirrors the
 * API's UsesActivitySettings: hidden elements are ignored, and the Salman number
 * line under the title prints the activity number.
 */
export function getTemplateVariables(template: CertificateTemplate): {
  fields: Set<ActivitySettingField>;
  automatic: string[];
} {
  const fields = new Set<ActivitySettingField>();
  const automatic = new Set<string>();
  for (const element of template.elements) {
    if (element.type === "qr-code" && element.visible !== false)
      automatic.add("QR verifikasi");
    if (element.type !== "variable-text" || element.visible === false) continue;
    const variable = normalizeVariable(element.variable);
    ACTIVITY_SETTING_FIELDS[variable]?.forEach((field) => fields.add(field));
    if (
      element.id === "salman-code" &&
      (variable === "{{certificate_code}}" || variable === "{{certificate_id}}")
    ) {
      fields.add("certificate_activity_number");
      automatic.add("Kode unik sertifikat (di bawah QR)");
    } else if (AUTOMATIC_VARIABLES[variable]) {
      automatic.add(AUTOMATIC_VARIABLES[variable]);
    }
  }
  return { fields, automatic: [...automatic] };
}

/** Whether the activity's settings must be saved before publishing with this template. */
export function templateNeedsActivitySettings(
  template: CertificateTemplate,
): boolean {
  return (
    template.scoreSheetLayout === "salman-v1" ||
    getTemplateVariables(template).fields.size > 0
  );
}
