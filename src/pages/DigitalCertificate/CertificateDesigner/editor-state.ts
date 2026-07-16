import type { CertificateTemplateData } from "../../../types/services/certificateTemplate";

export type EditorTool =
  | "select"
  | "hand"
  | "static-text"
  | "variable-text"
  | "qr-code"
  | "image"
  | "signature";

export interface ViewportPoint {
  x: number;
  y: number;
}

export interface ViewportState {
  zoom: number;
  offset: ViewportPoint;
  mode: "fit" | "custom";
}

export interface CanvasPreferences {
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  showGuides: boolean;
  snapToGuides: boolean;
}

export interface EditorPreferences {
  version: 1;
  layersWidth: number;
  inspectorWidth: number;
  layersCollapsed: boolean;
  inspectorCollapsed: boolean;
  canvas: CanvasPreferences;
}

export interface RecoverySnapshot {
  version: 1;
  templateId: number;
  serverVersion: string;
  timestamp: number;
  name: string;
  description: string;
  backgroundImage: string | null;
  template: CertificateTemplateData;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  version: 1,
  layersWidth: 240,
  inspectorWidth: 320,
  layersCollapsed: false,
  inspectorCollapsed: false,
  canvas: {
    gridSize: 10,
    showGrid: true,
    snapToGrid: true,
    showGuides: true,
    snapToGuides: true,
  },
};

const PREFERENCES_KEY = "certificate-editor:preferences:v1";
const RECOVERY_PREFIX = "certificate-editor:recovery:v1:";
export const RECOVERY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function readEditorPreferences(): EditorPreferences {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(PREFERENCES_KEY) || "null",
    ) as Partial<EditorPreferences> | null;
    if (!parsed || parsed.version !== 1) return DEFAULT_EDITOR_PREFERENCES;
    return {
      ...DEFAULT_EDITOR_PREFERENCES,
      ...parsed,
      layersWidth: clamp(parsed.layersWidth || 240, 200, 360),
      inspectorWidth: clamp(parsed.inspectorWidth || 320, 280, 420),
      canvas: { ...DEFAULT_EDITOR_PREFERENCES.canvas, ...parsed.canvas },
    };
  } catch {
    return DEFAULT_EDITOR_PREFERENCES;
  }
}

export function writeEditorPreferences(value: EditorPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(value));
  } catch {
    // Preferences are best-effort and must never block the editor.
  }
}

export function getRecoveryKey(templateId: number): string {
  return `${RECOVERY_PREFIX}${templateId}`;
}

export function writeRecoverySnapshot(snapshot: RecoverySnapshot): void {
  try {
    localStorage.setItem(
      getRecoveryKey(snapshot.templateId),
      JSON.stringify(snapshot),
    );
  } catch {
    // Recovery is best-effort when storage is unavailable or full.
  }
}

export function clearRecoverySnapshot(templateId: number): void {
  try {
    localStorage.removeItem(getRecoveryKey(templateId));
  } catch {
    // Storage can be disabled by browser privacy settings.
  }
}

export function readRecoverySnapshot(
  templateId: number,
  now = Date.now(),
): RecoverySnapshot | null {
  const key = getRecoveryKey(templateId);
  try {
    const parsed = JSON.parse(
      localStorage.getItem(key) || "null",
    ) as RecoverySnapshot | null;
    if (
      !parsed ||
      parsed.version !== 1 ||
      parsed.templateId !== templateId ||
      now - parsed.timestamp > RECOVERY_MAX_AGE_MS
    ) {
      clearRecoverySnapshot(templateId);
      return null;
    }
    return parsed;
  } catch {
    clearRecoverySnapshot(templateId);
    return null;
  }
}

export function hasRecoveryConflict(
  snapshot: RecoverySnapshot,
  serverVersion: string,
): boolean {
  return snapshot.serverVersion !== serverVersion;
}

export function getServerVersion(template: {
  version?: string | number;
  updated_at: string;
}): string {
  return String(template.version ?? template.updated_at);
}

export function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        "input, textarea, select, button, a, [contenteditable='true'], [role='dialog'], [role='menuitem'], [role='slider']",
      ),
    )
  );
}

export function getToolForKey(
  key: string,
  modified: boolean,
): "select" | "hand" | null {
  if (modified) return null;
  if (key.toLowerCase() === "v") return "select";
  if (key.toLowerCase() === "h") return "hand";
  return null;
}
