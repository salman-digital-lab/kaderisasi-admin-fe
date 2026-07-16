import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { getCertificateAssetUrl } from "../utils/certificate-content";
import { DragOutlined, SelectOutlined } from "@ant-design/icons";
import { Button, Switch, Tooltip } from "antd";
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
  snapToGrid: boolean;
  showGuides: boolean;
  onSnapToGridChange: (value: boolean) => void;
  onShowGuidesChange: (value: boolean) => void;
}

type ToolMode = "select" | "pan";

// ─── Constants ──────────────────────────────────────────────────────────────

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const GRID_SIZE = 10;

// ─── Styles ─────────────────────────────────────────────────────────────────

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
        <Tooltip title="Pilih dan geser (V)" placement="right">
          <Button
            type={toolMode === "select" ? "primary" : "text"}
            icon={<SelectOutlined />}
            onClick={() => onSetMode("select")}
            aria-label="Aktifkan alat pilih dan geser"
            aria-pressed={toolMode === "select"}
          />
        </Tooltip>
        <Tooltip title="Geser kanvas (H)" placement="right">
          <Button
            type={toolMode === "pan" ? "primary" : "text"}
            icon={<DragOutlined />}
            onClick={() => onSetMode("pan")}
            aria-label="Aktifkan alat geser kanvas"
            aria-pressed={toolMode === "pan"}
          />
        </Tooltip>
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
        <Button
          type="text"
          size="small"
          onClick={onZoomOut}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Perkecil tampilan"
        >
          −
        </Button>
        <Button
          type="text"
          size="small"
          style={{ minWidth: 52, paddingInline: 4 }}
          onClick={onResetView}
          title="Sesuaikan kanvas ke area kerja"
          aria-label={`Sesuaikan kanvas ke area kerja, zoom saat ini ${Math.round(zoom * 100)} persen`}
        >
          {Math.round(zoom * 100)}%
        </Button>
        <Button
          type="text"
          size="small"
          onClick={onZoomIn}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Perbesar tampilan"
        >
          +
        </Button>
      </div>
    );
  },
);

ZoomControls.displayName = "ZoomControls";

interface CanvasAssistControlsProps {
  snapToGrid: boolean;
  showGuides: boolean;
  onSnapToGridChange: (value: boolean) => void;
  onShowGuidesChange: (value: boolean) => void;
}

const CanvasAssistControls: React.FC<CanvasAssistControlsProps> = React.memo(
  ({ snapToGrid, showGuides, onSnapToGridChange, onShowGuidesChange }) => (
    <div
      style={{
        ...floatingPanelStyle,
        top: 12,
        right: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "8px 10px",
        fontSize: 12,
      }}
    >
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Switch
          size="small"
          checked={snapToGrid}
          onChange={onSnapToGridChange}
          aria-label="Aktifkan penempelan ke grid"
        />
        Grid
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Switch
          size="small"
          checked={showGuides}
          onChange={onShowGuidesChange}
          aria-label="Tampilkan garis bantu tengah"
        />
        Guides
      </label>
    </div>
  ),
);

CanvasAssistControls.displayName = "CanvasAssistControls";

// ─── Main Component ─────────────────────────────────────────────────────────

