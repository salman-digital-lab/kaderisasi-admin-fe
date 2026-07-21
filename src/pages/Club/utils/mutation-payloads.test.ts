import { describe, expect, it } from "vitest";
import dayjs from "dayjs";

import {
  createDraftClubPayload,
  createMediaDeletePayload,
  createMediaRowKey,
  createRegistrationStatusPayload,
  serializeClubDate,
} from "./mutation-payloads";

describe("Club mutation payloads", () => {
  it("updates registration status without replacing application answers", () => {
    const payload = createRegistrationStatusPayload("APPROVED");

    expect(payload).toEqual({ status: "APPROVED" });
    expect(
      Object.prototype.hasOwnProperty.call(payload, "additional_data"),
    ).toBe(false);
  });

  it("identifies media by its stable URL instead of a paginated index", () => {
    const payload = createMediaDeletePayload("club/media-42.webp");

    expect(payload).toEqual({ media_url: "club/media-42.webp" });
    expect(Object.prototype.hasOwnProperty.call(payload, "index")).toBe(false);
  });

  it("keeps legacy duplicate media rows keyed independently", () => {
    const media = {
      media_url: "https://www.youtube.com/embed/video-1",
      media_type: "video" as const,
    };

    expect(createMediaRowKey(media, 0)).not.toBe(createMediaRowKey(media, 1));
  });

  it("preserves explicit null when a Club date is cleared", () => {
    expect(serializeClubDate(null)).toBeNull();
    expect(serializeClubDate(undefined)).toBeUndefined();
    expect(serializeClubDate(dayjs("2026-07-16"))).toBe("2026-07-16");
  });

  it("always creates a new club as a hidden draft", () => {
    const payload = createDraftClubPayload({
      name: "Klub Baru",
      club_type: "UNIT",
      is_show: true,
    });

    expect(payload.is_show).toBe(false);
  });
});
