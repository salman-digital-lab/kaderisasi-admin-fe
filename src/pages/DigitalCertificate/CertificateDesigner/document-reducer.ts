import type {
  CertificateTemplateData,
  CertificateTemplateElement,
} from "../../../types/services/certificateTemplate";

export const HISTORY_LIMIT = 50;

interface HistoryEntry {
  template: CertificateTemplateData;
  revision: number;
  selectedElementId: string | null;
}

export interface DocumentHistoryState {
  template: CertificateTemplateData;
  past: HistoryEntry[];
  future: HistoryEntry[];
  selectedElementId: string | null;
  clipboardElement: CertificateTemplateElement | null;
  revision: number;
  sequence: number;
  activeHistoryGroup: string | null;
}

export type DocumentHistoryAction =
  | { type: "reset"; template: CertificateTemplateData }
  | {
      type: "apply";
      update: (template: CertificateTemplateData) => CertificateTemplateData;
      historyGroup?: string;
    }
  | { type: "finish-history-group"; historyGroup?: string }
  | { type: "select"; id: string | null }
  | { type: "clipboard"; element: CertificateTemplateElement | null }
  | { type: "undo" }
  | { type: "redo" };

export function cloneCertificateTemplate(
  template: CertificateTemplateData,
): CertificateTemplateData {
  return {
    ...template,
    elements: template.elements.map((element) => ({ ...element })),
  };
}

export function createDocumentHistoryState(
  template: CertificateTemplateData,
): DocumentHistoryState {
  return {
    template: cloneCertificateTemplate(template),
    past: [],
    future: [],
    selectedElementId: null,
    clipboardElement: null,
    revision: 0,
    sequence: 0,
    activeHistoryGroup: null,
  };
}

export function reorderElementById(
  template: CertificateTemplateData,
  activeId: string,
  overId: string,
): CertificateTemplateData {
  const activeIndex = template.elements.findIndex(
    (item) => item.id === activeId,
  );
  const overIndex = template.elements.findIndex((item) => item.id === overId);
  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex)
    return template;
  const elements = [...template.elements];
  const [active] = elements.splice(activeIndex, 1);
  elements.splice(overIndex, 0, active);
  return { ...template, elements };
}

function getRestoredSelection(
  template: CertificateTemplateData,
  preferred: string | null,
  fallback: string | null,
): string | null {
  if (
    preferred &&
    template.elements.some((element) => element.id === preferred)
  ) {
    return preferred;
  }
  if (
    fallback &&
    template.elements.some((element) => element.id === fallback)
  ) {
    return fallback;
  }
  return null;
}

export function documentHistoryReducer(
  state: DocumentHistoryState,
  action: DocumentHistoryAction,
): DocumentHistoryState {
  switch (action.type) {
    case "reset":
      return createDocumentHistoryState(action.template);
    case "apply": {
      const nextTemplate = action.update(state.template);
      const activeHistoryGroup = action.historyGroup || null;
      if (nextTemplate === state.template) {
        return activeHistoryGroup === state.activeHistoryGroup
          ? state
          : { ...state, activeHistoryGroup };
      }
      const sequence = state.sequence + 1;
      const shouldRecord =
        !action.historyGroup ||
        state.activeHistoryGroup !== action.historyGroup;
      const selectedElementId =
        state.selectedElementId &&
        !nextTemplate.elements.some(
          (element) => element.id === state.selectedElementId,
        )
          ? null
          : state.selectedElementId;
      return {
        ...state,
        template: nextTemplate,
        past: shouldRecord
          ? [
              ...state.past,
              {
                template: cloneCertificateTemplate(state.template),
                revision: state.revision,
                selectedElementId: state.selectedElementId,
              },
            ].slice(-HISTORY_LIMIT)
          : state.past,
        future: [],
        selectedElementId,
        revision: sequence,
        sequence,
        activeHistoryGroup,
      };
    }
    case "finish-history-group":
      return !action.historyGroup ||
        state.activeHistoryGroup === action.historyGroup
        ? { ...state, activeHistoryGroup: null }
        : state;
    case "select":
      return state.selectedElementId === action.id
        ? state
        : { ...state, selectedElementId: action.id };
    case "clipboard":
      return { ...state, clipboardElement: action.element };
    case "undo": {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        ...state,
        template: cloneCertificateTemplate(previous.template),
        past: state.past.slice(0, -1),
        future: [
          {
            template: cloneCertificateTemplate(state.template),
            revision: state.revision,
            selectedElementId: state.selectedElementId,
          },
          ...state.future,
        ].slice(0, HISTORY_LIMIT),
        selectedElementId: getRestoredSelection(
          previous.template,
          state.selectedElementId,
          previous.selectedElementId,
        ),
        revision: previous.revision,
        sequence: state.sequence + 1,
        activeHistoryGroup: null,
      };
    }
    case "redo": {
      const [next, ...future] = state.future;
      if (!next) return state;
      return {
        ...state,
        template: cloneCertificateTemplate(next.template),
        past: [
          ...state.past,
          {
            template: cloneCertificateTemplate(state.template),
            revision: state.revision,
            selectedElementId: state.selectedElementId,
          },
        ].slice(-HISTORY_LIMIT),
        future,
        selectedElementId: getRestoredSelection(
          next.template,
          state.selectedElementId,
          next.selectedElementId,
        ),
        revision: next.revision,
        sequence: state.sequence + 1,
        activeHistoryGroup: null,
      };
    }
  }
}
