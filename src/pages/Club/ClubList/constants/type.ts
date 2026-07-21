import type { ClubType } from "../../../../types/model/club";

export interface FilterType {
  page: number;
  per_page: number;
  name: string;
  club_type?: ClubType;
}
