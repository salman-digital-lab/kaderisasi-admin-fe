import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FormSchema } from "../../../../types/model/customForm";
import { answerColumns, EMPTY_ANSWER, formatAnswer } from "./answer-columns";
import { loadColumnPreferences, saveColumnPreferences } from "./columns";

const schema: FormSchema = {
  fields: [
    {
      section_name: "profile_data",
      fields: [{ key: "name", label: "Nama", type: "text", required: true }],
    },
    {
      section_name: "Answers",
      fields: [
        { key: "reason", label: "Alasan", type: "textarea", required: true },
        { key: "proof", label: "Bukti", type: "file", required: false },
        { key: "reason", label: "Duplicate", type: "text", required: false },
      ],
    },
  ],
};

describe("participant answer columns", () => {
  it("uses schema order and stable keys while skipping profile and duplicate fields", () => {
    const columns = answerColumns(12, schema, (row: { reason: string }) => row);
    expect(columns.map((column) => [column.key, column.title])).toEqual([
      ["answer:12:reason", "Alasan"],
      ["answer:12:proof", "Bukti"],
    ]);
  });

  it("formats choices, arrays, booleans, zero and missing values", () => {
    const options = [
      { label: "Pertama", value: 0 },
      { label: "Kedua", value: "two" },
    ];
    expect(formatAnswer([0, "two"], options)).toBe("Pertama, Kedua");
    expect(formatAnswer(false)).toBe("Tidak");
    expect(formatAnswer(0)).toBe("0");
    expect(formatAnswer(null)).toBe(EMPTY_ANSWER);
    expect(formatAnswer("  ")).toBe(EMPTY_ANSWER);
  });

  it("renders long answers and authenticated attachment controls", () => {
    const columns = answerColumns(
      12,
      schema,
      (row: { reason: string; proof: string[] }) => row,
    );
    const record = { reason: "A long answer", proof: ["attachment-id"] };
    expect(
      renderToStaticMarkup(<>{columns[0].render?.(undefined, record)}</>),
    ).toContain("A long answer");
    expect(
      renderToStaticMarkup(<>{columns[1].render?.(undefined, record)}</>),
    ).toContain("Unduh berkas 1");
    expect(
      renderToStaticMarkup(
        <>{columns[1].render?.(undefined, { ...record, proof: [] })}</>,
      ),
    ).toContain(EMPTY_ANSWER);
  });

  it("restores order and visibility, appends new questions, drops removed questions, and isolates lists", () => {
    const items = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => {
        items.set(key, value);
      },
    });
    try {
      const defaults = answerColumns(
        12,
        schema,
        (row: { reason: string; proof: string[] }) => row,
      );
      saveColumnPreferences("activity_12", [
        { ...defaults[1], visible: false },
        defaults[0],
      ]);
      const changed = [
        defaults[0],
        defaults[1],
        { ...defaults[0], key: "answer:12:new" },
      ];
      expect(
        loadColumnPreferences("activity_12", changed)?.map((column) => [
          column.key,
          column.visible,
        ]),
      ).toEqual([
        ["answer:12:proof", false],
        ["answer:12:reason", true],
        ["answer:12:new", true],
      ]);
      expect(loadColumnPreferences("club_12", changed)).toBeNull();
      expect(
        loadColumnPreferences("activity_12", [changed[0]])?.map(
          (column) => column.key,
        ),
      ).toEqual(["answer:12:reason"]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
