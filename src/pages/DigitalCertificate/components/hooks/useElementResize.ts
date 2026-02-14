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
}

interface UseElementResizeOptions {
  zoom: number;
  onUpdateElement: (id: string, updates: Partial<CertificateElement>) => void;
  elementPositionsRef: React.MutableRefObject<
    Map<string, { x: number; y: number }>
  >;
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

  return { x: Math.max(0, x), y: Math.max(0, y), w, h };
}

/**
 * Handles element resize interactions on the canvas.
 * Uses RAF for smooth, zoom-aware size updates via direct DOM manipulation.
 */
export function useElementResize({
  zoom,
  onUpdateElement,
  elementPositionsRef,
}: UseElementResizeOptions) {
  const resizeRef = useRef<ResizeState | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const updateDomSize = useCallback(
    (id: string, x: number, y: number, w: number, h: number) => {
      const el = document.querySelector(
        `[data-element-id="${id}"]`,
      ) as HTMLElement | null;
      if (el) {
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${w}px`;
        if (el.style.minHeight) {
          el.style.minHeight = `${h}px`;
        } else {
          el.style.height = `${h}px`;
        }
      }
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizeRef.current) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const r = resizeRef.current;
        if (!r) return;

        const deltaX = (e.clientX - r.startX) / zoom;
        const deltaY = (e.clientY - r.startY) / zoom;
        const result = computeResize(
          r.handle,
          deltaX,
          deltaY,
          r.elementStartX,
          r.elementStartY,
          r.elementStartW,
          r.elementStartH,
        );

        updateDomSize(r.elementId, result.x, result.y, result.w, result.h);
        elementPositionsRef.current.set(r.elementId, {
          x: result.x,
          y: result.y,
        });
      });
    },
    [zoom, updateDomSize, elementPositionsRef],
  );

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (resizeRef.current) {
      const r = resizeRef.current;
      const el = document.querySelector(
        `[data-element-id="${r.elementId}"]`,
      ) as HTMLElement | null;
      if (el) {
        onUpdateElement(r.elementId, {
          x: parseFloat(el.style.left) || 0,
          y: parseFloat(el.style.top) || 0,
          width: parseFloat(el.style.width) || r.elementStartW,
          height:
            parseFloat(el.style.height || el.style.minHeight) ||
            r.elementStartH,
        });
      }
      resizeRef.current = null;
    }

    setIsResizing(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove, onUpdateElement]);

  const startResize = useCallback(
    (
      element: CertificateElement,
      handle: ResizeHandle,
      e: React.MouseEvent,
    ) => {
      e.preventDefault();
      e.stopPropagation();

      resizeRef.current = {
        elementId: element.id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        elementStartX: element.x,
        elementStartY: element.y,
        elementStartW: element.width,
        elementStartH: element.height,
      };

      setIsResizing(true);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp],
  );

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  return { isResizing, startResize, cleanup };
}
