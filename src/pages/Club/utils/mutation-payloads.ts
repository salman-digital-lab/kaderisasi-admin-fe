import type { Dayjs } from "dayjs";
import type { MediaItem } from "../../../types/model/club";
import type { ClubRegistration } from "../../../types/model/clubRegistration";
import type { deleteMediaReq, postClubReq } from "../../../types/services/club";
import type { putClubRegistrationReq } from "../../../types/services/clubRegistration";

export const createRegistrationStatusPayload = (
  status: ClubRegistration["status"],
): putClubRegistrationReq => ({ status });

export const createMediaDeletePayload = (mediaUrl: string): deleteMediaReq => ({
  media_url: mediaUrl,
});

export const createDraftClubPayload = (
  payload: postClubReq,
): postClubReq & { is_show: false } => ({
  ...payload,
  is_show: false,
});

export const serializeClubDate = (
  value: Dayjs | null | undefined,
): string | null | undefined => {
  if (value === null) return null;

  return value?.format("YYYY-MM-DD");
};

export const createMediaRowKey = (
  item: Pick<MediaItem, "media_type" | "media_url">,
  index: number,
): string => `${item.media_type}:${item.media_url}:${index}`;
