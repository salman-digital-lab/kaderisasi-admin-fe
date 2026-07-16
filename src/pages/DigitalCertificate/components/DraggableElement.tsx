import React from "react";
import { QRCode } from "antd";
import type { CertificateElement } from "../types";
import {
  CERTIFICATE_SAMPLE_CODE,
  getCertificateAssetUrl,
  getCertificateVerificationUrl,
} from "../utils/certificate-content";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ResizeHandle = "nw" | "ne" | "sw" | "se";

interface DraggableElementProps {
  element: CertificateElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (element: CertificateElement, e: React.PointerEvent) => void;
  onResizeStart?: (
    element: CertificateElement,
    handle: ResizeHandle,
    e: React.PointerEvent,
  ) => void;
  onContentChange?: (id: string, content: string) => void;
  onNodeChange: (id: string, node: HTMLDivElement | null) => void;
  startEditing?: boolean;
  onEditComplete?: () => void;
  zoom?: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const HANDLE_SIZE = 14;

const RESIZE_HANDLES: {
  key: ResizeHandle;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  cursor: string;
}[] = [
  {
    key: "nw",
    top: -HANDLE_SIZE / 2,
    left: -HANDLE_SIZE / 2,
    cursor: "nw-resize",
  },
  {
    key: "ne",
    top: -HANDLE_SIZE / 2,
    right: -HANDLE_SIZE / 2,
    cursor: "ne-resize",
  },
  {
    key: "sw",
    bottom: -HANDLE_SIZE / 2,
    left: -HANDLE_SIZE / 2,
    cursor: "sw-resize",
  },
  {
    key: "se",
    bottom: -HANDLE_SIZE / 2,
    right: -HANDLE_SIZE / 2,
    cursor: "se-resize",
  },
];

const fullSizeImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
};

const placeholderStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#f5f5f5",
  border: "1px dashed #d9d9d9",
  borderRadius: 4,
  fontSize: 12,
  color: "#999",
};

// ─── Helper: placeholder labels ─────────────────────────────────────────────

const PLACEHOLDER_LABELS: Record<string, string> = {
  image: "Gambar",
  "qr-code": "QR Code",
  signature: "Tanda Tangan",
};

// ─── Sub-components for element content ─────────────────────────────────────

