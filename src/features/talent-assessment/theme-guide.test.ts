import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DOMAIN_GUIDES,
  getTalentGuide,
  REPORT_SOURCE,
  THEME_COMPARISONS,
} from "./theme-guide";
import guides from "./theme-guide.json";

describe("PDF report reference coverage", () => {
  it("covers every scored theme with complete descriptions and ten activities", () => {
    const definition: { talents: { name: string; domain: string }[] } =
      JSON.parse(
        readFileSync(
          new URL(
            "../../../../kaderisasi-admin-be-go/internal/talent/definition.json",
            import.meta.url,
          ),
          "utf8",
        ),
      );
    expect(guides.themes).toHaveLength(34);
    expect(new Set(guides.themes.map((theme) => theme.name)).size).toBe(34);
    expect(DOMAIN_GUIDES.map((domain) => domain.name).sort()).toEqual(
      [...new Set(definition.talents.map((theme) => theme.domain))].sort(),
    );
    for (const theme of definition.talents) {
      const guide = getTalentGuide(theme.name);
      expect(guide, theme.name).toBeDefined();
      expect(guide?.activities).toHaveLength(10);
      expect(guide?.summary.trim()).toBeTruthy();
      expect(guide?.characteristics.trim()).toBeTruthy();
      expect(guide?.support.trim()).toBeTruthy();
      expect(guide?.support).not.toMatch(
        /[A-D]\. (Thinking|Influencing|Relating|Striving)/,
      );
    }
  });
  it("preserves reference distinctions and source provenance", () => {
    expect(REPORT_SOURCE.title).toBe(
      "Penjelasan 34 Tema Bakat Talents Mapping",
    );
    expect(REPORT_SOURCE.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(THEME_COMPARISONS).toHaveLength(8);
    for (const comparison of THEME_COMPARISONS) {
      expect(comparison.themes).toHaveLength(2);
      for (const theme of comparison.themes)
        expect(getTalentGuide(theme)).toBeDefined();
    }
    expect(getTalentGuide("Communication")?.summary).toBe(
      "Mudah menyampaikan pikiran lewat kata-kata, baik lisan maupun tulisan.",
    );
    expect(getTalentGuide("Discipline")?.support).toContain("pengingat, alarm");
  });
});
