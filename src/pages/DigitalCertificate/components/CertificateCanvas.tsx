import { useAdminViewport } from "../../../hooks/useAdminViewport";
import { TouchGestures } from "../CertificateDesigner/touch-gestures";
import { SettingOutlined } from "@ant-design/icons";
import { Button, Divider, Popover, Space, Switch, Typography } from "antd";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "../CertificateDesigner/CertificateDesigner.module.css";
import type {
  EditorTool,
  ViewportPoint,
  ViewportState,
} from "../CertificateDesigner/editor-state";
import {
  getToolForKey,
  isEditableTarget,
} from "../CertificateDesigner/editor-state";
import {
  fitViewport,
  preserveViewportCentre,
  screenToCanvas,
  zoomAtPoint,
} from "../CertificateDesigner/viewport-math";
import type { CertificateElement, CertificateTemplate } from "../types";
import { getCertificateAssetUrl } from "../utils/certificate-content";
import { DraggableElement } from "./DraggableElement";
import { useCanvasPan, useElementDrag, useElementResize } from "./hooks";

interface CertificateCanvasProps {
  viewportSnapshot?: React.RefObject<CanvasViewportSnapshot | null>;
  template: CertificateTemplate;
  selectedElementId: string | null;
  tool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  onViewportCentreChange?: (point: ViewportPoint) => void;
  editElementId?: string | null;
  onEditComplete?: () => void;
  onSelectElement: (id: string | null) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onUpdateElement: (id: string, updates: Partial<CertificateElement>) => void;
  snapToGrid: boolean;
  showGrid: boolean;
  showGuides: boolean;
  snapToGuides: boolean;
  onSnapToGridChange?: (value: boolean) => void;
  onShowGridChange?: (value: boolean) => void;
  onShowGuidesChange?: (value: boolean) => void;
  onSnapToGuidesChange?: (value: boolean) => void;
}

const GRID_SIZE = 10;

export interface CanvasViewportSnapshot {
  viewport: ViewportState;
  size: ViewportPoint;
}

