import { beforeEach, expect, it, vi } from "vitest";
import axios from "../axios";
import { saveActivityOptionalFeatures } from "./activity-setup";
import type { Activity } from "../../types/model/activity";

vi.mock("../axios", () => ({ default: { put: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

const activity = {
  id: 7,
  additional_config: {
    images: ["poster.webp"],
    certificate_template_id: 3,
    allow_guest_registration: true,
    custom_selection_status: ["LULUS"],
    optional_features: { courses: true },
  },
} as unknown as Activity;

it("merges feature flags without resending images or the certificate template", async () => {
  vi.mocked(axios.put).mockResolvedValueOnce({ data: { data: activity } });
  await saveActivityOptionalFeatures(activity, { scoring: false });
  expect(axios.put).toHaveBeenCalledWith("/activities/7", {
    additional_config: {
      allow_guest_registration: true,
      custom_selection_status: ["LULUS"],
      mandatory_profile_data: [],
      additional_questionnaire: [],
      optional_features: { courses: true, scoring: false },
    },
  });
});

it("propagates a failed save so the switch does not report success", async () => {
  const failure = new Error("connection lost");
  vi.mocked(axios.put).mockRejectedValueOnce(failure);
  await expect(
    saveActivityOptionalFeatures(activity, { scoring: true }),
  ).rejects.toBe(failure);
});
