import { useRef, useState, useCallback } from "react";

interface PanState {
  startX: number;
  startY: number;
  offsetStartX: number;
  offsetStartY: number;
}

interface UseCanvasPanOptions {
  offset: { x: number; y: number };
  setOffset: (offset: { x: number; y: number }) => void;
}

/**
 * Handles canvas panning via mouse drag.
 * Supports both dedicated pan mode and middle-click panning.
 */
export function useCanvasPan({ offset, setOffset }: UseCanvasPanOptions) {
  const panRef = useRef<PanState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const optionsRef = useRef({ offset, setOffset });
  optionsRef.current = { offset, setOffset };

  const handlePanMove = useCallback((e: PointerEvent) => {
    if (!panRef.current) return;

    optionsRef.current.setOffset({
      x: panRef.current.offsetStartX + (e.clientX - panRef.current.startX),
      y: panRef.current.offsetStartY + (e.clientY - panRef.current.startY),
    });
  }, []);

  const handlePanUp = useCallback(() => {
    panRef.current = null;
    setIsPanning(false);
    document.removeEventListener("pointermove", handlePanMove);
    document.removeEventListener("pointerup", handlePanUp);
    document.removeEventListener("pointercancel", handlePanUp);
  }, [handlePanMove]);

  const startPan = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        offsetStartX: optionsRef.current.offset.x,
        offsetStartY: optionsRef.current.offset.y,
      };
      setIsPanning(true);
      document.addEventListener("pointermove", handlePanMove);
      document.addEventListener("pointerup", handlePanUp);
      document.addEventListener("pointercancel", handlePanUp);
    },
    [handlePanMove, handlePanUp],
  );

  const cleanup = useCallback(() => {
    panRef.current = null;
    setIsPanning(false);
    document.removeEventListener("pointermove", handlePanMove);
    document.removeEventListener("pointerup", handlePanUp);
    document.removeEventListener("pointercancel", handlePanUp);
  }, [handlePanMove, handlePanUp]);

  return { isPanning, startPan, cleanup };
}