export const CertificateCanvas: React.FC<CertificateCanvasProps> = React.memo(
  ({
    template,
    selectedElementId,
    onSelectElement,
    onMoveElement,
    onUpdateElement,
    snapToGrid,
    showGuides,
    onSnapToGridChange,
    onShowGuidesChange,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const elementNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
    const [toolMode, setToolMode] = useState<ToolMode>("select");

    // Viewport state
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [activeGuides, setActiveGuides] = useState({
      vertical: false,
      horizontal: false,
    });

    // Track element positions during interactions without triggering re-renders
    const elementPositionsRef = useRef<Map<string, { x: number; y: number }>>(
      new Map(),
    );

    const handleGuidesChange = useCallback(
      (guides: { vertical: boolean; horizontal: boolean }) => {
        setActiveGuides((current) =>
          current.vertical === guides.vertical &&
          current.horizontal === guides.horizontal
            ? current
            : guides,
        );
      },
      [],
    );

    // ── Interaction hooks ─────────────────────────────────────────────────

    const {
      isDragging,
      startDrag,
      cleanup: cleanupDrag,
    } = useElementDrag({
      zoom,
      toolMode,
      canvasWidth: template.canvasWidth,
      canvasHeight: template.canvasHeight,
      snapToGrid,
      gridSize: GRID_SIZE,
      onGuidesChange: handleGuidesChange,
      onMoveElement,
      elementPositionsRef,
      elementNodesRef,
    });

    const {
      isResizing,
      startResize,
      cleanup: cleanupResize,
    } = useElementResize({
      zoom,
      canvasWidth: template.canvasWidth,
      canvasHeight: template.canvasHeight,
      onUpdateElement,
      elementPositionsRef,
      elementNodesRef,
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

    const registerElementNode = useCallback(
      (id: string, node: HTMLDivElement | null) => {
        if (node) {
          elementNodesRef.current.set(id, node);
        } else {
          elementNodesRef.current.delete(id);
        }
      },
      [],
    );

    // ── Center canvas on mount ────────────────────────────────────────────

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
    }, [template.canvasHeight, template.canvasWidth]);

    useEffect(() => {
      handleResetView();
    }, [handleResetView]);

    useEffect(() => {
      const resizeObserver = new ResizeObserver(() => handleResetView());
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }, [handleResetView]);

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

    const handleZoomIn = useCallback(() => {
      setZoom((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP));
    }, []);

    const handleZoomOut = useCallback(() => {
      setZoom((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP));
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((current) =>
        e.deltaY < 0
          ? Math.min(MAX_ZOOM, current + ZOOM_STEP)
          : Math.max(MIN_ZOOM, current - ZOOM_STEP),
      );
    }, []);

    const handleElementContentChange = useCallback(
      (id: string, content: string) => onUpdateElement(id, { content }),
      [onUpdateElement],
    );

    const handleSelectElement = useCallback(
      (id: string) => {
        if (toolMode === "select") onSelectElement(id);
      },
      [onSelectElement, toolMode],
    );

    const visibleElements = useMemo(
      () => template.elements.filter((element) => element.visible !== false),
      [template.elements],
    );
    const resolvedBackgroundUrl = useMemo(
      () => getCertificateAssetUrl(template.backgroundUrl),
      [template.backgroundUrl],
    );

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
        role="region"
        aria-label="Area desain sertifikat"
        tabIndex={0}
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          backgroundColor: "#e8e8e8",
          overflow: "hidden",
          cursor,
        }}
        onMouseDown={handleContainerMouseDown}
        onWheel={handleWheel}
      >
        <CanvasToolbar toolMode={toolMode} onSetMode={setToolMode} />

        <CanvasAssistControls
          snapToGrid={snapToGrid}
          showGuides={showGuides}
          onSnapToGridChange={onSnapToGridChange}
          onShowGuidesChange={onShowGuidesChange}
        />

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
          V: select · H: pan · Del: delete
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
              backgroundImage: resolvedBackgroundUrl
                ? `url(${resolvedBackgroundUrl})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
            onClick={handleCanvasClick}
          >
            {!template.backgroundUrl && snapToGrid && (
              <div style={gridPatternStyle} />
            )}

            {showGuides && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "50%",
                    borderLeft: activeGuides.vertical
                      ? "1px solid #ff4d4f"
                      : "1px dashed rgba(24, 144, 255, 0.35)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "50%",
                    borderTop: activeGuides.horizontal
                      ? "1px solid #ff4d4f"
                      : "1px dashed rgba(24, 144, 255, 0.35)",
                    pointerEvents: "none",
                  }}
                />
              </>
            )}

            {visibleElements.map((element) => (
              <DraggableElement
                key={element.id}
                element={element}
                isSelected={element.id === selectedElementId}
                onSelect={handleSelectElement}
                onDragStart={startDrag}
                onResizeStart={startResize}
                onContentChange={
                  element.type === "static-text"
                    ? handleElementContentChange
                    : undefined
                }
                onNodeChange={registerElementNode}
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
);

CertificateCanvas.displayName = "CertificateCanvas";
