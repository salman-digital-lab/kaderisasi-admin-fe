import React from "react";
import { CertificateElement } from "../types";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ResizeHandle = "nw" | "ne" | "sw" | "se";

interface DraggableElementProps {
  element: CertificateElement;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart?: (handle: ResizeHandle, e: React.MouseEvent) => void;
  onContentChange?: (content: string) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const HANDLE_SIZE = 8;

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
  objectFit: "contain",
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
}> = ({ imageUrl, alt, placeholderLabel }) =>
  imageUrl ? (
    <img
      src={imageUrl}
      alt={alt}
      style={fullSizeImageStyle}
      draggable={false}
    />
  ) : (
    <div style={placeholderStyle}>{placeholderLabel}</div>
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
  }) => {
    const [isEditing, setIsEditing] = React.useState(false);

    // ── Event handlers ──────────────────────────────────────────────────

    const handleDoubleClick = React.useCallback(() => {
      if (element.type === "static-text" && onContentChange) {
        setIsEditing(true);
      }
    }, [element.type, onContentChange]);

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLDivElement>) => {
        if (isEditing && onContentChange) {
          onContentChange(e.currentTarget.textContent || "");
          setIsEditing(false);
        }
      },
      [isEditing, onContentChange],
    );

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    }, []);

    const handleClick = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
      },
      [onSelect],
    );

    const handleMouseDown = React.useCallback(
      (e: React.MouseEvent) => {
        if (!isEditing) onDragStart(e);
      },
      [isEditing, onDragStart],
    );

    // ── Memoized styles ─────────────────────────────────────────────────

    const textStyle: React.CSSProperties = React.useMemo(
      () => ({
        fontSize: element.fontSize || 16,
        fontFamily: element.fontFamily || "sans-serif",
        color: element.color || "#000000",
        textAlign: element.textAlign || "center",
        margin: 0,
        outline: "none",
        wordBreak: "break-word",
      }),
      [element.fontSize, element.fontFamily, element.color, element.textAlign],
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
        case "image":
        case "qr-code":
        case "signature":
          return (
            <ImageContent
              imageUrl={element.imageUrl}
              alt={element.type}
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
        data-element-id={element.id}
        style={{
          position: "absolute",
          left: element.x,
          top: element.y,
          width: element.width,
          ...(isTextType
            ? { minHeight: element.height }
            : { height: element.height }),
          cursor: isEditing ? "text" : "move",
          border: isSelected ? "2px solid #1890ff" : "1px dashed transparent",
          borderRadius: 4,
          padding: 4,
          boxSizing: "border-box",
          userSelect: isEditing ? "text" : "none",
          willChange: "left, top",
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {renderContent()}

        {isSelected &&
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
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onResizeStart?.(key, e);
              }}
            />
          ))}
      </div>
    );
  },
);

DraggableElement.displayName = "DraggableElement";
