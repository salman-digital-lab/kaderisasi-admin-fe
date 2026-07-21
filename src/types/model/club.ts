import type { CustomForm } from "./customForm";

export interface MediaItem {
  media_url: string;
  media_type: "image" | "video";
  video_source?: "youtube"; // Only present when media_type is 'video'
}

export interface MediaStructure {
  items: MediaItem[];
}

export interface RegistrationInfo {
  registration_info: string;
}

export const CLUB_TYPES = [
  "UNIT",
  "CLUB_KEPROFESIAN",
  "CLUB_BAHASA",
  "AVISMAN_REGIONAL",
] as const;

export type ClubType = (typeof CLUB_TYPES)[number];

export const CLUB_TYPE_LABELS: Record<ClubType, string> = {
  UNIT: "Unit",
  CLUB_KEPROFESIAN: "Club Keprofesian",
  CLUB_BAHASA: "Club Bahasa",
  AVISMAN_REGIONAL: "Avisman Regional",
};

export const CLUB_TYPE_DESCRIPTIONS: Record<ClubType, string> = {
  UNIT: "Unit kegiatan umum.",
  CLUB_KEPROFESIAN: "Komunitas berdasarkan bidang atau profesi.",
  CLUB_BAHASA: "Komunitas pembelajaran atau praktik bahasa.",
  AVISMAN_REGIONAL: "Komunitas Avisman berdasarkan wilayah.",
};

export interface Club {
  id: number;
  name: string;
  club_type: ClubType;
  description?: string;
  short_description?: string;
  logo?: string;
  media: MediaStructure;
  registration_info?: RegistrationInfo;
  start_period?: string | null;
  end_period?: string | null;
  is_show?: boolean;
  is_registration_open?: boolean;
  registration_end_date?: string | null;
  attachedCustomForm?: CustomForm;
  created_at: string;
  updated_at: string;
}
