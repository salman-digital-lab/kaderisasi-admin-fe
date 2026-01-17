import { useState, useCallback } from "react";
import { CertificateElement, CertificateTemplate } from "../types";
import {
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_ELEMENT_STYLES,
} from "../constants";

const generateId = () =>
  `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useCertificateDesigner = () => {
  const [template, setTemplate] = useState<CertificateTemplate>({
    backgroundUrl: null,
    elements: [],
    canvasWidth: DEFAULT_CANVAS_WIDTH,
    canvasHeight: DEFAULT_CANVAS_HEIGHT,
  });

  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );

  const selectedElement =
    template.elements.find((el) => el.id === selectedElementId) || null;

  const setBackgroundUrl = useCallback((url: string | null) => {
    setTemplate((prev) => ({ ...prev, backgroundUrl: url }));
  }, []);

  const setCanvasSize = useCallback((width: number, height: number) => {
    setTemplate((prev) => ({
      ...prev,
      canvasWidth: width,
      canvasHeight: height,
    }));
  }, []);

  const addElement = useCallback(
    (
      type: CertificateElement["type"],
      options?: Partial<CertificateElement>,
    ) => {
      const newElement: CertificateElement = {
        id: generateId(),
        type,
        x: 100,
        y: 100,
        width: type === "static-text" || type === "variable-text" ? 200 : 100,
        height: type === "static-text" || type === "variable-text" ? 40 : 100,
        content: type === "static-text" ? "Teks Statis" : undefined,
        variable: type === "variable-text" ? "{{name}}" : undefined,
        ...DEFAULT_ELEMENT_STYLES,
        ...options,
      };

      setTemplate((prev) => ({
        ...prev,
        elements: [...prev.elements, newElement],
      }));

      setSelectedElementId(newElement.id);
      return newElement.id;
    },
    [],
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<CertificateElement>) => {
      setTemplate((prev) => ({
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el,
        ),
      }));
    },
    [],
  );

  const deleteElement = useCallback((id: string) => {
    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
    setSelectedElementId((prev) => (prev === id ? null : prev));
  }, []);

  const moveElement = useCallback(
    (id: string, x: number, y: number) => {
      updateElement(id, { x, y });
    },
    [updateElement],
  );

  const selectElement = useCallback((id: string | null) => {
    setSelectedElementId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElementId(null);
  }, []);

  const duplicateElement = useCallback(
    (id: string) => {
      const element = template.elements.find((el) => el.id === id);
      if (element) {
        const newElement: CertificateElement = {
          ...element,
          id: generateId(),
          x: element.x + 20,
          y: element.y + 20,
        };
        setTemplate((prev) => ({
          ...prev,
          elements: [...prev.elements, newElement],
        }));
        setSelectedElementId(newElement.id);
      }
    },
    [template.elements],
  );

  return {
    template,
    setTemplate,
    selectedElement,
    selectedElementId,
    setBackgroundUrl,
    setCanvasSize,
    addElement,
    updateElement,
    deleteElement,
    moveElement,
    selectElement,
    clearSelection,
    duplicateElement,
  };
};
