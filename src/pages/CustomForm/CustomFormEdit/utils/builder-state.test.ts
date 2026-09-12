import { afterEach, expect, it, vi } from "vitest";
import {
  builderIssues,
  duplicateQuestion,
  duplicateSection,
  moveQuestion,
  normalizeSchema,
  readRecovery,
} from "./builder-state";
import fixtures from "../../../../utils/form-routing.fixtures.json";
import type { FormSchema } from "../../../../types/model/customForm";

const schema = fixtures.schema as FormSchema;
afterEach(() => vi.unstubAllGlobals());
it("assigns stable IDs without changing the source document", () => {
  const original = { fields: [{ section_name: "Section", fields: [] }] };
  const normalized = normalizeSchema(original);
  expect(normalized.fields[0].id).toBeTruthy();
  expect(normalizeSchema(normalized)).toEqual(normalized);
  expect(original).toEqual({
    fields: [{ section_name: "Section", fields: [] }],
  });
});
it("duplicates sections without navigation or reused question keys", () => {
  const copied = duplicateSection(schema.fields[1]);
  expect(copied.navigation).toBeUndefined();
  expect(copied.id).not.toBe(schema.fields[1].id);
  expect(copied.fields[0].key).not.toBe(schema.fields[1].fields[0].key);
  copied.fields[0].options![0].label = "Changed";
  expect(schema.fields[1].fields[0].options![0].label).toBe("Detail");
  expect(duplicateQuestion(schema.fields[1].fields[0]).key).not.toBe(
    copied.fields[0].key,
  );
});
it("moves questions between sections and reports broken routing", () => {
  const moved = moveQuestion(schema.fields, "track", "detail");
  expect(moved[1].fields).toHaveLength(0);
  expect(moved[2].fields.map((field) => field.key)).toEqual([
    "reason",
    "track",
  ]);
  expect(builderIssues({ ...schema, fields: moved }).length).toBeGreaterThan(0);
});
it("rejects invalid regex and reversed validation bounds", () => {
  const invalid = structuredClone(schema);
  invalid.fields[2].fields[0].validation = {
    pattern: "[",
    minLength: 5,
    maxLength: 2,
  };
  expect(builderIssues(invalid)).toHaveLength(2);
});
it("ignores corrupt and expired recovery documents", () => {
  const getItem = vi.fn().mockReturnValue("{");
  vi.stubGlobal("localStorage", { getItem });
  expect(readRecovery("draft")).toBeNull();
  const recovery = {
    version: 1,
    savedAt: Date.now(),
    updatedAt: "server-revision",
    schema,
    values: { formName: "Draft" },
  };
  getItem.mockReturnValue(JSON.stringify(recovery));
  expect(readRecovery("draft")).toEqual(recovery);
  getItem.mockReturnValue(JSON.stringify({ ...recovery, savedAt: 0 }));
  expect(readRecovery("draft")).toBeNull();
});
