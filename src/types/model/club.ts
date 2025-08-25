export interface MediaItem {
  media_url: string;
  media_type: 'image' | 'video';
  video_source?: 'youtube'; // Only present when media_type is 'video'
}

export interface MediaStructure {
  items: MediaItem[];
}

export interface Club {
  id: number;
  name: string;
  description?: string;
  short_description?: string;
  logo?: string;
  media: MediaStructure;
  start_period?: string;
  end_period?: string;
  is_show?: boolean;
  created_at: string;
  updated_at: string;
}
