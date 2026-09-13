export interface ShortLink {
  code: string;
  short_url: string;
  original_url: string;
  created_at: string;
  visit_count: number;
}

export interface ShortLinkInput {
  original_url: string;
  code?: string;
}

export interface ShortLinkPage {
  data: ShortLink[];
  base_url: string;
  meta: {
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
  };
}
