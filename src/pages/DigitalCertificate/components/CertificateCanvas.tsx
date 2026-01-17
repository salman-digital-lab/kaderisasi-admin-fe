import React, { useRef, useState, useCallback, useEffect } from "react";
import { CertificateElement, CertificateTemplate } from "../types";
import { DraggableElement } from "./DraggableElement";

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

export const CertificateCanvas: React.FC<CertificateCanvasProps> = React.memo(
  ({
    template,
    selectedElementId,
    onSelectElement,
    onMoveElement,
    onUpdateElement,
  }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<DragState | null>(null);
    const rafRef = useRef<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

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

    const updateElementPosition = useCallback(
      (id: string, x: number, y: number) => {
        // Update DOM directly for smooth dragging
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

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!dragRef.current) return;

        // Cancel any pending RAF
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        // Use RAF for smooth updates
        rafRef.current = requestAnimationFrame(() => {
          if (!dragRef.current) return;

          const deltaX = e.clientX - dragRef.current.startX;
          const deltaY = e.clientY - dragRef.current.startY;

          const newX = Math.max(0, dragRef.current.elementStartX + deltaX);
          const newY = Math.max(0, dragRef.current.elementStartY + deltaY);

          updateElementPosition(dragRef.current.elementId, newX, newY);
        });
      },
      [updateElementPosition],
    );

    const handleMouseUp = useCallback(() => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (dragRef.current) {
        // Commit final position to state
        const pos = elementPositionsRef.current.get(dragRef.current.elementId);
        if (pos) {
          onMoveElement(dragRef.current.elementId, pos.x, pos.y);
        }
        dragRef.current = null;
      }

      setIsDragging(false);

      // Remove global listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }, [handleMouseMove, onMoveElement]);

    const handleDragStart = useCallback(
      (element: CertificateElement, e: React.MouseEvent) => {
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

        // Add global listeners for smooth dragging even outside canvas
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      },
      [handleMouseMove, handleMouseUp],
    );

    const handleCanvasClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget || e.target === canvasRef.current) {
          onSelectElement(null);
        }
      },
      [onSelectElement],
    );

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [handleMouseMove, handleMouseUp]);

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: 24,
          backgroundColor: "#e8e8e8",
          overflow: "auto",
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
            cursor: isDragging ? "grabbing" : "default",
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
              onSelect={() => onSelectElement(element.id)}
              onDragStart={(e) => handleDragStart(element, e)}
              onContentChange={
                element.type === "static-text"
                  ? (content) => onUpdateElement(element.id, { content })
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    );
  },
);

CertificateCanvas.displayName = "CertificateCanvas";
