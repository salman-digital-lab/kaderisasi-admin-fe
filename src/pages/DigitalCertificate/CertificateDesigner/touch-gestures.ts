import type { ViewportPoint, ViewportState } from "./editor-state";
import { zoomAtPoint } from "./viewport-math";

interface TouchPair {
  distance: number;
  midpoint: ViewportPoint;
}
function measure(points: ViewportPoint[]): TouchPair {
  const [a, b] = points;
  return {
    distance: Math.hypot(b.x - a.x, b.y - a.y),
    midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
  };
}

/** Tracks current finger positions even before the second finger arrives. */
export class TouchGestures {
  private pointers = new Map<number, ViewportPoint>();
  private start: (TouchPair & { viewport: ViewportState }) | null = null;

  down(id: number, point: ViewportPoint, viewport: ViewportState): boolean {
    this.pointers.set(id, point);
    if (this.pointers.size >= 2) {
      if (!this.start)
        this.start = { ...measure([...this.pointers.values()]), viewport };
      return true;
    }
    return false;
  }

  move(
    id: number,
    point: ViewportPoint,
    origin: ViewportPoint,
  ): ViewportState | null {
    if (!this.pointers.has(id)) return null;
    this.pointers.set(id, point);
    if (!this.start || this.pointers.size < 2) return null;
    const current = measure([...this.pointers.values()]);
    const focal = {
      x: this.start.midpoint.x - origin.x,
      y: this.start.midpoint.y - origin.y,
    };
    const next = zoomAtPoint(
      this.start.viewport,
      (this.start.viewport.zoom * current.distance) /
        Math.max(1, this.start.distance),
      focal,
    );
    return {
      ...next,
      offset: {
        x: next.offset.x + current.midpoint.x - this.start.midpoint.x,
        y: next.offset.y + current.midpoint.y - this.start.midpoint.y,
      },
    };
  }

  end(id: number): void {
    this.pointers.delete(id);
    if (this.pointers.size < 2) this.start = null;
  }
}
