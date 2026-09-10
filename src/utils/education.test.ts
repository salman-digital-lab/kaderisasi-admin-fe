import { describe, expect, it } from "vitest";
import {
  currentEducation,
  formatCurrentEducation,
  formatEducationHistory,
  formatWorkHistory,
  formatProfileValue,
} from "./education";
import {
  normalizeEducationHistory,
  normalizeWorkHistory,
} from "./profile-history";

describe("history display in members and registrations", () => {
  it("formats partial imported education without undefined or object children", () => {
    const raw = JSON.stringify([
      null,
      { institution: "ITB", major: "Physics", intake_year: "2017" },
    ]);
    expect(formatCurrentEducation(currentEducation(raw))).toBe(
      "ITB, Physics (2017)",
    );
    expect(formatEducationHistory(raw)).toBe("ITB, Physics (2017)");
    expect(formatCurrentEducation({ major: "Physics" })).toBe("Physics");
    expect(formatCurrentEducation({ institution: { invalid: true } })).toBe(
      "-",
    );
  });
  it("uses guest education history when no current entry was collected", () => {
    expect(
      formatCurrentEducation(
        currentEducation(null, {
          education_history: [{ degree: "master", institution: "ITB" }],
        }),
      ),
    ).toBe("S2 - ITB");
  });
  it("formats history arrays and structured answers into renderable text", () => {
    expect(
      formatWorkHistory([
        null,
        { job_title: "Engineer", company: "Company", start_year: "2021" },
      ]),
    ).toBe("Engineer - Company - 2021 - Sekarang");
    expect(formatProfileValue([{ name: "A" }, null])).toBe('{"name":"A"}, -');
    expect(formatProfileValue(0)).toBe("0");
  });
  it("loads empty and invalid histories without calling array methods on objects", () => {
    for (const value of [null, {}, "invalid", 42]) {
      expect(normalizeEducationHistory(value)).toEqual([]);
      expect(normalizeWorkHistory(value)).toEqual([]);
    }
  });
});
