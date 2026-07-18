import { useRef, useState, useCallback } from "react";
import { CertificateElement } from "../../types";
import { ELEMENT_MIN_WIDTH, ELEMENT_MIN_HEIGHT } from "../../constants";
import type { ResizeHandle } from "../DraggableElement";

interface ResizeState {
  elementId: string;
  handle: ResizeHandle;
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
  elementStartW: number;
  elementStartH: number;
  latestX: number;
  latestY: number;
  latestW: number;
  latestH: number;
  usesMinHeight: boolean;
}

interface UseElementResizeOptions {
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  onUpdateElement: (id: string, updates: Partial<CertificateElement>) => void;
  elementPositionsRef: React.MutableRefObject<
    Map<string, { x: number; y: number }>
  >;
  elementNodesRef: React.MutableRefObject<Map<string, HTMLDivElement>>;
}

/**
 * Calculates new position and size based on which corner handle is being dragged.
 * Enforces minimum width/height constraints and prevents negative positions.
 */
function computeResize(
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  startX: number,
  startY: number,
  startW: number,
  startH: number,
  canvasWidth: number,
  canvasHeight: number,
  preserveAspect: boolean,
) {
  let x = startX;
  let y = startY;
  let w = startW;
  let h = startH;

  switch (handle) {
    case "se":
      w = Math.max(ELEMENT_MIN_WIDTH, startW + deltaX);
      h = Math.max(ELEMENT_MIN_HEIGHT, startH + deltaY);
      break;
    case "sw":
      w = Math.max(ELEMENT_MIN_WIDTH, startW - deltaX);
      h = Math.max(ELEMENT_MIN_HEIGHT, startH + deltaY);
      x = startX + (startW - w);
      break;
    case "ne":
      w = Math.max(ELEMENT_MIN_WIDTH, startW + deltaX);
      h = Math.max(ELEMENT_MIN_HEIGHT, startH - deltaY);
      y = startY + (startH - h);
      break;
    case "nw":
      w = Math.max(ELEMENT_MIN_WIDTH, startW - deltaX);
      h = Math.max(ELEMENT_MIN_HEIGHT, startH - deltaY);
      x = startX + (startW - w);
      y = startY + (startH - h);
      break;
  }

  if (preserveAspect) {
    const ratio = startW / startH;
    if (Math.abs(deltaX) >= Math.abs(deltaY)) h = w / ratio;
    else w = h * ratio;
    if (handle === "nw" || handle === "sw") x = startX + startW - w;
    if (handle === "nw" || handle === "ne") y = startY + startH - h;
  }

  x = Math.min(Math.max(0, x), Math.max(0, canvasWidth - ELEMENT_MIN_WIDTH));
  y = Math.min(Math.max(0, y), Math.max(0, canvasHeight - ELEMENT_MIN_HEIGHT));
  w = Math.max(
    ELEMENT_MIN_WIDTH,
    Math.min(w, Math.max(ELEMENT_MIN_WIDTH, canvasWidth - x)),
  );
  h = Math.max(
    ELEMENT_MIN_HEIGHT,
    Math.min(h, Math.max(ELEMENT_MIN_HEIGHT, canvasHeight - y)),
  );

  return { x, y, w, h };
}

/**
 * Handles element resize interactions on the canvas.
 * Uses RAF for smooth, zoom-aware size updates via direct DOM manipulation.
 */
export function useElementResize({
  zoom,
  canvasWidth,
  canvasHeight,
  onUpdateElement,
  elementPositionsRef,
  elementNodesRef,
}: UseElementResizeOptions) {
  const resizeRef = useRef<ResizeState | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const optionsRef = useRef({
    zoom,
    canvasWidth,
    canvasHeight,
    onUpdateElement,
    elementPositionsRef,
    elementNodesRef,
  });
  optionsRef.current = {
    zoom,
    canvasWidth,
    canvasHeight,
    onUpdateElement,
    elementPositionsRef,
    elementNodesRef,
  };

  const updateDomSize = useCallback(
    (
      id: string,
      x: number,
      y: number,
      w: number,
      h: number,
      usesMinHeight: boolean,
    ) => {
      const el = optionsRef.current.elementNodesRef.current.get(id);
      if (el) {
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${w}px`;
        if (usesMinHeight) {
          el.style.minHeight = `${h}px`;
        } else {
          el.style.height = `${h}px`;
        }
        el.dataset.geometry = `${Math.round(w)} × ${Math.round(h)}`;
        el.classList.add("certificate-element-manipulating");
      }
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!resizeRef.current) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const r = resizeRef.current;
        if (!r) return;
        const {
          zoom: currentZoom,
          canvasWidth: currentCanvasWidth,
          canvasHeight: currentCanvasHeight,
          elementPositionsRef: positionsRef,
        } = optionsRef.current;

        const deltaX = (e.clientX - r.startX) / currentZoom;
        const deltaY = (e.clientY - r.startY) / currentZoom;
        const result = computeResize(
          r.handle,
          deltaX,
          deltaY,
          r.elementStartX,
          r.elementStartY,
          r.elementStartW,
          r.elementStartH,
          currentCanvasWidth,
          currentCanvasHeight,
          e.shiftKey,
        );

        r.latestX = result.x;
        r.latestY = result.y;
        r.latestW = result.w;
        r.latestH = result.h;

        updateDomSize(
          r.elementId,
          result.x,
          result.y,
          result.w,
          result.h,
          r.usesMinHeight,
        );
        positionsRef.current.set(r.elementId, {
          x: result.x,
          y: result.y,
        });
      });
    },
    [updateDomSize],
  );

  const handlePointerUp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (resizeRef.current) {
      const r = resizeRef.current;
      optionsRef.current.onUpdateElement(r.elementId, {
        x: r.latestX,
        y: r.latestY,
        width: r.latestW,
        height: r.latestH,
      });
      const node = optionsRef.current.elementNodesRef.current.get(r.elementId);
      node?.classList.remove("certificate-element-manipulating");
      if (node) delete node.dataset.geometry;
      resizeRef.current = null;
    }

    setIsResizing(false);
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    document.removeEventListener("pointercancel", handlePointerUp);
  }, [handlePointerMove]);

  const startResize = useCallback(
    (
      element: CertificateElement,
      handle: ResizeHandle,
      e: React.PointerEvent,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);

      resizeRef.current = {
        elementId: element.id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        elementStartX: element.x,
        elementStartY: element.y,
        elementStartW: element.width,
        elementStartH: element.height,
        latestX: element.x,
        latestY: element.y,
        latestW: element.width,
        latestH: element.height,
        usesMinHeight: false,
      };

      setIsResizing(true);
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("pointercancel", handlePointerUp);
    },
    [handlePointerMove, handlePointerUp],
  );

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (resizeRef.current) {
      const r = resizeRef.current;
      updateDomSize(
        r.elementId,
        r.elementStartX,
        r.elementStartY,
        r.elementStartW,
        r.elementStartH,
        r.usesMinHeight,
      );
      optionsRef.current.elementPositionsRef.current.set(r.elementId, {
        x: r.elementStartX,
        y: r.elementStartY,
      });
      const node = optionsRef.current.elementNodesRef.current.get(r.elementId);
      node?.classList.remove("certificate-element-manipulating");
      if (node) delete node.dataset.geometry;
    }
    resizeRef.current = null;
    setIsResizing(false);
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    document.removeEventListener("pointercancel", handlePointerUp);
  }, [handlePointerMove, handlePointerUp, updateDomSize]);

  return { isResizing, startResize, cleanup };
}
