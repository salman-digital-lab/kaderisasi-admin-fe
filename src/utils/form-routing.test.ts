import { describe, expect, it } from "vitest";
import fixtures from "./form-routing.fixtures.json";
import {
  formRoute,
  pruneFormAnswers,
  validateFormRouting,
  type RoutingSchema,
} from "./form-routing";

describe("form routing contract", () => {
  const schema = fixtures.schema as RoutingSchema;
  for (const fixture of fixtures.cases)
    it(fixture.name, () => {
      expect(validateFormRouting(schema)).toEqual([]);
      expect(formRoute(schema, fixture.answers)).toEqual(fixture.route);
      expect(pruneFormAnswers(schema, fixture.answers)).toEqual(fixture.kept);
    });
  it("keeps legacy forms sequential", () => {
    const legacy = {
      fields: schema.fields.map((section) => ({
        section_name: section.section_name,
        fields: section.fields,
      })),
    };
    expect(validateFormRouting(legacy)).toEqual([]);
    expect(formRoute(legacy, {})).toEqual([
      "legacy_section_1",
      "legacy_section_2",
      "legacy_section_3",
    ]);
  });
  it("keeps generated legacy IDs distinct from stored IDs", () => {
    const legacy = {
      fields: [
        { section_name: "First", fields: [] },
        { id: "legacy_section_0", section_name: "Second", fields: [] },
      ],
    };
    expect(validateFormRouting(legacy)).toEqual([]);
    expect(formRoute(legacy, {})).toEqual([
      "legacy_section_0_",
      "legacy_section_0",
    ]);
  });
  it("rejects a removed or backward destination", () => {
    for (const sectionId of ["missing", "choice", "profile"]) {
      const invalid = structuredClone(schema);
      invalid.fields[1].navigation!.routes![0].target = {
        type: "section",
        sectionId,
      };
      expect(validateFormRouting(invalid).length).toBeGreaterThan(0);
    }
  });
  it("keeps routes after labels change", () => {
    const renamed = structuredClone(schema);
    renamed.fields[1].section_name = "Judul baru";
    renamed.fields[1].fields[0].options![1].label = "Lewati detail";
    expect(formRoute(renamed, { track: "skip" })).toEqual(["choice", "end"]);
  });
  it("rejects disabled routing questions and deleted options", () => {
    const disabled = structuredClone(schema);
    disabled.fields[1].fields[0].disabled = true;
    expect(validateFormRouting(disabled).length).toBeGreaterThan(0);
    const deleted = structuredClone(schema);
    deleted.fields[1].fields[0].options!.splice(1, 1);
    expect(validateFormRouting(deleted).length).toBeGreaterThan(0);
  });
});
