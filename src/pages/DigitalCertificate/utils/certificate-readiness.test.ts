import { afterEach, describe, expect, it, vi } from "vitest";
import type { CertificateTemplateData } from "../../../types/services/certificateTemplate";
import {
  getCertificateReadiness,
  getCertificateTemplateStatus,
  isCertificateTemplateReady,
  mapBackendReadinessErrors,
} from "./certificate-readiness";

const buildReadyTemplate = (): CertificateTemplateData => ({
  backgroundUrl: "https://assets.example.test/background.webp",
  canvasWidth: 800,
  canvasHeight: 566,
  elements: [
    {
      id: "name",
      type: "variable-text",
      variable: "{{name}}",
      x: 100,
      y: 100,
      width: 600,
      height: 60,
      visible: true,
    },
  ],
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("certificate template readiness", () => {
  it("accepts a template with a visible participant name", () => {
    const issues = getCertificateReadiness(buildReadyTemplate(), null);
    expect(issues).toEqual([]);
    expect(isCertificateTemplateReady(issues)).toBe(true);
  });

  it("blocks private email variables", () => {
    const template = buildReadyTemplate();
    template.elements.push({
      id: "email",
      type: "variable-text",
      variable: "{{email}}",
      x: 100,
      y: 180,
      width: 600,
      height: 40,
    });

    expect(getCertificateReadiness(template, null)).toContainEqual(
      expect.objectContaining({ code: "PRIVATE_VARIABLE", severity: "error" }),
    );
  });

  it("blocks temporary image URLs but does not require an uploaded QR image", () => {
    vi.stubEnv("VITE_PUBLIC_WEB_URL", "https://kaderisasi.example.test");
    const template = buildReadyTemplate();
    template.elements.push(
      {
        id: "logo",
        type: "image",
        imageUrl: "data:image/png;base64,temporary",
        x: 20,
        y: 20,
        width: 80,
        height: 80,
      },
      {
        id: "qr",
        type: "qr-code",
        x: 680,
        y: 430,
        width: 100,
        height: 100,
      },
    );

    const issues = getCertificateReadiness(template, null);
    expect(issues).toContainEqual(
      expect.objectContaining({ code: "MISSING_ASSET" }),
    );
    expect(
      issues.filter((issue) => issue.code === "MISSING_ASSET"),
    ).toHaveLength(1);
  });

  it("blocks a verification QR when the public web URL is missing", () => {
    vi.stubEnv("VITE_PUBLIC_WEB_URL", "");
    const template = buildReadyTemplate();
    template.elements.push({
      id: "qr",
      type: "qr-code",
      x: 680,
      y: 430,
      width: 100,
      height: 100,
    });

    expect(getCertificateReadiness(template, null)).toContainEqual(
      expect.objectContaining({
        code: "MISSING_PUBLIC_CERTIFICATE_URL",
        severity: "error",
      }),
    );
  });

  it("normalizes lifecycle status during the API rollout", () => {
    expect(
      getCertificateTemplateStatus({
        is_active: false,
        status: "published",
        lifecycle_status: "archived",
      }),
    ).toBe("published");
    expect(
      getCertificateTemplateStatus({
        is_active: false,
        lifecycle_status: "archived",
      }),
    ).toBe("archived");
    expect(getCertificateTemplateStatus({ is_active: true })).toBe("published");
  });

  it("maps authoritative backend validation errors into checklist issues", () => {
    expect(
      mapBackendReadinessErrors({
        errors: [
          { code: "MISSING_PARTICIPANT_NAME", message: "Nama wajib ada." },
          "Ukuran tidak valid.",
        ],
      }),
    ).toEqual([
      {
        code: "MISSING_PARTICIPANT_NAME",
        message: "Nama wajib ada.",
        severity: "error",
      },
      {
        code: "SERVER_1",
        message: "Ukuran tidak valid.",
        severity: "error",
      },
    ]);
  });
});
