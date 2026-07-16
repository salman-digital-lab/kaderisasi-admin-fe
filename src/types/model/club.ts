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

export type ClubType = "UKM" | "AVISMAN";

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