export const CertificateCanvas: React.FC<CertificateCanvasProps> = React.memo(
  ({
    viewportSnapshot,
    template,
    selectedElementId,
    tool,
    onToolChange,
    onViewportCentreChange,
    editElementId,
    onEditComplete,
    onSelectElement,
    onMoveElement,
    onUpdateElement,
    snapToGrid,
    showGrid,
    showGuides,
    snapToGuides,
    onSnapToGridChange,
    onShowGridChange,
    onShowGuidesChange,
    onSnapToGuidesChange,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const elementNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
    const elementPositionsRef = useRef<Map<string, ViewportPoint>>(new Map());
    const viewportRef = useRef<ViewportState>(
      viewportSnapshot?.current?.viewport ?? {
        zoom: 1,
        offset: { x: 0, y: 0 },
        mode: "fit",
      },
    );
    const previousSizeRef = useRef<ViewportPoint>(
      viewportSnapshot?.current?.size ?? { x: 0, y: 0 },
    );
    const restoringViewport = useRef(Boolean(viewportSnapshot?.current));
    const heldSpaceRef = useRef(false);
    const viewportCentreCallbackRef = useRef(onViewportCentreChange);
    viewportCentreCallbackRef.current = onViewportCentreChange;
    const touchGestures = useRef(new TouchGestures());
    const { compact } = useAdminViewport();
    const [temporaryHand, setTemporaryHand] = useState(false);
    const [viewport, setViewportState] = useState(viewportRef.current);
    const [activeGuides, setActiveGuides] = useState({
      vertical: false,
      horizontal: false,
    });
    const [announcement, setAnnouncement] = useState("Alat pilih aktif");
    const effectiveTool: "select" | "pan" =
      temporaryHand || tool === "hand" ? "pan" : "select";

    const setViewport = useCallback(
      (next: ViewportState | ((current: ViewportState) => ViewportState)) => {
        const value =
          typeof next === "function" ? next(viewportRef.current) : next;
        viewportRef.current = value;
        setViewportState(value);
        const node = containerRef.current;
        if (viewportSnapshot && node)
          viewportSnapshot.current = {
            viewport: value,
            size: { x: node.clientWidth, y: node.clientHeight },
          };
      },
      [viewportSnapshot],
    );

    const reportViewportCentre = useCallback(() => {
      const node = containerRef.current;
      const callback = viewportCentreCallbackRef.current;
      if (!node || !callback) return;
      callback(
        screenToCanvas(
          { x: node.clientWidth / 2, y: node.clientHeight / 2 },
          viewportRef.current,
        ),
      );
    }, []);

    const fit = useCallback(() => {
      const node = containerRef.current;
      if (!node) return;
      setViewport(
        fitViewport(
          node.clientWidth,
          node.clientHeight,
          template.canvasWidth,
          template.canvasHeight,
        ),
      );
      setAnnouncement("Kanvas disesuaikan ke area kerja");
      requestAnimationFrame(reportViewportCentre);
    }, [
      reportViewportCentre,
      setViewport,
      template.canvasHeight,
      template.canvasWidth,
    ]);

    useEffect(() => {
      if (restoringViewport.current) {
        restoringViewport.current = false;
        return;
      }
      fit();
    }, [fit]);

    useEffect(() => {
      const node = containerRef.current;
      if (!node) return;
      const observer = new ResizeObserver(() => {
        const nextSize = { x: node.clientWidth, y: node.clientHeight };
        const previousSize = previousSizeRef.current;
        previousSizeRef.current = nextSize;
        if (!previousSize.x || viewportRef.current.mode === "fit") fit();
        else
          setViewport(
            preserveViewportCentre(viewportRef.current, previousSize, nextSize),
          );
        requestAnimationFrame(reportViewportCentre);
      });
      observer.observe(node);
      return () => observer.disconnect();
    }, [fit, reportViewportCentre, setViewport]);

    useEffect(() => {
      elementPositionsRef.current = new Map(
        template.elements.map((element) => [
          element.id,
          { x: element.x, y: element.y },
        ]),
      );
    }, [template.elements]);

    const handleGuidesChange = useCallback(
      (next: { vertical: boolean; horizontal: boolean }) => {
        setActiveGuides((current) =>
          current.vertical === next.vertical &&
          current.horizontal === next.horizontal
            ? current
            : next,
        );
      },
      [],
    );

    const handleMoveCommit = useCallback(
      (id: string, x: number, y: number) => {
        onMoveElement(id, x, y);
        setAnnouncement(`Posisi elemen ${Math.round(x)}, ${Math.round(y)}`);
      },
      [onMoveElement],
    );

    const handleResizeCommit = useCallback(
      (id: string, updates: Partial<CertificateElement>) => {
        onUpdateElement(id, updates);
        setAnnouncement(
          `Ukuran elemen ${Math.round(updates.width || 0)} kali ${Math.round(updates.height || 0)}`,
        );
      },
      [onUpdateElement],
    );

    const handleViewportOffsetChange = useCallback(
      (offset: ViewportPoint) =>
        setViewport((current) => ({ ...current, offset, mode: "custom" })),
      [setViewport],
    );

    const {
      isDragging,
      startDrag,
      cleanup: cleanupDrag,
    } = useElementDrag({
      zoom: viewport.zoom,
      toolMode: effectiveTool,
      canvasWidth: template.canvasWidth,
      canvasHeight: template.canvasHeight,
      snapToGrid,
      snapToGuides,
      gridSize: GRID_SIZE,
      onGuidesChange: handleGuidesChange,
      onMoveElement: handleMoveCommit,
      elementPositionsRef,
      elementNodesRef,
    });
    const {
      isResizing,
      startResize,
      cleanup: cleanupResize,
    } = useElementResize({
      zoom: viewport.zoom,
      canvasWidth: template.canvasWidth,
      canvasHeight: template.canvasHeight,
      onUpdateElement: handleResizeCommit,
      elementPositionsRef,
      elementNodesRef,
    });
    const {
      isPanning,
      startPan,
      cleanup: cleanupPan,
      stop: stopPan,
    } = useCanvasPan({
      offset: viewport.offset,
      setOffset: handleViewportOffsetChange,
    });

    useEffect(
      () => () => {
        cleanupDrag();
        cleanupResize();
        cleanupPan();
      },
      [cleanupDrag, cleanupPan, cleanupResize],
    );

    useEffect(() => {
      const keyDown = (event: KeyboardEvent): void => {
        if (isEditableTarget(event.target) || event.altKey) return;
        if (event.key === "Escape") {
          event.preventDefault();
          if (isDragging || isResizing || isPanning) {
            cleanupDrag();
            cleanupResize();
            stopPan();
          } else {
            onSelectElement(null);
          }
          return;
        }
        if (event.code === "Space" && !event.repeat) {
          event.preventDefault();
          heldSpaceRef.current = true;
          setTemporaryHand(true);
          setAnnouncement("Alat tangan sementara aktif");
          return;
        }
        const nextTool = getToolForKey(
          event.key,
          event.metaKey || event.ctrlKey || event.shiftKey,
        );
        if (nextTool) {
          onToolChange(nextTool);
          setAnnouncement(
            nextTool === "hand" ? "Alat tangan aktif" : "Alat pilih aktif",
          );
        }
      };
      const restore = (event?: KeyboardEvent): void => {
        if (event && event.code !== "Space") return;
        if (!heldSpaceRef.current) return;
        heldSpaceRef.current = false;
        setTemporaryHand(false);
        setAnnouncement(
          tool === "hand" ? "Alat tangan aktif" : "Alat pilih aktif",
        );
      };
      const restoreOnBlur = (): void => restore();
      window.addEventListener("keydown", keyDown);
      window.addEventListener("keyup", restore);
      window.addEventListener("blur", restoreOnBlur);
      return () => {
        window.removeEventListener("keydown", keyDown);
        window.removeEventListener("keyup", restore);
        window.removeEventListener("blur", restoreOnBlur);
      };
    }, [
      cleanupDrag,
      cleanupPan,
      cleanupResize,
      isDragging,
      isPanning,
      isResizing,
      onSelectElement,
      onToolChange,
      tool,
    ]);

    const handlePointerDown = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (
          (event.target as HTMLElement).closest(
            "button, input, textarea, select, [contenteditable=true]",
          )
        )
          return;
        if (event.pointerType === "touch") {
          if (
            touchGestures.current.down(
              event.pointerId,
              { x: event.clientX, y: event.clientY },
              viewportRef.current,
            )
          ) {
            event.stopPropagation();
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            cleanupDrag();
            cleanupResize();
            stopPan();
            return;
          }
        }
        if (
          event.button === 1 ||
          (event.button === 0 && effectiveTool === "pan")
        )
          startPan(event);
      },
      [cleanupDrag, cleanupResize, effectiveTool, startPan, stopPan],
    );

    const handlePointerMove = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const next = touchGestures.current.move(
          event.pointerId,
          { x: event.clientX, y: event.clientY },
          { x: rect.left, y: rect.top },
        );
        if (next) setViewport(next);
      },
      [setViewport],
    );

    const handlePointerEnd = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        touchGestures.current.end(event.pointerId);
        reportViewportCentre();
      },
      [reportViewportCentre],
    );

    const handleCanvasPointerDown = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && effectiveTool === "select")
          onSelectElement(null);
      },
      [effectiveTool, onSelectElement],
    );

    const handleWheel = useCallback(
      (event: React.WheelEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) {
          const rect = event.currentTarget.getBoundingClientRect();
          const focal = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };
          const factor = Math.exp(-event.deltaY * 0.002);
          setViewport((current) =>
            zoomAtPoint(current, current.zoom * factor, focal),
          );
        } else {
          setViewport((current) => ({
            ...current,
            offset: {
              x: current.offset.x - event.deltaX,
              y: current.offset.y - event.deltaY,
            },
            mode: "custom",
          }));
        }
        requestAnimationFrame(reportViewportCentre);
      },
      [reportViewportCentre, setViewport],
    );

    const zoomBy = useCallback(
      (factor: number) => {
        const node = containerRef.current;
        if (!node) return;
        setViewport((current) =>
          zoomAtPoint(current, current.zoom * factor, {
            x: node.clientWidth / 2,
            y: node.clientHeight / 2,
          }),
        );
        requestAnimationFrame(reportViewportCentre);
      },
      [reportViewportCentre, setViewport],
    );

    const setOneHundredPercent = useCallback(() => {
      const node = containerRef.current;
      if (!node) return;
      setViewport((current) =>
        zoomAtPoint(current, 1, {
          x: node.clientWidth / 2,
          y: node.clientHeight / 2,
        }),
      );
    }, [setViewport]);

    const registerElementNode = useCallback(
      (id: string, node: HTMLDivElement | null) => {
        if (node) elementNodesRef.current.set(id, node);
        else elementNodesRef.current.delete(id);
      },
      [],
    );
    const elementsRef = useRef(template.elements);
    elementsRef.current = template.elements;
    const handleElementSelect = useCallback(
      (id: string): void => {
        if (effectiveTool !== "select") return;
        onSelectElement(id);
        const element = elementsRef.current.find((item) => item.id === id);
        setAnnouncement(
          `${element?.name || element?.type || "Elemen"} dipilih`,
        );
      },
      [effectiveTool, onSelectElement],
    );
    const handleContentChange = useCallback(
      (id: string, content: string): void => onUpdateElement(id, { content }),
      [onUpdateElement],
    );

    const visibleElements = useMemo(
      () => template.elements.filter((element) => element.visible !== false),
      [template.elements],
    );
    const backgroundUrl = useMemo(
      () => getCertificateAssetUrl(template.backgroundUrl),
      [template.backgroundUrl],
    );

    return (
      <div
        ref={containerRef}
        className={styles.canvasViewport}
        role="application"
        aria-label="Kanvas desain sertifikat"
        aria-describedby="canvas-shortcuts"
        tabIndex={0}
        onPointerDownCapture={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onWheel={handleWheel}
        style={{
          cursor:
            effectiveTool === "pan"
              ? isPanning
                ? "grabbing"
                : "grab"
              : "default",
        }}
      >
        <span className={styles.srOnly} aria-live="polite">
          {announcement}
        </span>
        <div id="canvas-shortcuts" className={styles.srOnly}>
          V untuk pilih, H untuk tangan, tahan Spasi untuk tangan sementara,
          tombol panah menggeser elemen.
        </div>
        <Space.Compact className={styles.zoomControls}>
          <Button onClick={() => zoomBy(0.9)} aria-label="Perkecil">
            −
          </Button>
          <Button onClick={setOneHundredPercent}>
            {Math.round(viewport.zoom * 100)}%
          </Button>
          <Button onClick={() => zoomBy(1.1)} aria-label="Perbesar">
            +
          </Button>
          <Button onClick={fit}>Fit</Button>
          <Popover
            trigger="click"
            placement="topLeft"
            content={
              <Space direction="vertical" size="small">
                <Typography.Text strong>Tampilan & snap</Typography.Text>
                <Divider style={{ margin: 0 }} />
                <Switch
                  checked={showGrid}
                  onChange={onShowGridChange}
                  checkedChildren="Grid"
                  unCheckedChildren="Grid"
                />
                <Switch
                  checked={snapToGrid}
                  onChange={onSnapToGridChange}
                  checkedChildren="Snap grid"
                  unCheckedChildren="Snap grid"
                />
                <Switch
                  checked={showGuides}
                  onChange={onShowGuidesChange}
                  checkedChildren="Sumbu tetap"
                  unCheckedChildren="Sumbu tetap"
                />
                <Switch
                  checked={snapToGuides}
                  onChange={onSnapToGuidesChange}
                  checkedChildren="Snap tengah"
                  unCheckedChildren="Snap tengah"
                />
              </Space>
            }
          >
            <Button
              icon={<SettingOutlined />}
              aria-label="Pengaturan tampilan dan snapping"
            />
          </Popover>
        </Space.Compact>
        <div className={styles.canvasHint}>
          V Pilih · H Tangan · Spasi Geser
        </div>
        <div
          className={styles.canvasTransform}
          style={{
            transform: `translate(${viewport.offset.x}px, ${viewport.offset.y}px) scale(${viewport.zoom})`,
          }}
        >
          <div
            ref={canvasRef}
            className={styles.certificateCanvas}
            style={{
              width: template.canvasWidth,
              height: template.canvasHeight,
              backgroundColor: "#fff",
            }}
            onPointerDown={handleCanvasPointerDown}
          >
            {backgroundUrl ? (
              <img
                crossOrigin="anonymous"
                src={backgroundUrl}
                alt=""
                aria-hidden
                draggable={false}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  pointerEvents: "none",
                }}
              />
            ) : null}
            {showGrid ? (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  backgroundImage:
                    "linear-gradient(to right, rgba(0,0,0,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.06) 1px, transparent 1px)",
                  backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                }}
              />
            ) : null}
            {showGuides || activeGuides.vertical || activeGuides.horizontal ? (
              <>
                <div
                  className={`${styles.guideVertical} ${activeGuides.vertical ? styles.guideActive : ""}`}
                />
                <div
                  className={`${styles.guideHorizontal} ${activeGuides.horizontal ? styles.guideActive : ""}`}
                />
              </>
            ) : null}
            {visibleElements.map((element) => (
              <DraggableElement
                compactControls={compact}
                key={element.id}
                element={element}
                isSelected={element.id === selectedElementId}
                onSelect={handleElementSelect}
                onDragStart={startDrag}
                onResizeStart={startResize}
                onContentChange={
                  element.type === "static-text"
                    ? handleContentChange
                    : undefined
                }
                onNodeChange={registerElementNode}
                startEditing={element.id === editElementId}
                onEditComplete={onEditComplete}
                zoom={viewport.zoom}
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
);

CertificateCanvas.displayName = "CertificateCanvas";
