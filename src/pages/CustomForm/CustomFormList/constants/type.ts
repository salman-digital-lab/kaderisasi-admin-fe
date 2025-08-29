export type FilterType = {
  page: number;
  per_page: number;
  search: string;
  feature_type?: 'activity_registration' | 'club_registration';
  feature_id?: string;
  is_active?: boolean;
};
