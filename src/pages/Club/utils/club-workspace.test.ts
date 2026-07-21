import { describe, expect, it } from "vitest";
import dayjs from "dayjs";

import type { Club } from "../../../types/model/club";
import { getClubReadiness, resolveClubSection } from "./club-workspace";

const createClub = (overrides: Partial<Club> = {}): Club => ({
  id: 1,
  name: "Klub Contoh",
  club_type: "UNIT",
  media: { items: [] },
  is_show: false,
  is_registration_open: false,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
  ...overrides,
});

describe("Club workspace routing", () => {
  it("uses semantic sections and safely falls back to the overview", () => {
    expect(resolveClubSection("registration", null)).toBe("registration");
    expect(resolveClubSection("unknown", null)).toBe("overview");
  });

  it("maps every legacy Club tab to the new information architecture", () => {
    expect(resolveClubSection(null, "1")).toBe("profile");
    expect(resolveClubSection(null, "2")).toBe("profile");
    expect(resolveClubSection(null, "3")).toBe("profile");
    expect(resolveClubSection(null, "4")).toBe("registration");
    expect(resolveClubSection(null, "5")).toBe("people");
    expect(resolveClubSection(null, "7")).toBe("people");
    expect(resolveClubSection(null, "8")).toBe("activities");
  });
});

describe("Club readiness", () => {
  const today = dayjs("2026-07-21T12:00:00+07:00");

  it("treats a minimal draft as publishable but recommends profile content", () => {
    const readiness = getClubReadiness(createClub(), today);

    expect(readiness.profileItems[0].complete).toBe(true);
    expect(readiness.missingRecommendedItems).toHaveLength(5);
    expect(readiness.registrationState).toBe("not_configured");
    expect(readiness.canOpenRegistration).toBe(false);
  });

  it("recognizes a complete public profile", () => {
    const readiness = getClubReadiness(
      createClub({
        short_description: "Ringkasan klub",
        description: "<p>Deskripsi lengkap</p>",
        start_period: "2026-01-01",
        end_period: "2026-12-01",
        logo: "club/logo.webp",
        media: {
          items: [{ media_url: "club/media.webp", media_type: "image" }],
        },
      }),
      today,
    );

    expect(readiness.missingRecommendedItems).toHaveLength(0);
  });

  it("requires an active form before registration can open", () => {
    const inactive = getClubReadiness(
      createClub({
        attachedCustomForm: {
          id: 2,
          form_name: "Form Klub",
          feature_type: "club_registration",
          feature_id: 1,
          form_schema: { fields: [] },
          is_active: false,
          created_at: "2026-07-01T00:00:00.000Z",
          updated_at: "2026-07-01T00:00:00.000Z",
        },
      }),
      today,
    );

    expect(inactive.registrationState).toBe("needs_attention");
    expect(inactive.canOpenRegistration).toBe(false);
    expect(inactive.registrationBlockingReason).toContain("Aktifkan");
  });

  it("marks an active form as ready and an open registration as open", () => {
    const attachedCustomForm: Club["attachedCustomForm"] = {
      id: 2,
      form_name: "Form Klub",
      feature_type: "club_registration",
      feature_id: 1,
      form_schema: { fields: [] },
      is_active: true,
      created_at: "2026-07-01T00:00:00.000Z",
      updated_at: "2026-07-01T00:00:00.000Z",
    };

    expect(
      getClubReadiness(createClub({ attachedCustomForm }), today)
        .registrationState,
    ).toBe("ready");
    expect(
      getClubReadiness(
        createClub({ attachedCustomForm, is_registration_open: true }),
        today,
      ).registrationState,
    ).toBe("open");
  });

  it("blocks a registration date that has already passed", () => {
    const readiness = getClubReadiness(
      createClub({
        registration_end_date: "2026-07-20",
        attachedCustomForm: {
          id: 2,
          form_name: "Form Klub",
          feature_type: "club_registration",
          feature_id: 1,
          form_schema: { fields: [] },
          is_active: true,
          created_at: "2026-07-01T00:00:00.000Z",
          updated_at: "2026-07-01T00:00:00.000Z",
        },
      }),
      today,
    );

    expect(readiness.canOpenRegistration).toBe(false);
    expect(readiness.registrationState).toBe("needs_attention");
    expect(readiness.registrationBlockingReason).toContain("tanggal");
  });
});
