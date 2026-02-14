import { useRef, useState, useCallback } from "react";
import { CertificateElement } from "../../types";

interface DragState {
  elementId: string;
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
}

interface UseElementDragOptions {
  zoom: number;
  toolMode: string;
  onMoveElement: (id: string, x: number, y: number) => void;
  elementPositionsRef: React.MutableRefObject<
    Map<string, { x: number; y: number }>
  >;
}

/**
 * Handles element drag-to-move interactions on the canvas.
 * Uses RAF for smooth, zoom-aware position updates via direct DOM manipulation.
 */
export function useElementDrag({
  zoom,
  toolMode,
  onMoveElement,
  elementPositionsRef,
}: UseElementDragOptions) {
  const dragRef = useRef<DragState | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateDomPosition = useCallback(
    (id: string, x: number, y: number) => {
      const el = document.querySelector(
        `[data-element-id="${id}"]`,
      ) as HTMLElement | null;
      if (el) {
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
      }
      elementPositionsRef.current.set(id, { x, y });
    },
    [elementPositionsRef],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragRef.current) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        if (!dragRef.current) return;

        const deltaX = (e.clientX - dragRef.current.startX) / zoom;
        const deltaY = (e.clientY - dragRef.current.startY) / zoom;
        const newX = Math.max(0, dragRef.current.elementStartX + deltaX);
        const newY = Math.max(0, dragRef.current.elementStartY + deltaY);

        updateDomPosition(dragRef.current.elementId, newX, newY);
      });
    },
    [updateDomPosition, zoom],
  );

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (dragRef.current) {
      const pos = elementPositionsRef.current.get(dragRef.current.elementId);
      if (pos) {
        onMoveElement(dragRef.current.elementId, pos.x, pos.y);
      }
      dragRef.current = null;
    }

    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove, onMoveElement, elementPositionsRef]);

  const startDrag = useCallback(
    (element: CertificateElement, e: React.MouseEvent) => {
      if (toolMode === "pan") return;
      e.preventDefault();
      e.stopPropagation();

      dragRef.current = {
        elementId: element.id,
        startX: e.clientX,
        startY: e.clientY,
        elementStartX: element.x,
        elementStartY: element.y,
      };

      setIsDragging(true);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp, toolMode],
  );

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  return { isDragging, startDrag, cleanup };
}
