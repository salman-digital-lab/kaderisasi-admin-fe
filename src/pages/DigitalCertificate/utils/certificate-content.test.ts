import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CertificateParticipant,
  CertificateSettings,
} from "../../../types/services/certificateTemplate";
import type { CertificateElement } from "../types";
import {
  formatCertificateActivityNumber,
  getCertificateVerificationUrl,
  getHijriMonthYear,
  parseCertificateActivityNumber,
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
  it("renders approval evidence in Jakarta time without inventing a signature", () => {
    const element = variableElement("{{approval}}");
    expect(resolveCertificateText(element, participant)).toContain(
      "Menunggu persetujuan",
    );
    expect(
      resolveCertificateText(element, participant, "CERT-001", {
        signer_name: "Penandatangan Uji",
        signer_title: "Ketua kegiatan",
        approved_at: "2026-09-09T18:00:00.000Z",
      }),
    ).toBe(
      "Disetujui secara elektronik oleh\nPenandatangan Uji\nKetua kegiatan\n10 September 2026",
    );
  });

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

  it("shows the activity number under the logo and the unique code under the QR", () => {
    const code = "CERT-2026-34-1F2599AF80B0954C0442515A09F92324";
    const top = {
      ...variableElement("{{certificate_code}}"),
      id: "salman-code",
    };
    const qr: CertificateElement = {
      id: "salman-verification",
      type: "qr-code",
      x: 0,
      y: 0,
      width: 90,
      height: 90,
    };
    const settings = {
      certificate_activity_number: "1719/S.4/YPM-5000/IV-1448",
    } as CertificateSettings;

    expect(
      resolveCertificateText(top, participant, code, undefined, settings),
    ).toBe("Nomor: 1719/S.4/YPM-5000/IV-1448");
    expect(
      resolveCertificateText(qr, participant, code, undefined, settings),
    ).toBe(code);
    expect(
      resolveCertificateText(
        variableElement("{{certificate_activity_number}}"),
        participant,
        code,
        undefined,
        settings,
      ),
    ).toBe("1719/S.4/YPM-5000/IV-1448");

    // Certificates issued before the activity number existed keep their layout.
    expect(resolveCertificateText(top, participant, code)).toBe(
      `Nomor: ${code}`,
    );
    expect(resolveCertificateText(qr, participant, code)).toBe("");
  });

  it("formats and parses the activity number with Hijri month numerals", () => {
    const parts = { sequence: "1719", hijriMonth: 4, hijriYear: 1448 };
    expect(formatCertificateActivityNumber(parts)).toBe(
      "1719/S.4/YPM-5000/IV-1448",
    );
    expect(parseCertificateActivityNumber("1719/S.4/YPM-5000/IV-1448")).toEqual(
      parts,
    );
    expect(
      parseCertificateActivityNumber("1719/S.4/YP-5000/IV-1448"),
    ).toBeNull();
    // 1 Muharram 1448 AH (Umm al-Qura) is 16 June 2026.
    expect(getHijriMonthYear(new Date("2026-06-16T12:00:00+07:00"))).toEqual({
      hijriMonth: 1,
      hijriYear: 1448,
    });
  });
});
