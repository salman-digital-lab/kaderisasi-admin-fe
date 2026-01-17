import React from "react";
import { CertificateElement } from "../types";

interface DraggableElementProps {
  element: CertificateElement;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onContentChange?: (content: string) => void;
}

export const DraggableElement: React.FC<DraggableElementProps> = React.memo(
  ({ element, isSelected, onSelect, onDragStart, onContentChange }) => {
    const [isEditing, setIsEditing] = React.useState(false);

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
        if (!isEditing) {
          onDragStart(e);
        }
      },
      [isEditing, onDragStart],
    );

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

    const renderContent = () => {
      switch (element.type) {
        case "static-text":
          return (
            <div
              contentEditable={isEditing}
              suppressContentEditableWarning
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={textStyle}
            >
              {element.content}
            </div>
          );
        case "variable-text":
          return (
            <div
              style={{
                ...textStyle,
                backgroundColor: "rgba(24, 144, 255, 0.1)",
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              {element.variable}
            </div>
          );
        case "qr-code":
        case "signature":
          return element.imageUrl ? (
            <img
              src={element.imageUrl}
              alt={element.type}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
              draggable={false}
            />
          ) : (
            <div
              style={{
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
              }}
            >
              {element.type === "qr-code" ? "QR Code" : "Tanda Tangan"}
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div
        data-element-id={element.id}
        style={{
          position: "absolute",
          left: element.x,
          top: element.y,
          width: element.width,
          minHeight: element.height,
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
        {isSelected && (
          <>
            <div
              style={{
                position: "absolute",
                top: -4,
                left: -4,
                width: 8,
                height: 8,
                backgroundColor: "#1890ff",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 8,
                height: 8,
                backgroundColor: "#1890ff",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -4,
                left: -4,
                width: 8,
                height: 8,
                backgroundColor: "#1890ff",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                width: 8,
                height: 8,
                backgroundColor: "#1890ff",
                borderRadius: "50%",
              }}
            />
          </>
        )}
      </div>
    );
  },
);

DraggableElement.displayName = "DraggableElement";
