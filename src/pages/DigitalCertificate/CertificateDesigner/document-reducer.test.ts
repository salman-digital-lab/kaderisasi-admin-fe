import { describe, expect, it } from "vitest";
import {
  createDocumentHistoryState,
  documentHistoryReducer,
  reorderElementById,
} from "./document-reducer";

const template = {
  backgroundUrl: null,
  elements: [],
  canvasWidth: 800,
  canvasHeight: 566,
};

describe("certificate document history reducer", () => {
  it("groups high-frequency edits into one atomic history entry", () => {
    let state = createDocumentHistoryState(template);
    state = documentHistoryReducer(state, {
      type: "apply",
      historyGroup: "canvas-width",
      update: (current) => ({ ...current, canvasWidth: 900 }),
    });
    state = documentHistoryReducer(state, {
      type: "apply",
      historyGroup: "canvas-width",
      update: (current) => ({ ...current, canvasWidth: 1000 }),
    });
    expect(state.past).toHaveLength(1);
    state = documentHistoryReducer(state, { type: "undo" });
    expect(state.template.canvasWidth).toBe(800);
  });

  it("restores document revisions through undo and redo", () => {
    let state = createDocumentHistoryState(template);
    state = documentHistoryReducer(state, {
      type: "apply",
      update: (current) => ({ ...current, canvasHeight: 600 }),
    });
    const savedRevision = state.revision;
    state = documentHistoryReducer(state, {
      type: "apply",
      update: (current) => ({ ...current, canvasHeight: 700 }),
    });
    state = documentHistoryReducer(state, { type: "undo" });
    expect(state.revision).toBe(savedRevision);
    state = documentHistoryReducer(state, { type: "redo" });
    expect(state.template.canvasHeight).toBe(700);
  });

  it("preserves a valid selection through undo and redo", () => {
    const element = {
      id: "title",
      type: "static-text" as const,
      x: 0,
      y: 0,
      width: 100,
      height: 40,
    };
    let state = createDocumentHistoryState({
      ...template,
      elements: [element],
    });
    state = documentHistoryReducer(state, { type: "select", id: element.id });
    state = documentHistoryReducer(state, {
      type: "apply",
      update: (current) => ({
        ...current,
        elements: current.elements.map((item) => ({ ...item, x: 20 })),
      }),
    });
    state = documentHistoryReducer(state, { type: "undo" });
    expect(state.selectedElementId).toBe(element.id);
    state = documentHistoryReducer(state, { type: "redo" });
    expect(state.selectedElementId).toBe(element.id);
  });

  it("maps reversed layer drag order back to document stack order", () => {
    const elements = ["bottom", "middle", "top"].map((id) => ({
      id,
      type: "static-text" as const,
      x: 0,
      y: 0,
      width: 100,
      height: 40,
    }));
    const reordered = reorderElementById(
      { ...template, elements },
      "top",
      "bottom",
    );
    expect(reordered.elements.map((element) => element.id)).toEqual([
      "top",
      "bottom",
      "middle",
    ]);
  });
});
