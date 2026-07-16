import { useRef, useState, useCallback } from "react";
import { CertificateElement } from "../../types";

interface DragState {
  elementId: string;
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
  elementWidth: number;
  elementHeight: number;
  moved: boolean;
}

interface UseElementDragOptions {
  zoom: number;
  toolMode: string;
  canvasWidth: number;
  canvasHeight: number;
  snapToGrid: boolean;
  snapToGuides: boolean;
  gridSize: number;
  onGuidesChange: (guides: { vertical: boolean; horizontal: boolean }) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  elementPositionsRef: React.MutableRefObject<
    Map<string, { x: number; y: number }>
  >;
  elementNodesRef: React.MutableRefObject<Map<string, HTMLDivElement>>;
}

/**
 * Handles element drag-to-move interactions on the canvas.
 * Uses RAF for smooth, zoom-aware position updates via direct DOM manipulation.
 */
export function useElementDrag({
  zoom,
  toolMode,
  canvasWidth,
  canvasHeight,
  snapToGrid,
  snapToGuides,
  gridSize,
  onGuidesChange,
  onMoveElement,
  elementPositionsRef,
  elementNodesRef,
}: UseElementDragOptions) {
  const dragRef = useRef<DragState | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateDomPosition = useCallback(
    (id: string, x: number, y: number) => {
      const el = elementNodesRef.current.get(id);
      if (el) {
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
      }
      elementPositionsRef.current.set(id, { x, y });
    },
    [elementNodesRef, elementPositionsRef],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragRef.current) return;

      if (
        !dragRef.current.moved &&
        Math.hypot(
          e.clientX - dragRef.current.startX,
          e.clientY - dragRef.current.startY,
        ) < 3
      ) {
        return;
      }
      dragRef.current.moved = true;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        if (!dragRef.current) return;

        const deltaX = (e.clientX - dragRef.current.startX) / zoom;
        const deltaY = (e.clientY - dragRef.current.startY) / zoom;
        const { elementWidth, elementHeight } = dragRef.current;
        const maxX = Math.max(0, canvasWidth - elementWidth);
        const maxY = Math.max(0, canvasHeight - elementHeight);

        let newX = Math.min(
          maxX,
          Math.max(0, dragRef.current.elementStartX + deltaX),
        );
        let newY = Math.min(
          maxY,
          Math.max(0, dragRef.current.elementStartY + deltaY),
        );

        if (snapToGrid) {
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }

        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;
        const elementCenterX = newX + elementWidth / 2;
        const elementCenterY = newY + elementHeight / 2;
        const verticalGuide =
          snapToGuides && Math.abs(elementCenterX - canvasCenterX) <= 6;
        const horizontalGuide =
          snapToGuides && Math.abs(elementCenterY - canvasCenterY) <= 6;

        if (verticalGuide) newX = Math.round(canvasCenterX - elementWidth / 2);
        if (horizontalGuide) {
          newY = Math.round(canvasCenterY - elementHeight / 2);
        }

        newX = Math.min(maxX, Math.max(0, newX));
        newY = Math.min(maxY, Math.max(0, newY));

        onGuidesChange({
          vertical: verticalGuide,
          horizontal: horizontalGuide,
        });

        updateDomPosition(dragRef.current.elementId, newX, newY);
      });
    },
    [
      canvasHeight,
      canvasWidth,
      gridSize,
      onGuidesChange,
      snapToGrid,
      snapToGuides,
      updateDomPosition,
      zoom,
    ],
  );

  const handlePointerUp = useCallback(() => {
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
    onGuidesChange({ vertical: false, horizontal: false });
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    document.removeEventListener("pointercancel", handlePointerUp);
  }, [handlePointerMove, onGuidesChange, onMoveElement, elementPositionsRef]);

  const startDrag = useCallback(
    (element: CertificateElement, e: React.PointerEvent) => {
      if (toolMode === "pan" || element.locked) return;
      e.preventDefault();
      e.stopPropagation();

      dragRef.current = {
        elementId: element.id,
        startX: e.clientX,
        startY: e.clientY,
        elementStartX: element.x,
        elementStartY: element.y,
        elementWidth: element.width,
        elementHeight: element.height,
        moved: false,
      };

      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("pointercancel", handlePointerUp);
    },
    [handlePointerMove, handlePointerUp, toolMode],
  );

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    dragRef.current = null;
    setIsDragging(false);
    onGuidesChange({ vertical: false, horizontal: false });
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    document.removeEventListener("pointercancel", handlePointerUp);
  }, [handlePointerMove, handlePointerUp, onGuidesChange]);

  return { isDragging, startDrag, cleanup };
}
