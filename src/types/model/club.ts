export interface MediaItem {
  media_url: string;
  media_type: 'image' | 'video';
  video_source?: 'youtube'; // Only present when media_type is 'video'
}

export interface MediaStructure {
  items: MediaItem[];
}

export interface RegistrationInfo {
  registration_info: string;
  after_registration_info: string;
}

export interface Club {
  id: number;
  name: string;
  description?: string;
  short_description?: string;
  logo?: string;
  media: MediaStructure;
  registration_info?: RegistrationInfo;
  start_period?: string;
  end_period?: string;
  is_show?: boolean;
  is_registration_open?: boolean;
  registration_end_date?: string;
  created_at: string;
  updated_at: string;
}
