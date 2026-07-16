import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getToolForKey,
  hasRecoveryConflict,
  readRecoverySnapshot,
  RECOVERY_MAX_AGE_MS,
  writeRecoverySnapshot,
} from "./editor-state";
import {
  fitViewport,
  getCentredElementPosition,
  hasPassedDragThreshold,
  screenToCanvas,
  zoomAtPoint,
} from "./viewport-math";

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  } satisfies Storage);
});

describe("certificate editor state", () => {
  it("ignores tool shortcuts with modifiers", () => {
    expect(getToolForKey("v", true)).toBeNull();
    expect(getToolForKey("V", false)).toBe("select");
    expect(getToolForKey("h", false)).toBe("hand");
  });

  it("expires recovery and detects server conflicts", () => {
    const snapshot = {
      version: 1 as const,
      templateId: 12,
      serverVersion: "one",
      timestamp: 100,
      name: "Template",
      description: "",
      backgroundImage: null,
      template: {
        backgroundUrl: null,
        elements: [],
        canvasWidth: 800,
        canvasHeight: 566,
      },
    };
    writeRecoverySnapshot(snapshot);
    expect(readRecoverySnapshot(12, 100 + RECOVERY_MAX_AGE_MS - 1)).toEqual(
      snapshot,
    );
    expect(hasRecoveryConflict(snapshot, "two")).toBe(true);
    expect(readRecoverySnapshot(12, 100 + RECOVERY_MAX_AGE_MS + 1)).toBeNull();
  });
});

describe("certificate viewport math", () => {
  it("keeps pointer-centred zoom stable", () => {
    const viewport = fitViewport(1000, 700, 800, 566);
    const focal = { x: 650, y: 420 };
    const before = screenToCanvas(focal, viewport);
    const after = screenToCanvas(focal, zoomAtPoint(viewport, 1.5, focal));
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it("centres and clamps inserted elements", () => {
    expect(
      getCentredElementPosition(
        { width: 200, height: 100 },
        { x: 10, y: 10 },
        800,
        566,
      ),
    ).toEqual({ x: 0, y: 0 });
    expect(hasPassedDragThreshold(2, 2)).toBe(false);
    expect(hasPassedDragThreshold(3, 0)).toBe(true);
  });
});
