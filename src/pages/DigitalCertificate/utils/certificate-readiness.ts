import type {
  CertificateTemplate,
  CertificateTemplateData,
  CertificateTemplateStatus,
} from "../../../types/services/certificateTemplate";
import { DEPRECATED_PRIVATE_VARIABLES, VARIABLE_OPTIONS } from "../constants";
import { getCertificatePublicBaseUrl } from "./certificate-content";

export type CertificateReadinessSeverity = "error" | "warning";

export interface CertificateReadinessIssue {
  code: string;
  message: string;
  severity: CertificateReadinessSeverity;
}

export type CertificateReadinessAction =
  | "open-variable-chooser"
  | "open-canvas-settings"
  | "open-canvas-inspector"
  | "select-layer"
  | "explain";

export function getCertificateReadinessAction(
  code: string,
): CertificateReadinessAction {
  if (code === "MISSING_PARTICIPANT_NAME" || code === "EMPTY_TEMPLATE") {
    return "open-variable-chooser";
  }
  if (code === "INVALID_CANVAS") return "open-canvas-settings";
  if (code === "MISSING_BACKGROUND") return "open-canvas-inspector";
  if (
    code === "MISSING_ASSET" ||
    code === "ELEMENT_OUT_OF_BOUNDS" ||
    code === "PRIVATE_VARIABLE" ||
    code === "UNSUPPORTED_VARIABLE"
  ) {
    return "select-layer";
  }
  return "explain";
}

const ALLOWED_VARIABLES = new Set<string>(
  VARIABLE_OPTIONS.map((option) => option.value),
);
const PRIVATE_VARIABLES = new Set<string>(DEPRECATED_PRIVATE_VARIABLES);

export function isPersistableAssetUrl(value?: string | null): boolean {
  if (!value) return false;
  return !value.startsWith("data:") && !value.startsWith("blob:");
}

export function getCertificateTemplateStatus(
  template: Pick<
    CertificateTemplate,
    "is_active" | "status" | "lifecycle_status"
  >,
): CertificateTemplateStatus {
  return (
    template.status ||
    template.lifecycle_status ||
    (template.is_active ? "published" : "draft")
  );
}

export function getCertificateReadiness(
  template: CertificateTemplateData,
  backgroundImage?: string | null,
): CertificateReadinessIssue[] {
  const issues: CertificateReadinessIssue[] = [];

  if (
    !Number.isFinite(template.canvasWidth) ||
    !Number.isFinite(template.canvasHeight) ||
    template.canvasWidth < 200 ||
    template.canvasHeight < 200
  ) {
    issues.push({
      code: "INVALID_CANVAS",
      message: "Ukuran kanvas tidak valid.",
      severity: "error",
    });
  }

  if (template.elements.length === 0) {
    issues.push({
      code: "EMPTY_TEMPLATE",
      message: "Template belum memiliki elemen.",
      severity: "error",
    });
  }

  if (
    !template.elements.some(
      (element) =>
        element.visible !== false &&
        element.type === "variable-text" &&
        element.variable === "{{name}}",
    )
  ) {
    issues.push({
      code: "MISSING_PARTICIPANT_NAME",
      message: "Tambahkan variabel nama peserta / tamu.",
      severity: "error",
    });
  }

  const variables = template.elements
    .filter((element) => element.type === "variable-text")
    .map((element) => element.variable)
    .filter((variable): variable is string => Boolean(variable));

  if (variables.some((variable) => PRIVATE_VARIABLES.has(variable))) {
    issues.push({
      code: "PRIVATE_VARIABLE",
      message: "Variabel email bersifat privat dan tidak boleh diterbitkan.",
      severity: "error",
    });
  }

  const unsupportedVariables = variables.filter(
    (variable) =>
      !ALLOWED_VARIABLES.has(variable) && !PRIVATE_VARIABLES.has(variable),
  );
  if (unsupportedVariables.length > 0) {
    issues.push({
      code: "UNSUPPORTED_VARIABLE",
      message: `Variabel tidak didukung: ${unsupportedVariables.join(", ")}.`,
      severity: "error",
    });
  }

  if (
    template.elements.some(
      (element) =>
        !Number.isFinite(element.x) ||
        !Number.isFinite(element.y) ||
        !Number.isFinite(element.width) ||
        !Number.isFinite(element.height) ||
        element.width <= 0 ||
        element.height <= 0 ||
        element.x < 0 ||
        element.y < 0 ||
        element.x + element.width > template.canvasWidth ||
        element.y + element.height > template.canvasHeight,
    )
  ) {
    issues.push({
      code: "ELEMENT_OUT_OF_BOUNDS",
      message: "Ada elemen dengan ukuran atau posisi di luar kanvas.",
      severity: "error",
    });
  }

  const missingAssets = template.elements.filter(
    (element) =>
      element.visible !== false &&
      (element.type === "image" || element.type === "signature") &&
      !isPersistableAssetUrl(element.imageUrl),
  );
  if (missingAssets.length > 0) {
    issues.push({
      code: "MISSING_ASSET",
      message: "Ada gambar atau tanda tangan tanpa aset tersimpan.",
      severity: "error",
    });
  }

  if (
    template.elements.some(
      (element) => element.visible !== false && element.type === "qr-code",
    ) &&
    !getCertificatePublicBaseUrl()
  ) {
    issues.push({
      code: "MISSING_PUBLIC_CERTIFICATE_URL",
      message:
        "VITE_PUBLIC_WEB_URL belum dikonfigurasi. QR verifikasi dan publikasi tidak dapat dibuat.",
      severity: "error",
    });
  }

  if (
    !isPersistableAssetUrl(backgroundImage) &&
    !isPersistableAssetUrl(template.backgroundUrl)
  ) {
    issues.push({
      code: "MISSING_BACKGROUND",
      message:
        "Background belum diatur. Template tetap dapat disimpan sebagai draf.",
      severity: "warning",
    });
  }

  return issues;
}

export function isCertificateTemplateReady(
  issues: CertificateReadinessIssue[],
): boolean {
  return !issues.some((issue) => issue.severity === "error");
}

export function mapBackendReadinessErrors(
  payload: unknown,
): CertificateReadinessIssue[] {
  const data = payload as {
    errors?: unknown;
    error?: unknown;
    message?: unknown;
  } | null;
  const source = Array.isArray(data?.errors)
    ? data.errors
    : Array.isArray(data?.error)
      ? data.error
      : data?.message
        ? [data.message]
        : [];

  return source.map((item, index) => {
    if (typeof item === "string") {
      return {
        code: `SERVER_${index}`,
        message: item,
        severity: "error" as const,
      };
    }
    const value = item as { code?: unknown; message?: unknown };
    return {
      code: typeof value?.code === "string" ? value.code : `SERVER_${index}`,
      message:
        typeof value?.message === "string"
          ? value.message
          : "Template ditolak oleh server.",
      severity: "error" as const,
    };
  });
}
