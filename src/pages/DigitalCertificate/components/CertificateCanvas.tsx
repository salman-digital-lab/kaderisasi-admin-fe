import React, { useRef, useState, useCallback, useEffect } from "react";
import { DragOutlined, SelectOutlined } from "@ant-design/icons";
import { CertificateElement, CertificateTemplate } from "../types";
import { DraggableElement } from "./DraggableElement";
import { useElementDrag, useElementResize, useCanvasPan } from "./hooks";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CertificateCanvasProps {
  template: CertificateTemplate;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onUpdateElement: (id: string, updates: Partial<CertificateElement>) => void;
}

type ToolMode = "select" | "pan";

// ─── Constants ──────────────────────────────────────────────────────────────

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

// ─── Styles ─────────────────────────────────────────────────────────────────

const toolButtonBase: React.CSSProperties = {
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

const floatingPanelStyle: React.CSSProperties = {
  position: "absolute",
  zIndex: 10,
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderRadius: 6,
  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.15)",
  userSelect: "none",
};

const gridPatternStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage: `
    linear-gradient(to right, #f0f0f0 1px, transparent 1px),
    linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
  `,
  backgroundSize: "20px 20px",
  pointerEvents: "none",
};

// ─── Sub-components ─────────────────────────────────────────────────────────

interface ToolbarProps {
  toolMode: ToolMode;
  onSetMode: (mode: ToolMode) => void;
}

const CanvasToolbar: React.FC<ToolbarProps> = React.memo(
  ({ toolMode, onSetMode }) => {
    const makeToolButtonStyle = (mode: ToolMode): React.CSSProperties => ({
      ...toolButtonBase,
      backgroundColor: toolMode === mode ? "#e6f4ff" : "transparent",
      color: toolMode === mode ? "#1890ff" : "#595959",
    });

    return (
      <div
        style={{
          ...floatingPanelStyle,
          top: 12,
          left: 12,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          padding: 4,
        }}
      >
        <button
          onClick={() => onSetMode("select")}
          title="Select & Move (V)"
          style={makeToolButtonStyle("select")}
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
          onClick={() => onSetMode("pan")}
          title="Pan Canvas (H)"
          style={makeToolButtonStyle("pan")}
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
    );
  },
);

CanvasToolbar.displayName = "CanvasToolbar";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = React.memo(
  ({ zoom, onZoomIn, onZoomOut, onResetView }) => {
    const zoomBtnStyle: React.CSSProperties = {
      border: "none",
      background: "none",
      cursor: "pointer",
      padding: "2px 6px",
      fontSize: 14,
      lineHeight: 1,
      borderRadius: 3,
    };

    return (
      <div
        style={{
          ...floatingPanelStyle,
          bottom: 12,
          left: 12,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 8px",
          fontSize: 12,
        }}
      >
        <button
          onClick={onZoomOut}
          style={zoomBtnStyle}
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
          style={{ minWidth: 40, textAlign: "center", cursor: "pointer" }}
          onClick={onResetView}
          title="Fit to view"
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          style={zoomBtnStyle}
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
    );
  },
);

ZoomControls.displayName = "ZoomControls";

// ─── Main Component ─────────────────────────────────────────────────────────

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
    const [toolMode, setToolMode] = useState<ToolMode>("select");

    // Viewport state
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Track element positions during interactions without triggering re-renders
    const elementPositionsRef = useRef<Map<string, { x: number; y: number }>>(
      new Map(),
    );

    // ── Interaction hooks ─────────────────────────────────────────────────

    const {
      isDragging,
      startDrag,
      cleanup: cleanupDrag,
    } = useElementDrag({
      zoom,
      toolMode,
      onMoveElement,
      elementPositionsRef,
    });

    const {
      isResizing,
      startResize,
      cleanup: cleanupResize,
    } = useElementResize({
      zoom,
      onUpdateElement,
      elementPositionsRef,
    });

    const {
      isPanning,
      startPan,
      cleanup: cleanupPan,
    } = useCanvasPan({ offset, setOffset });

    // ── Sync element positions ────────────────────────────────────────────

    useEffect(() => {
      const positions = new Map<string, { x: number; y: number }>();
      template.elements.forEach((el) => {
        positions.set(el.id, { x: el.x, y: el.y });
      });
      elementPositionsRef.current = positions;
    }, [template.elements]);

    // ── Center canvas on mount ────────────────────────────────────────────

    useEffect(() => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setOffset({
          x: (clientWidth - template.canvasWidth) / 2,
          y: (clientHeight - template.canvasHeight) / 2,
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Keyboard shortcuts ────────────────────────────────────────────────

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          (e.target as HTMLElement).isContentEditable
        ) {
          return;
        }
        if (e.key === "v" || e.key === "V") setToolMode("select");
        else if (e.key === "h" || e.key === "H") setToolMode("pan");
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // ── Cleanup on unmount ────────────────────────────────────────────────

    useEffect(() => {
      return () => {
        cleanupDrag();
        cleanupResize();
        cleanupPan();
      };
    }, [cleanupDrag, cleanupResize, cleanupPan]);

    // ── Container event handlers ──────────────────────────────────────────

    const handleContainerMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && toolMode === "pan")) {
          startPan(e);
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

    // ── Zoom controls ─────────────────────────────────────────────────────

    const handleZoomIn = useCallback(
      () => setZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP)),
      [zoom],
    );

    const handleZoomOut = useCallback(
      () => setZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP)),
      [zoom],
    );

    const handleResetView = useCallback(() => {
      if (!containerRef.current) return;

      const { clientWidth, clientHeight } = containerRef.current;
      const scaleX = (clientWidth - 48) / template.canvasWidth;
      const scaleY = (clientHeight - 48) / template.canvasHeight;
      const fitZoom = Math.min(scaleX, scaleY, 1);

      setZoom(fitZoom);
      setOffset({
        x: (clientWidth - template.canvasWidth * fitZoom) / 2,
        y: (clientHeight - template.canvasHeight * fitZoom) / 2,
      });
    }, [template.canvasWidth, template.canvasHeight]);

    // ── Cursor ────────────────────────────────────────────────────────────

    const cursor =
      toolMode === "pan"
        ? isPanning
          ? "grabbing"
          : "grab"
        : isResizing || isDragging
          ? "default"
          : "default";

    // ── Render ────────────────────────────────────────────────────────────

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
        <CanvasToolbar toolMode={toolMode} onSetMode={setToolMode} />

        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
        />

        {/* Keyboard hint */}
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
            {!template.backgroundUrl && <div style={gridPatternStyle} />}

            {template.elements.map((element) => (
              <DraggableElement
                key={element.id}
                element={element}
                isSelected={element.id === selectedElementId}
                onSelect={() => {
                  if (toolMode === "select") onSelectElement(element.id);
                }}
                onDragStart={(e) => startDrag(element, e)}
                onResizeStart={(handle, e) => startResize(element, handle, e)}
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
