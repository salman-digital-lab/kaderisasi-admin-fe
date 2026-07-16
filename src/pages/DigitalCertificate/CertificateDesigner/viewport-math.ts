import type { CertificateTemplateElement } from "../../../types/services/certificateTemplate";
import type { ViewportPoint, ViewportState } from "./editor-state";

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
export const DRAG_THRESHOLD = 3;

export function fitViewport(
  viewportWidth: number,
  viewportHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  padding = 48,
): ViewportState {
  const zoom = Math.min(
    Math.max(MIN_ZOOM, (viewportWidth - padding) / canvasWidth),
    Math.max(MIN_ZOOM, (viewportHeight - padding) / canvasHeight),
    1,
  );
  return {
    zoom,
    offset: {
      x: (viewportWidth - canvasWidth * zoom) / 2,
      y: (viewportHeight - canvasHeight * zoom) / 2,
    },
    mode: "fit",
  };
}

export function screenToCanvas(
  point: ViewportPoint,
  viewport: ViewportState,
): ViewportPoint {
  return {
    x: (point.x - viewport.offset.x) / viewport.zoom,
    y: (point.y - viewport.offset.y) / viewport.zoom,
  };
}

export function zoomAtPoint(
  viewport: ViewportState,
  nextZoom: number,
  focalPoint: ViewportPoint,
): ViewportState {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
  const canvasPoint = screenToCanvas(focalPoint, viewport);
  return {
    zoom,
    offset: {
      x: focalPoint.x - canvasPoint.x * zoom,
      y: focalPoint.y - canvasPoint.y * zoom,
    },
    mode: "custom",
  };
}

export function preserveViewportCentre(
  viewport: ViewportState,
  previousSize: ViewportPoint,
  nextSize: ViewportPoint,
): ViewportState {
  if (viewport.mode === "fit") return viewport;
  const canvasPoint = screenToCanvas(
    { x: previousSize.x / 2, y: previousSize.y / 2 },
    viewport,
  );
  return {
    ...viewport,
    offset: {
      x: nextSize.x / 2 - canvasPoint.x * viewport.zoom,
      y: nextSize.y / 2 - canvasPoint.y * viewport.zoom,
    },
  };
}

export function clampElementPosition(
  element: Pick<CertificateTemplateElement, "width" | "height">,
  point: ViewportPoint,
  canvasWidth: number,
  canvasHeight: number,
): ViewportPoint {
  return {
    x: Math.min(Math.max(0, canvasWidth - element.width), Math.max(0, point.x)),
    y: Math.min(
      Math.max(0, canvasHeight - element.height),
      Math.max(0, point.y),
    ),
  };
}

export function getCentredElementPosition(
  size: Pick<CertificateTemplateElement, "width" | "height">,
  viewportCentre: ViewportPoint,
  canvasWidth: number,
  canvasHeight: number,
): ViewportPoint {
  return clampElementPosition(
    size,
    {
      x: viewportCentre.x - size.width / 2,
      y: viewportCentre.y - size.height / 2,
    },
    canvasWidth,
    canvasHeight,
  );
}

export function hasPassedDragThreshold(
  deltaX: number,
  deltaY: number,
): boolean {
  return Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD;
}