/** Static text element with inline editing support. */
const StaticTextContent: React.FC<{
  content: string;
  style: React.CSSProperties;
  isEditing: boolean;
  onBlur: (e: React.FocusEvent<HTMLDivElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}> = ({ content, style, isEditing, onBlur, onKeyDown }) => (
  <div
    contentEditable={isEditing}
    suppressContentEditableWarning
    onBlur={onBlur}
    onKeyDown={onKeyDown}
    style={style}
  >
    {content}
  </div>
);

/** Variable text element with highlighted background. */
const VariableTextContent: React.FC<{
  variable: string;
  style: React.CSSProperties;
}> = ({ variable, style }) => (
  <div
    style={{
      ...style,
      backgroundColor: "rgba(24, 144, 255, 0.1)",
      padding: "2px 8px",
      borderRadius: 4,
    }}
  >
    {variable}
  </div>
);

/** Image-based element (image, qr-code, signature) with placeholder fallback. */
const ImageContent: React.FC<{
  imageUrl?: string;
  alt: string;
  placeholderLabel: string;
  objectFit: CertificateElement["objectFit"];
  borderRadius: number;
}> = ({ imageUrl, alt, placeholderLabel, objectFit, borderRadius }) =>
  imageUrl ? (
    <img
      src={imageUrl}
      alt={alt}
      style={{ ...fullSizeImageStyle, objectFit, borderRadius }}
      draggable={false}
    />
  ) : (
    <div style={{ ...placeholderStyle, borderRadius }}>{placeholderLabel}</div>
  );

// ─── Main Component ─────────────────────────────────────────────────────────

export const DraggableElement: React.FC<DraggableElementProps> = React.memo(
  ({
    element,
    isSelected,
    onSelect,
    onDragStart,
    onResizeStart,
    onContentChange,
    onNodeChange,
    startEditing,
    onEditComplete,
    zoom = 1,
  }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const nodeRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      if (!startEditing || element.type !== "static-text" || element.locked)
        return;
      setIsEditing(true);
      requestAnimationFrame(() => {
        const editable = nodeRef.current?.querySelector<HTMLElement>(
          "[contenteditable='true']",
        );
        editable?.focus();
        if (editable) {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editable);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      });
    }, [element.locked, element.type, startEditing]);

    // ── Event handlers ──────────────────────────────────────────────────

    const handleDoubleClick = React.useCallback(() => {
      if (
        element.type === "static-text" &&
        !element.locked &&
        onContentChange
      ) {
        setIsEditing(true);
      }
    }, [element.locked, element.type, onContentChange]);

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLDivElement>) => {
        if (isEditing && onContentChange) {
          onContentChange(element.id, e.currentTarget.textContent || "");
          setIsEditing(false);
          onEditComplete?.();
        }
      },
      [element.id, isEditing, onContentChange, onEditComplete],
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.currentTarget.textContent = element.content || "";
          setIsEditing(false);
          onEditComplete?.();
          (e.currentTarget as HTMLElement).blur();
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      },
      [element.content, onEditComplete],
    );

    const handleClick = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(element.id);
      },
      [element.id, onSelect],
    );

    const handlePointerDown = React.useCallback(
      (e: React.PointerEvent) => {
        if (e.button !== 0 || element.locked) return;
        onSelect(element.id);
        if (!isEditing) onDragStart(element, e);
      },
      [element, isEditing, onDragStart, onSelect],
    );

    const handleElementKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (isEditing) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onSelect(element.id);
        }
      },
      [element.id, isEditing, onSelect],
    );

    const handleNodeChange = React.useCallback(
      (node: HTMLDivElement | null) => {
        nodeRef.current = node;
        onNodeChange(element.id, node);
      },
      [element.id, onNodeChange],
    );

    // ── Memoized styles ─────────────────────────────────────────────────

    const textStyle: React.CSSProperties = React.useMemo(
      () => ({
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems:
          element.verticalAlign === "top"
            ? "flex-start"
            : element.verticalAlign === "bottom"
              ? "flex-end"
              : "center",
        justifyContent:
          element.textAlign === "left"
            ? "flex-start"
            : element.textAlign === "right"
              ? "flex-end"
              : "center",
        fontSize: element.fontSize || 16,
        fontFamily: element.fontFamily || "sans-serif",
        fontWeight: element.fontWeight || "normal",
        fontStyle: element.fontStyle || "normal",
        textDecoration: element.textDecoration || "none",
        lineHeight: element.lineHeight || 1.2,
        letterSpacing: element.letterSpacing || 0,
        color: element.color || "#000000",
        textAlign: element.textAlign || "center",
        margin: 0,
        outline: "none",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
      }),
      [
        element.color,
        element.fontFamily,
        element.fontSize,
        element.fontStyle,
        element.fontWeight,
        element.letterSpacing,
        element.lineHeight,
        element.textAlign,
        element.textDecoration,
        element.verticalAlign,
      ],
    );

    const isTextType =
      element.type === "static-text" || element.type === "variable-text";

    // ── Content renderer ────────────────────────────────────────────────

    const renderContent = () => {
      switch (element.type) {
        case "static-text":
          return (
            <StaticTextContent
              content={element.content || ""}
              style={textStyle}
              isEditing={isEditing}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
          );
        case "variable-text":
          return (
            <VariableTextContent
              variable={element.variable || ""}
              style={textStyle}
            />
          );
        case "qr-code": {
          const verificationUrl = getCertificateVerificationUrl(
            CERTIFICATE_SAMPLE_CODE,
          );
          return verificationUrl ? (
            <QRCode
              type="svg"
              bordered={false}
              value={verificationUrl}
              size={Math.max(24, Math.min(element.width, element.height) - 8)}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <div style={placeholderStyle}>URL publik belum dikonfigurasi</div>
          );
        }
        case "image":
        case "signature":
          return (
            <ImageContent
              imageUrl={getCertificateAssetUrl(element.imageUrl) || undefined}
              alt={element.type}
              objectFit={element.objectFit || "contain"}
              borderRadius={element.borderRadius || 0}
              placeholderLabel={
                PLACEHOLDER_LABELS[element.type] || element.type
              }
            />
          );
        default:
          return null;
      }
    };

    // ── Render ───────────────────────────────────────────────────────────

    return (
      <div
        ref={handleNodeChange}
        data-element-id={element.id}
        role="button"
        tabIndex={-1}
        aria-label={`${element.name || element.type}${element.locked ? ", terkunci" : ""}`}
        aria-pressed={isSelected}
        style={{
          position: "absolute",
          left: element.x,
          top: element.y,
          width: element.width,
          ...(isTextType
            ? { minHeight: element.height }
            : { height: element.height }),
          cursor: element.locked ? "default" : isEditing ? "text" : "move",
          border: isSelected ? "2px solid #1890ff" : "1px dashed transparent",
          borderRadius: element.borderRadius || 4,
          padding: 4,
          boxSizing: "border-box",
          opacity: (element.opacity ?? 100) / 100,
          transform: `rotate(${element.rotation || 0}deg)`,
          transformOrigin: "center center",
          userSelect: isEditing ? "text" : "none",
          willChange: "left, top",
        }}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleElementKeyDown}
      >
        {renderContent()}

        {isSelected &&
          !element.locked &&
          RESIZE_HANDLES.map(({ key, cursor, ...pos }) => (
            <div
              key={key}
              style={{
                position: "absolute",
                ...pos,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                backgroundColor: "#1890ff",
                borderRadius: "50%",
                cursor,
                zIndex: 10,
                transform: `scale(${1 / zoom})`,
                transformOrigin: "center",
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onResizeStart?.(element, key, e);
              }}
              role="presentation"
            />
          ))}
      </div>
    );
  },
);

DraggableElement.displayName = "DraggableElement";
