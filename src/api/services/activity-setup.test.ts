import { beforeEach, expect, it, vi } from "vitest";
import axios from "../axios";
import type { Activity } from "../../types/model/activity";
import { saveSetupActivity, setupActivityConfig } from "./activity-setup";

vi.mock("../axios", () => ({ default: { post: vi.fn(), put: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(axios.post).mockResolvedValue({ data: { data: { id: 42 } } });
  vi.mocked(axios.put).mockResolvedValue({ data: { data: { id: 42 } } });
});

it("sends the required configuration lists when saving a new draft", async () => {
  await saveSetupActivity(undefined, {
    name: "Pembinaan Oktober",
    description: "",
    club_id: null,
    additional_config: setupActivityConfig(undefined, false),
  });

  expect(axios.post).toHaveBeenCalledWith("/activities", {
    name: "Pembinaan Oktober",
    description: "",
    club_id: null,
    additional_config: {
      custom_selection_status: [],
      mandatory_profile_data: [],
      additional_questionnaire: [],
      allow_guest_registration: false,
    },
    is_published: 0,
    is_registration_open: false,
  });
});

it("preserves existing registration settings when the wizard changes guest access", async () => {
  const existing: Activity["additional_config"] = {
    custom_selection_status: ["Wawancara"],
    mandatory_profile_data: [{ name: "whatsapp", required: true }],
    additional_questionnaire: [
      { type: "text", name: "motivation", label: "Motivasi", required: true },
    ],
    images: ["poster.webp"],
    status_visibility: { is_visible: false, visible_at: "2026-10-15" },
    certificate_template_id: 9,
    allow_guest_registration: true,
  };
  const before = structuredClone(existing);

  await saveSetupActivity(42, {
    additional_config: setupActivityConfig(existing, false),
  });

  expect(axios.put).toHaveBeenCalledWith("/activities/42", {
    additional_config: { ...before, allow_guest_registration: false },
  });
  expect(existing).toEqual(before);
});

it("keeps status-only updates separate from activity configuration", async () => {
  await saveSetupActivity(42, { is_published: 1 });
  expect(axios.put).toHaveBeenCalledWith("/activities/42", { is_published: 1 });
});
