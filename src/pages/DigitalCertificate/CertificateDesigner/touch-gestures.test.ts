import { describe, expect, it } from "vitest";
import { TouchGestures } from "./touch-gestures";
import { preserveViewportCentre, screenToCanvas } from "./viewport-math";
import type { ViewportState } from "./editor-state";

const viewport: ViewportState = {
  zoom: 1,
  offset: { x: 0, y: 0 },
  mode: "custom",
};
describe("certificate touch transitions", () => {
  it("starts pinch from the current first finger position and signals cancellation of element manipulation", () => {
    const gestures = new TouchGestures();
    expect(gestures.down(1, { x: 0, y: 0 }, viewport)).toBe(false);
    expect(gestures.move(1, { x: 50, y: 0 }, { x: 0, y: 0 })).toBeNull();
    expect(gestures.down(2, { x: 150, y: 0 }, viewport)).toBe(true);
    expect(gestures.move(2, { x: 150, y: 0 }, { x: 0, y: 0 })).toEqual(
      viewport,
    );
    const zoomed = gestures.move(2, { x: 250, y: 0 }, { x: 0, y: 0 })!;
    expect(zoomed.zoom).toBe(2);
    expect(screenToCanvas({ x: 150, y: 0 }, zoomed)).toEqual({ x: 100, y: 0 });
  });
  it("stops pinching after a finger ends or is cancelled and does not resume an old drag", () => {
    const gestures = new TouchGestures();
    gestures.down(1, { x: 0, y: 0 }, viewport);
    gestures.down(2, { x: 100, y: 0 }, viewport);
    gestures.end(2);
    expect(gestures.move(1, { x: 20, y: 0 }, { x: 0, y: 0 })).toBeNull();
    gestures.end(1);
    expect(gestures.move(1, { x: 50, y: 0 }, { x: 0, y: 0 })).toBeNull();
    expect(gestures.down(3, { x: 80, y: 0 }, viewport)).toBe(false);
  });
  it("preserves custom zoom and canvas centre through portrait, landscape, and wide panels", () => {
    const initial: ViewportState = {
      zoom: 1.7,
      offset: { x: -520, y: -130 },
      mode: "custom",
    };
    const sizes = [
      { x: 390, y: 650 },
      { x: 844, y: 240 },
      { x: 720, y: 840 },
      { x: 390, y: 650 },
    ];
    let current = initial;
    const centre = screenToCanvas(
      { x: sizes[0].x / 2, y: sizes[0].y / 2 },
      initial,
    );
    for (let i = 1; i < sizes.length; i++) {
      current = preserveViewportCentre(current, sizes[i - 1], sizes[i]);
      const actual = screenToCanvas(
        { x: sizes[i].x / 2, y: sizes[i].y / 2 },
        current,
      );
      expect(actual.x).toBeCloseTo(centre.x);
      expect(actual.y).toBeCloseTo(centre.y);
      expect(current.zoom).toBe(initial.zoom);
    }
  });
});
