import { useCallback, useReducer } from "react";
import { CertificateElement, CertificateTemplate } from "../types";
import {
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_ELEMENT_STYLES,
} from "../constants";
import {
  cloneCertificateTemplate,
  createDocumentHistoryState,
  documentHistoryReducer,
  reorderElementById,
} from "../CertificateDesigner/document-reducer";

const generateId = () =>
  `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getElementName = (
  type: CertificateElement["type"],
  count: number,
): string => {
  switch (type) {
    case "static-text":
      return `Teks Statis ${count}`;
    case "variable-text":
      return `Teks Variabel ${count}`;
    case "image":
      return `Gambar ${count}`;
    case "qr-code":
      return `QR Code ${count}`;
    case "signature":
      return `Tanda Tangan ${count}`;
    default:
      return `Elemen ${count}`;
  }
};

type Alignment = "left" | "center" | "right" | "top" | "middle" | "bottom";

interface ElementUpdateOptions {
  historyGroup?: string;
}

export const useCertificateDesigner = () => {
  const [state, dispatch] = useReducer(
    documentHistoryReducer,
    {
      backgroundUrl: null,
      elements: [],
      canvasWidth: DEFAULT_CANVAS_WIDTH,
      canvasHeight: DEFAULT_CANVAS_HEIGHT,
    },
    createDocumentHistoryState,
  );
  const {
    template,
    selectedElementId,
    clipboardElement,
    revision,
    past,
    future,
  } = state;

  const selectedElement =
    template.elements.find((el) => el.id === selectedElementId) || null;

  const applyTemplateUpdate = useCallback(
    (
      updater: (current: CertificateTemplate) => CertificateTemplate,
      historyGroup?: string,
    ) => {
      dispatch({ type: "apply", update: updater, historyGroup });
    },
    [],
  );

  const setTemplate = useCallback((next: CertificateTemplate) => {
    dispatch({ type: "reset", template: next });
  }, []);

  const setBackgroundUrl = useCallback(
    (url: string | null) => {
      applyTemplateUpdate((prev) =>
        prev.backgroundUrl === url ? prev : { ...prev, backgroundUrl: url },
      );
    },
    [applyTemplateUpdate],
  );

  const setCanvasSize = useCallback(
    (width: number, height: number) => {
      applyTemplateUpdate((prev) =>
        prev.canvasWidth === width && prev.canvasHeight === height
          ? prev
          : {
              ...prev,
              canvasWidth: width,
              canvasHeight: height,
            },
      );
    },
    [applyTemplateUpdate],
  );

  const addElement = useCallback(
    (
      type: CertificateElement["type"],
      options?: Partial<CertificateElement>,
    ) => {
      const elementCount = template.elements.length + 1;
      const newElement: CertificateElement = {
        id: generateId(),
        type,
        name: getElementName(type, elementCount),
        x: 100,
        y: 100,
        width:
          type === "static-text" || type === "variable-text"
            ? 200
            : type === "image"
              ? 200
              : 100,
        height:
          type === "static-text" || type === "variable-text"
            ? 40
            : type === "image"
              ? 150
              : 100,
        content: type === "static-text" ? "Teks Statis" : undefined,
        variable: type === "variable-text" ? "{{name}}" : undefined,
        ...DEFAULT_ELEMENT_STYLES,
        verticalAlign: "middle",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        lineHeight: 1.2,
        letterSpacing: 0,
        opacity: 100,
        rotation: 0,
        borderRadius: 0,
        objectFit: "contain",
        visible: true,
        locked: false,
        ...options,
      };

      applyTemplateUpdate((prev) => ({
        ...prev,
        elements: [...prev.elements, newElement],
      }));

      dispatch({ type: "select", id: newElement.id });
      return newElement.id;
    },
    [applyTemplateUpdate, template.elements.length],
  );

  const updateElement = useCallback(
    (
      id: string,
      updates: Partial<CertificateElement>,
      options?: ElementUpdateOptions,
    ) => {
      applyTemplateUpdate((prev) => {
        const elementIndex = prev.elements.findIndex((el) => el.id === id);
        if (elementIndex < 0) return prev;

        const currentElement = prev.elements[elementIndex];
        const updateKeys = Object.keys(updates) as (keyof CertificateElement)[];
        const hasChanges = updateKeys.some(
          (key) => !Object.is(currentElement[key], updates[key]),
        );
        if (!hasChanges) return prev;

        const elements = [...prev.elements];
        elements[elementIndex] = { ...currentElement, ...updates };
        return { ...prev, elements };
      }, options?.historyGroup);
    },
    [applyTemplateUpdate],
  );

  const finishHistoryGroup = useCallback((historyGroup?: string) => {
    dispatch({ type: "finish-history-group", historyGroup });
  }, []);

  const deleteElement = useCallback(
    (id: string) => {
      applyTemplateUpdate((prev) => ({
        ...prev,
        elements: prev.elements.filter((el) => el.id !== id),
      }));
    },
    [applyTemplateUpdate],
  );

  const moveElement = useCallback(
    (id: string, x: number, y: number) => {
      updateElement(id, { x, y });
    },
    [updateElement],
  );

  const selectElement = useCallback((id: string | null) => {
    dispatch({ type: "select", id });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: "select", id: null });
  }, []);

  const moveElementBy = useCallback(
    (id: string, deltaX: number, deltaY: number) => {
      const element = template.elements.find((el) => el.id === id);
      if (!element || element.locked) return;
      updateElement(id, {
        x: Math.min(
          Math.max(0, template.canvasWidth - element.width),
          Math.max(0, element.x + deltaX),
        ),
        y: Math.min(
          Math.max(0, template.canvasHeight - element.height),
          Math.max(0, element.y + deltaY),
        ),
      });
    },
    [
      template.canvasHeight,
      template.canvasWidth,
      template.elements,
      updateElement,
    ],
  );

  const duplicateElement = useCallback(
    (id: string) => {
      const element = template.elements.find((el) => el.id === id);
      if (element) {
        const newElement: CertificateElement = {
          ...element,
          id: generateId(),
          name: `${element.name || getElementName(element.type, 1)} Salinan`,
          x: Math.min(
            Math.max(0, template.canvasWidth - element.width),
            element.x + 20,
          ),
          y: Math.min(
            Math.max(0, template.canvasHeight - element.height),
            element.y + 20,
          ),
        };
        applyTemplateUpdate((prev) => ({
          ...prev,
          elements: [...prev.elements, newElement],
        }));
        dispatch({ type: "select", id: newElement.id });
      }
    },
    [
      applyTemplateUpdate,
      template.canvasHeight,
      template.canvasWidth,
      template.elements,
    ],
  );

  const copyElement = useCallback(
    (id: string) => {
      const element = template.elements.find((el) => el.id === id);
      if (!element) return false;
      dispatch({
        type: "clipboard",
        element: cloneCertificateTemplate({
          backgroundUrl: null,
          elements: [element],
          canvasWidth: 0,
          canvasHeight: 0,
        }).elements[0],
      });
      return true;
    },
    [template.elements],
  );

  const pasteElement = useCallback(() => {
    if (!clipboardElement) return false;

    const newElement: CertificateElement = {
      ...clipboardElement,
      id: generateId(),
      name: `${clipboardElement.name || getElementName(clipboardElement.type, 1)} Salinan`,
      x: Math.min(
        Math.max(0, template.canvasWidth - clipboardElement.width),
        clipboardElement.x + 24,
      ),
      y: Math.min(
        Math.max(0, template.canvasHeight - clipboardElement.height),
        clipboardElement.y + 24,
      ),
    };

    applyTemplateUpdate((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    dispatch({ type: "select", id: newElement.id });
    dispatch({ type: "clipboard", element: newElement });
    return true;
  }, [
    applyTemplateUpdate,
    clipboardElement,
    template.canvasHeight,
    template.canvasWidth,
  ]);

  const reorderElement = useCallback(
    (activeId: string, overId: string) => {
      applyTemplateUpdate((prev) => reorderElementById(prev, activeId, overId));
    },
    [applyTemplateUpdate],
  );

  const updateElementOrder = useCallback(
    (id: string, direction: "front" | "back" | "forward" | "backward") => {
      applyTemplateUpdate((prev) => {
        const currentIndex = prev.elements.findIndex((el) => el.id === id);
        if (currentIndex < 0) return prev;

        const nextElements = [...prev.elements];
        const [element] = nextElements.splice(currentIndex, 1);
        let nextIndex = currentIndex;

        if (direction === "front") {
          nextIndex = nextElements.length;
        } else if (direction === "back") {
          nextIndex = 0;
        } else if (direction === "forward") {
          nextIndex = Math.min(currentIndex + 1, nextElements.length);
        } else {
          nextIndex = Math.max(currentIndex - 1, 0);
        }

        if (nextIndex === currentIndex) return prev;
        nextElements.splice(nextIndex, 0, element);

        return { ...prev, elements: nextElements };
      });
    },
    [applyTemplateUpdate],
  );

  const alignElement = useCallback(
    (id: string, alignment: Alignment) => {
      const element = template.elements.find((el) => el.id === id);
      if (!element || element.locked) return;

      const updates: Partial<CertificateElement> = {};
      if (alignment === "left") updates.x = 0;
      if (alignment === "center") {
        updates.x = Math.round((template.canvasWidth - element.width) / 2);
      }
      if (alignment === "right") {
        updates.x = Math.max(0, template.canvasWidth - element.width);
      }
      if (alignment === "top") updates.y = 0;
      if (alignment === "middle") {
        updates.y = Math.round((template.canvasHeight - element.height) / 2);
      }
      if (alignment === "bottom") {
        updates.y = Math.max(0, template.canvasHeight - element.height);
      }

      updateElement(id, updates);
    },
    [
      template.canvasHeight,
      template.canvasWidth,
      template.elements,
      updateElement,
    ],
  );

  const undo = useCallback(() => {
    dispatch({ type: "undo" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "redo" });
  }, []);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const renameElement = useCallback(
    (id: string, name: string) => {
      updateElement(id, { name: name.trim() || undefined });
    },
    [updateElement],
  );

  const toggleElementVisibility = useCallback(
    (id: string) => {
      const element = template.elements.find((el) => el.id === id);
      if (!element) return;
      updateElement(id, { visible: element.visible === false });
    },
    [template.elements, updateElement],
  );

  const toggleElementLock = useCallback(
    (id: string) => {
      const element = template.elements.find((el) => el.id === id);
      if (!element) return;
      updateElement(id, { locked: !element.locked });
    },
    [template.elements, updateElement],
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
    finishHistoryGroup,
    deleteElement,
    moveElement,
    moveElementBy,
    selectElement,
    clearSelection,
    duplicateElement,
    copyElement,
    pasteElement,
    updateElementOrder,
    reorderElement,
    alignElement,
    renameElement,
    toggleElementVisibility,
    toggleElementLock,
    undo,
    redo,
    canUndo,
    canRedo,
    hasClipboard: !!clipboardElement,
    revision,
  };
};
