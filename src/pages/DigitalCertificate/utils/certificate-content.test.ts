import { afterEach, describe, expect, it, vi } from "vitest";
import type { CertificateParticipant } from "../../../types/services/certificateTemplate";
import type { CertificateElement } from "../types";
import {
  getCertificateVerificationUrl,
  resolveCertificateText,
} from "./certificate-content";

const participant: CertificateParticipant = {
  registration_id: 99,
  user_id: 123,
  name: "Nama Akun",
  guest_name: "Nama Tamu",
  email: "private@example.test",
  university: "Universitas Contoh",
  gender: "Perempuan",
  activity_name: "Kegiatan Contoh",
  activity_date: "16 Juli 2026",
};

const variableElement = (variable: string): CertificateElement => ({
  id: variable,
  type: "variable-text",
  variable,
  content: "fallback",
  x: 0,
  y: 0,
  width: 100,
  height: 30,
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("certificate content resolver", () => {
  it("uses the guest name and public allowlisted fields", () => {
    expect(
      resolveCertificateText(variableElement("{{name}}"), participant),
    ).toBe("Nama Tamu");
    expect(
      resolveCertificateText(variableElement("{{gender}}"), participant),
    ).toBe("Perempuan");
  });

  it("maps certificate_id to the public certificate code", () => {
    expect(
      resolveCertificateText(
        variableElement("{{certificate_id}}"),
        participant,
        "CERT-001",
      ),
    ).toBe("CERT-001");
  });

  it("never resolves private email or internal identifiers", () => {
    expect(
      resolveCertificateText(variableElement("{{email}}"), participant),
    ).toBe("fallback");
    expect(
      resolveCertificateText(
        variableElement("{{registration_id}}"),
        participant,
      ),
    ).toBe("fallback");
    expect(
      resolveCertificateText(variableElement("{{user_id}}"), participant),
    ).toBe("fallback");
  });

  it("builds the dedicated verification route only with configured public URL", () => {
    vi.stubEnv("VITE_PUBLIC_WEB_URL", "https://kaderisasi.example.test/");
    expect(getCertificateVerificationUrl("CERT 001")).toBe(
      "https://kaderisasi.example.test/certificate/verify/CERT%20001",
    );

    vi.stubEnv("VITE_PUBLIC_WEB_URL", "");
    expect(getCertificateVerificationUrl("CERT-001")).toBeNull();
  });

  it("rejects malformed and non-local insecure public URLs", () => {
    vi.stubEnv("VITE_PUBLIC_WEB_URL", "not a URL");
    expect(getCertificateVerificationUrl("CERT-001")).toBeNull();

    vi.stubEnv("VITE_PUBLIC_WEB_URL", "http://kaderisasi.example.test");
    expect(getCertificateVerificationUrl("CERT-001")).toBeNull();

    vi.stubEnv("VITE_PUBLIC_WEB_URL", "http://localhost:3000/");
    expect(getCertificateVerificationUrl("CERT-001")).toBe(
      "http://localhost:3000/certificate/verify/CERT-001",
    );

    vi.stubEnv("VITE_PUBLIC_WEB_URL", "http://127.0.0.1:3000");
    expect(getCertificateVerificationUrl("CERT-001")).toBe(
      "http://127.0.0.1:3000/certificate/verify/CERT-001",
    );
  });
});
