import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getToolForKey,
  hasRecoveryConflict,
  readRecoverySnapshot,
  RECOVERY_MAX_AGE_MS,
  writeRecoverySnapshot,
  readEditorPreferences,
} from "./editor-state";
import {
  fitViewport,
  getCentredElementPosition,
  hasPassedDragThreshold,
  screenToCanvas,
  zoomAtPoint,
} from "./viewport-math";
import { getBoundedGeometryValue } from "./geometry";
import { getCertificateReadinessAction } from "../utils/certificate-readiness";

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

  it("migrates helper visibility once while preserving panel preferences", () => {
    localStorage.setItem(
      "certificate-editor:preferences:v1",
      JSON.stringify({
        version: 1,
        layersWidth: 300,
        inspectorWidth: 360,
        layersCollapsed: true,
        inspectorCollapsed: false,
        canvas: {
          gridSize: 20,
          showGrid: true,
          snapToGrid: false,
          showGuides: true,
          snapToGuides: false,
        },
      }),
    );
    expect(readEditorPreferences()).toMatchObject({
      version: 2,
      layersWidth: 300,
      inspectorWidth: 360,
      layersCollapsed: true,
      canvas: {
        gridSize: 20,
        showGrid: false,
        snapToGrid: true,
        showGuides: false,
        snapToGuides: true,
      },
    });
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

describe("certificate editor routing and bounds", () => {
  it("rejects non-finite geometry and clamps commits to bounds", () => {
    expect(getBoundedGeometryValue(null, 42, 0, 100)).toBe(42);
    expect(getBoundedGeometryValue(Number.NaN, 42, 0, 100)).toBe(42);
    expect(getBoundedGeometryValue(-5, 42, 0, 100)).toBe(0);
    expect(getBoundedGeometryValue(120, 42, 0, 100)).toBe(100);
  });

  it("routes readiness issues only to controls that can resolve them", () => {
    expect(getCertificateReadinessAction("INVALID_CANVAS")).toBe(
      "open-canvas-settings",
    );
    expect(getCertificateReadinessAction("MISSING_ASSET")).toBe("select-layer");
    expect(
      getCertificateReadinessAction("MISSING_PUBLIC_CERTIFICATE_URL"),
    ).toBe("explain");
  });
});
