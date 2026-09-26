import { describe, expect, it } from "vitest";
import { buildStarterTemplate } from "../utils/starter-templates";
import {
  createDocumentHistoryState,
  documentHistoryReducer,
} from "./document-reducer";
import { loadDesignerTemplate } from "./load-template";

describe("loading a saved certificate design", () => {
  it("retains Salman settings and score-page behavior through edit, save, and reload", () => {
    const original = buildStarterTemplate("a4-portrait-salman", "salman");
    const loaded = loadDesignerTemplate({
      template_data: original,
      background_image: null,
    });
    const edited = documentHistoryReducer(createDocumentHistoryState(loaded), {
      type: "apply",
      update: (current) => ({
        ...current,
        elements: current.elements.map((element) => ({
          ...element,
          y: element.y + 1,
        })),
      }),
    });
    const reloaded = loadDesignerTemplate({
      template_data: JSON.parse(JSON.stringify(edited.template)),
      background_image: null,
    });
    expect(reloaded.scoreSheetLayout).toBe("salman-v1");
    expect(reloaded.canvasWidth).toBe(794);
    expect(reloaded.canvasHeight).toBe(1123);
    expect(
      reloaded.elements.find(
        (element) => element.variable === "{{document_place_date}}",
      )?.y,
    ).toBe(
      original.elements.find(
        (element) => element.variable === "{{document_place_date}}",
      )!.y + 1,
    );
  });

  it("preserves legacy layouts and the managed background override", () => {
    const original = buildStarterTemplate("a4-landscape", "basic");
    const loaded = loadDesignerTemplate({
      template_data: original,
      background_image: "certificate/templates/1/background.webp",
    });
    expect(loaded.scoreSheetLayout).toBeUndefined();
    expect(loaded.elements).toEqual(original.elements);
    expect(loaded.backgroundUrl).toBe(
      "certificate/templates/1/background.webp",
    );
  });
});
