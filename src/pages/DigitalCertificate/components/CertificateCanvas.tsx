import React, { useRef, useState, useCallback, useEffect } from "react";
import { DragOutlined, SelectOutlined } from "@ant-design/icons";
import { CertificateElement, CertificateTemplate } from "../types";
import { DraggableElement, ResizeHandle } from "./DraggableElement";
import { ELEMENT_MIN_WIDTH, ELEMENT_MIN_HEIGHT } from "../constants";

interface CertificateCanvasProps {
  template: CertificateTemplate;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onUpdateElement: (id: string, updates: Partial<CertificateElement>) => void;
}

interface DragState {
  elementId: string;
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
}

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

interface PanState {
  startX: number;
  startY: number;
  offsetStartX: number;
  offsetStartY: number;
}

type ToolMode = "select" | "pan";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export const CertificateCanvas: React.FC<CertificateCanvasProps> = React.memo(
  ({
    template,
    selectedElementId,
    onSelectElement,
    onMoveElement,
    onUpdateElement,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<DragState | null>(null);
    const resizeRef = useRef<ResizeState | null>(null);
    const panRef = useRef<PanState | null>(null);
    const rafRef = useRef<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [toolMode, setToolMode] = useState<ToolMode>("select");

    // Viewport state
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Track element positions during drag without triggering re-renders
    const elementPositionsRef = useRef<Map<string, { x: number; y: number }>>(
      new Map(),
    );

    // Sync element positions when template changes
    useEffect(() => {
      const positions = new Map<string, { x: number; y: number }>();
      template.elements.forEach((el) => {
        positions.set(el.id, { x: el.x, y: el.y });
      });
      elementPositionsRef.current = positions;
    }, [template.elements]);

    // Center canvas on mount
    useEffect(() => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        setOffset({
          x: (containerWidth - template.canvasWidth) / 2,
          y: (containerHeight - template.canvasHeight) / 2,
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keyboard shortcut: V for select, H for pan
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          (e.target as HTMLElement).isContentEditable
        ) {
          return;
        }
        if (e.key === "v" || e.key === "V") {
          setToolMode("select");
        } else if (e.key === "h" || e.key === "H") {
          setToolMode("pan");
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // --- Element dragging ---
    const updateElementPosition = useCallback(
      (id: string, x: number, y: number) => {
        const element = document.querySelector(
          `[data-element-id="${id}"]`,
        ) as HTMLElement;
        if (element) {
          element.style.left = `${x}px`;
          element.style.top = `${y}px`;
        }
        elementPositionsRef.current.set(id, { x, y });
      },
      [],
    );

    const handleElementMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!dragRef.current) return;

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          if (!dragRef.current) return;

          const deltaX = (e.clientX - dragRef.current.startX) / zoom;
          const deltaY = (e.clientY - dragRef.current.startY) / zoom;

          const newX = Math.max(0, dragRef.current.elementStartX + deltaX);
          const newY = Math.max(0, dragRef.current.elementStartY + deltaY);

          updateElementPosition(dragRef.current.elementId, newX, newY);
        });
      },
      [updateElementPosition, zoom],
    );

    const handleElementMouseUp = useCallback(() => {
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

      document.removeEventListener("mousemove", handleElementMouseMove);
      document.removeEventListener("mouseup", handleElementMouseUp);
    }, [handleElementMouseMove, onMoveElement]);

    const handleDragStart = useCallback(
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

        document.addEventListener("mousemove", handleElementMouseMove);
        document.addEventListener("mouseup", handleElementMouseUp);
      },
      [handleElementMouseMove, handleElementMouseUp, toolMode],
    );

    // --- Element resizing ---
    const updateElementSize = useCallback(
      (id: string, x: number, y: number, w: number, h: number) => {
        const element = document.querySelector(
          `[data-element-id="${id}"]`,
        ) as HTMLElement;
        if (element) {
          element.style.left = `${x}px`;
          element.style.top = `${y}px`;
          element.style.width = `${w}px`;
          // Update height or minHeight based on the current style
          if (element.style.minHeight) {
            element.style.minHeight = `${h}px`;
          } else {
            element.style.height = `${h}px`;
          }
        }
      },
      [],
    );

    const handleResizeMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!resizeRef.current) return;

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          if (!resizeRef.current) return;

          const r = resizeRef.current;
          const deltaX = (e.clientX - r.startX) / zoom;
          const deltaY = (e.clientY - r.startY) / zoom;

          let newX = r.elementStartX;
          let newY = r.elementStartY;
          let newW = r.elementStartW;
          let newH = r.elementStartH;

          switch (r.handle) {
            case "se":
              newW = Math.max(ELEMENT_MIN_WIDTH, r.elementStartW + deltaX);
              newH = Math.max(ELEMENT_MIN_HEIGHT, r.elementStartH + deltaY);
              break;
            case "sw":
              newW = Math.max(ELEMENT_MIN_WIDTH, r.elementStartW - deltaX);
              newH = Math.max(ELEMENT_MIN_HEIGHT, r.elementStartH + deltaY);
              newX = r.elementStartX + (r.elementStartW - newW);
              break;
            case "ne":
              newW = Math.max(ELEMENT_MIN_WIDTH, r.elementStartW + deltaX);
              newH = Math.max(ELEMENT_MIN_HEIGHT, r.elementStartH - deltaY);
              newY = r.elementStartY + (r.elementStartH - newH);
              break;
            case "nw":
              newW = Math.max(ELEMENT_MIN_WIDTH, r.elementStartW - deltaX);
              newH = Math.max(ELEMENT_MIN_HEIGHT, r.elementStartH - deltaY);
              newX = r.elementStartX + (r.elementStartW - newW);
              newY = r.elementStartY + (r.elementStartH - newH);
              break;
          }

          newX = Math.max(0, newX);
          newY = Math.max(0, newY);

          updateElementSize(r.elementId, newX, newY, newW, newH);
          // Store position for commit on mouseup
          elementPositionsRef.current.set(r.elementId, { x: newX, y: newY });
        });
      },
      [zoom, updateElementSize],
    );

    const handleResizeMouseUp = useCallback(() => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (resizeRef.current) {
        const r = resizeRef.current;
        // Read the final dimensions from the DOM element
        const el = document.querySelector(
          `[data-element-id="${r.elementId}"]`,
        ) as HTMLElement;
        if (el) {
          const finalX = parseFloat(el.style.left) || 0;
          const finalY = parseFloat(el.style.top) || 0;
          const finalW = parseFloat(el.style.width) || r.elementStartW;
          const finalH =
            parseFloat(el.style.height || el.style.minHeight) ||
            r.elementStartH;
          onUpdateElement(r.elementId, {
            x: finalX,
            y: finalY,
            width: finalW,
            height: finalH,
          });
        }
        resizeRef.current = null;
      }

      setIsResizing(false);

      document.removeEventListener("mousemove", handleResizeMouseMove);
      document.removeEventListener("mouseup", handleResizeMouseUp);
    }, [handleResizeMouseMove, onUpdateElement]);

    const handleResizeStart = useCallback(
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

        document.addEventListener("mousemove", handleResizeMouseMove);
        document.addEventListener("mouseup", handleResizeMouseUp);
      },
      [handleResizeMouseMove, handleResizeMouseUp],
    );

    // --- Panning ---
    const handlePanMove = useCallback((e: MouseEvent) => {
      if (!panRef.current) return;

      const deltaX = e.clientX - panRef.current.startX;
      const deltaY = e.clientY - panRef.current.startY;

      setOffset({
        x: panRef.current.offsetStartX + deltaX,
        y: panRef.current.offsetStartY + deltaY,
      });
    }, []);

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

    const handleContainerMouseDown = useCallback(
      (e: React.MouseEvent) => {
        // Middle mouse button always pans regardless of mode
        if (e.button === 1) {
          startPan(e);
          return;
        }

        // In pan mode, left click pans
        if (e.button === 0 && toolMode === "pan") {
          startPan(e);
          return;
        }
      },
      [toolMode, startPan],
    );

    const handleCanvasClick = useCallback(
      (e: React.MouseEvent) => {
        if (isPanning || toolMode === "pan") return;
        if (e.target === e.currentTarget || e.target === canvasRef.current) {
          onSelectElement(null);
        }
      },
      [onSelectElement, isPanning, toolMode],
    );

    // Reset view
    const handleResetView = useCallback(() => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const scaleX = (containerWidth - 48) / template.canvasWidth;
        const scaleY = (containerHeight - 48) / template.canvasHeight;
        const fitZoom = Math.min(scaleX, scaleY, 1);

        setZoom(fitZoom);
        setOffset({
          x: (containerWidth - template.canvasWidth * fitZoom) / 2,
          y: (containerHeight - template.canvasHeight * fitZoom) / 2,
        });
      }
    }, [template.canvasWidth, template.canvasHeight]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        document.removeEventListener("mousemove", handleElementMouseMove);
        document.removeEventListener("mouseup", handleElementMouseUp);
        document.removeEventListener("mousemove", handleResizeMouseMove);
        document.removeEventListener("mouseup", handleResizeMouseUp);
        document.removeEventListener("mousemove", handlePanMove);
        document.removeEventListener("mouseup", handlePanUp);
      };
    }, [
      handleElementMouseMove,
      handleElementMouseUp,
      handleResizeMouseMove,
      handleResizeMouseUp,
      handlePanMove,
      handlePanUp,
    ]);

    const cursor =
      toolMode === "pan"
        ? isPanning
          ? "grabbing"
          : "grab"
        : isResizing
          ? "default"
          : isDragging
            ? "default"
            : "default";

    const toolBtnBase: React.CSSProperties = {
      width: 32,
      height: 32,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      borderRadius: 4,
      cursor: "pointer",
      fontSize: 16,
      transition: "background-color 0.15s",
    };

    return (
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          backgroundColor: "#e8e8e8",
          overflow: "hidden",
          cursor,
        }}
        onMouseDown={handleContainerMouseDown}
      >
        {/* Tool mode toggle */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: 6,
            padding: 4,
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.15)",
            userSelect: "none",
          }}
        >
          <button
            onClick={() => setToolMode("select")}
            title="Select & Move (V)"
            style={{
              ...toolBtnBase,
              backgroundColor:
                toolMode === "select" ? "#e6f4ff" : "transparent",
              color: toolMode === "select" ? "#1890ff" : "#595959",
            }}
            onMouseEnter={(e) => {
              if (toolMode !== "select")
                e.currentTarget.style.backgroundColor = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              if (toolMode !== "select")
                e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <SelectOutlined />
          </button>
          <button
            onClick={() => setToolMode("pan")}
            title="Pan Canvas (H)"
            style={{
              ...toolBtnBase,
              backgroundColor: toolMode === "pan" ? "#e6f4ff" : "transparent",
              color: toolMode === "pan" ? "#1890ff" : "#595959",
            }}
            onMouseEnter={(e) => {
              if (toolMode !== "pan")
                e.currentTarget.style.backgroundColor = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              if (toolMode !== "pan")
                e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <DragOutlined />
          </button>
        </div>

        {/* Zoom controls */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 4,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: 6,
            padding: "4px 8px",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.15)",
            fontSize: 12,
            userSelect: "none",
          }}
        >
          <button
            onClick={() => setZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: "2px 6px",
              fontSize: 14,
              lineHeight: 1,
              borderRadius: 3,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f0f0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            −
          </button>
          <span
            style={{
              minWidth: 40,
              textAlign: "center",
              cursor: "pointer",
            }}
            onClick={handleResetView}
            title="Fit to view"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: "2px 6px",
              fontSize: 14,
              lineHeight: 1,
              borderRadius: 3,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f0f0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            +
          </button>
        </div>

        {/* Hint */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            zIndex: 10,
            fontSize: 11,
            color: "#999",
            userSelect: "none",
          }}
        >
          V: select · H: pan
        </div>

        {/* Transformed canvas container */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        >
          <div
            ref={canvasRef}
            style={{
              position: "relative",
              width: template.canvasWidth,
              height: template.canvasHeight,
              backgroundColor: "#ffffff",
              backgroundImage: template.backgroundUrl
                ? `url(${template.backgroundUrl})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
            onClick={handleCanvasClick}
          >
            {/* Grid pattern when no background */}
            {!template.backgroundUrl && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `
                    linear-gradient(to right, #f0f0f0 1px, transparent 1px),
                    linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
                  `,
                  backgroundSize: "20px 20px",
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Render elements */}
            {template.elements.map((element) => (
              <DraggableElement
                key={element.id}
                element={element}
                isSelected={element.id === selectedElementId}
                onSelect={() => {
                  if (toolMode === "select") onSelectElement(element.id);
                }}
                onDragStart={(e) => handleDragStart(element, e)}
                onResizeStart={(handle, e) =>
                  handleResizeStart(element, handle, e)
                }
                onContentChange={
                  element.type === "static-text"
                    ? (content) => onUpdateElement(element.id, { content })
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
);

CertificateCanvas.displayName = "CertificateCanvas";
