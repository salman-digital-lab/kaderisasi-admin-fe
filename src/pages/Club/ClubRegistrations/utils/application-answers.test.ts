import { describe, expect, it } from "vitest";

import type { FormSchema } from "../../../../types/model/customForm";
import {
  buildApplicationAnswerSections,
  EMPTY_APPLICATION_ANSWER,
  formatApplicationAnswer,
  humanizeApplicationKey,
} from "./application-answers";

const formSchema: FormSchema = {
  fields: [
    {
      section_name: "profile_data",
      fields: [{ key: "name", label: "Nama", required: true, type: "text" }],
    },
    {
      section_name: "Motivasi",
      fields: [
        {
          key: "reason_to_join",
          label: "Alasan bergabung",
          required: true,
          type: "textarea",
        },
      ],
    },
    {
      section_name: "Komitmen",
      fields: [
        {
          key: "available_days",
          label: "Hari yang tersedia",
          required: false,
          type: "checkbox",
        },
      ],
    },
  ],
};

describe("Club application answers", () => {
  it("uses schema section and field order while excluding profile fields", () => {
    const sections = buildApplicationAnswerSections(
      {
        name: "Tidak boleh ditampilkan lagi",
        available_days: ["Sabtu", "Minggu"],
        reason_to_join: "Ingin berkontribusi",
        legacyInterest: true,
      },
      formSchema,
    );

    expect(sections.map((section) => section.title)).toEqual([
      "Motivasi",
      "Komitmen",
      "Jawaban Lainnya",
    ]);
    expect(sections[0].answers).toEqual([
      expect.objectContaining({
        label: "Alasan bergabung",
        displayValue: "Ingin berkontribusi",
      }),
    ]);
    expect(sections[1].answers[0].displayValue).toBe("Sabtu, Minggu");
    expect(sections[2].answers[0]).toEqual(
      expect.objectContaining({ label: "Legacy Interest", displayValue: "Ya" }),
    );
    expect(sections.flatMap((section) => section.answers)).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Nama" })]),
    );
  });

  it("keeps schema questions visible when an applicant did not answer", () => {
    const sections = buildApplicationAnswerSections({}, formSchema);

    expect(sections[0].answers[0].displayValue).toBe(EMPTY_APPLICATION_ANSWER);
    expect(sections[1].answers[0].displayValue).toBe(EMPTY_APPLICATION_ANSWER);
  });

  it.each([
    [true, "Ya"],
    [false, "Tidak"],
    [0, "0"],
    [null, EMPTY_APPLICATION_ANSWER],
    [[], EMPTY_APPLICATION_ANSWER],
    [["Kaderisasi", "Sosial"], "Kaderisasi, Sosial"],
  ])("formats %j readably", (value, expected) => {
    expect(formatApplicationAnswer(value)).toBe(expected);
  });

  it("falls back to humanized legacy keys without interpreting HTML", () => {
    const sections = buildApplicationAnswerSections({
      preferred_role: "<strong>Ketua</strong>",
      availableTime: "Malam",
    });

    expect(humanizeApplicationKey("preferred_role")).toBe("Preferred Role");
    expect(sections[0].answers).toEqual([
      expect.objectContaining({
        label: "Preferred Role",
        displayValue: "<strong>Ketua</strong>",
      }),
      expect.objectContaining({
        label: "Available Time",
        displayValue: "Malam",
      }),
    ]);
  });
});
