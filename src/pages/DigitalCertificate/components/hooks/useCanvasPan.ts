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

  const handlePanMove = useCallback(
    (e: MouseEvent) => {
      if (!panRef.current) return;

      setOffset({
        x: panRef.current.offsetStartX + (e.clientX - panRef.current.startX),
        y: panRef.current.offsetStartY + (e.clientY - panRef.current.startY),
      });
    },
    [setOffset],
  );

  const handlePanUp = useCallback(() => {
    panRef.current = null;
    setIsPanning(false);
    document.removeEventListener("mousemove", handlePanMove);
    document.removeEventListener("mouseup", handlePanUp);
  }, [handlePanMove]);

  const startPan = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        offsetStartX: offset.x,
        offsetStartY: offset.y,
      };
      setIsPanning(true);
      document.addEventListener("mousemove", handlePanMove);
      document.addEventListener("mouseup", handlePanUp);
    },
    [offset, handlePanMove, handlePanUp],
  );

  const cleanup = useCallback(() => {
    document.removeEventListener("mousemove", handlePanMove);
    document.removeEventListener("mouseup", handlePanUp);
  }, [handlePanMove, handlePanUp]);

  return { isPanning, startPan, cleanup };
}
