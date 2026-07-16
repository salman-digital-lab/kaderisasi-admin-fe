import { describe, expect, it } from "vitest";
import {
  createDocumentHistoryState,
  documentHistoryReducer,
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
});
