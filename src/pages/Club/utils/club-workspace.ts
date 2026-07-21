import dayjs from "dayjs";

import type { Club } from "../../../types/model/club";

export const CLUB_SECTIONS = [
  "overview",
  "profile",
  "registration",
  "people",
  "activities",
] as const;

export type ClubSection = (typeof CLUB_SECTIONS)[number];

export type ClubChecklistItem = {
  key: string;
  label: string;
  description: string;
  complete: boolean;
  section: ClubSection;
  priority: "required" | "recommended" | "registration";
};

export type ClubRegistrationState =
  | "not_configured"
  | "needs_attention"
  | "ready"
  | "open"
  | "expired";

export type ClubReadiness = {
  profileItems: ClubChecklistItem[];
  registrationItems: ClubChecklistItem[];
  missingRecommendedItems: ClubChecklistItem[];
  registrationState: ClubRegistrationState;
  canOpenRegistration: boolean;
  registrationBlockingReason?: string;
};

const CLUB_SECTION_SET = new Set<string>(CLUB_SECTIONS);

const LEGACY_TAB_SECTION_MAP: Record<string, ClubSection> = {
  "1": "profile",
  "2": "profile",
  "3": "profile",
  "4": "registration",
  "5": "people",
  "7": "people",
  "8": "activities",
};

const hasText = (value?: string): boolean => Boolean(value?.trim());

const hasRichText = (value?: string): boolean => {
  if (!value) return false;

  const plainText = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return plainText.length > 0;
};

export const resolveClubSection = (
  section: string | null,
  legacyTab: string | null,
): ClubSection => {
  if (section && CLUB_SECTION_SET.has(section)) {
    return section as ClubSection;
  }

  if (legacyTab && LEGACY_TAB_SECTION_MAP[legacyTab]) {
    return LEGACY_TAB_SECTION_MAP[legacyTab];
  }

  return "overview";
};

export const getClubReadiness = (
  club: Club,
  today = dayjs(),
): ClubReadiness => {
  const attachedForm = club.attachedCustomForm;
  const registrationDateExpired = Boolean(
    club.registration_end_date &&
    dayjs(club.registration_end_date).endOf("day").isBefore(today),
  );

  const profileItems: ClubChecklistItem[] = [
    {
      key: "identity",
      label: "Nama dan tipe klub",
      description: "Identitas dasar yang digunakan di seluruh sistem.",
      complete: hasText(club.name) && Boolean(club.club_type),
      section: "profile",
      priority: "required",
    },
    {
      key: "short-description",
      label: "Deskripsi singkat",
      description: "Ringkasan singkat agar calon anggota cepat memahami klub.",
      complete: hasText(club.short_description),
      section: "profile",
      priority: "recommended",
    },
    {
      key: "description",
      label: "Deskripsi lengkap",
      description: "Jelaskan fokus, manfaat, atau program utama klub.",
      complete: hasRichText(club.description),
      section: "profile",
      priority: "recommended",
    },
    {
      key: "period",
      label: "Periode klub",
      description:
        "Tentukan bulan mulai dan berakhir bila klub berbasis periode.",
      complete: Boolean(club.start_period && club.end_period),
      section: "profile",
      priority: "recommended",
    },
    {
      key: "logo",
      label: "Logo klub",
      description: "Tambahkan identitas visual yang mudah dikenali.",
      complete: hasText(club.logo),
      section: "profile",
      priority: "recommended",
    },
    {
      key: "media",
      label: "Media pendukung",
      description: "Tambahkan foto atau video untuk memperkenalkan klub.",
      complete: (club.media?.items?.length ?? 0) > 0,
      section: "profile",
      priority: "recommended",
    },
  ];

  const registrationItems: ClubChecklistItem[] = [
    {
      key: "registration-info",
      label: "Informasi pendaftaran",
      description: "Berikan petunjuk sebelum calon anggota mengisi form.",
      complete: hasRichText(club.registration_info?.registration_info),
      section: "registration",
      priority: "registration",
    },
    {
      key: "registration-form",
      label: "Form pendaftaran terhubung",
      description: "Buat form baru atau hubungkan form yang sudah ada.",
      complete: Boolean(attachedForm),
      section: "registration",
      priority: "registration",
    },
    {
      key: "registration-form-active",
      label: "Form pendaftaran aktif",
      description: "Form harus aktif sebelum pendaftaran dapat dibuka.",
      complete: attachedForm?.is_active === true,
      section: "registration",
      priority: "registration",
    },
  ];

  let registrationState: ClubRegistrationState = "not_configured";
  if (club.is_registration_open && registrationDateExpired) {
    registrationState = "expired";
  } else if (club.is_registration_open) {
    registrationState = "open";
  } else if (attachedForm?.is_active && registrationDateExpired) {
    registrationState = "needs_attention";
  } else if (attachedForm?.is_active) {
    registrationState = "ready";
  } else if (attachedForm) {
    registrationState = "needs_attention";
  }

  let registrationBlockingReason: string | undefined;
  if (!attachedForm) {
    registrationBlockingReason =
      "Buat atau hubungkan form pendaftaran terlebih dahulu.";
  } else if (!attachedForm.is_active) {
    registrationBlockingReason =
      "Aktifkan form pendaftaran sebelum membuka pendaftaran.";
  } else if (registrationDateExpired) {
    registrationBlockingReason =
      "Pilih tanggal penutupan hari ini atau setelahnya.";
  }

  return {
    profileItems,
    registrationItems,
    missingRecommendedItems: profileItems.filter(
      (item) => item.priority === "recommended" && !item.complete,
    ),
    registrationState,
    canOpenRegistration:
      attachedForm?.is_active === true && !registrationDateExpired,
    registrationBlockingReason,
  };
};
