export type FilterType = {
  page: number;
  per_page: number;
  search: string;
  feature_type?: "activity_registration" | "independent_form";
  feature_id?: string;
  is_active?: boolean;
};
