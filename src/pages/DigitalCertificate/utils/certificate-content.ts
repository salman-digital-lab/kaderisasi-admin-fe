import type { CertificateParticipant } from "../../../types/services/certificateTemplate";
import type { CertificateElement } from "../types";

export const CERTIFICATE_SAMPLE_PARTICIPANT: CertificateParticipant = {
  registration_id: 1,
  user_id: 1,
  name: "Ahmad Fauzan",
  email: "",
  university: "Institut Teknologi Bandung",
  gender: "Laki-laki",
  activity_name: "Pelatihan Dasar Kaderisasi",
  activity_date: "13 Februari 2026",
};

export const CERTIFICATE_SAMPLE_CODE = "CERT-2026-001";

export function getCertificateAssetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (
    path.startsWith("data:") ||
    path.startsWith("blob:") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  const imageBaseUrl = import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL || "";
  return `${imageBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function getCertificatePublicBaseUrl(): string | null {
  const configuredUrl = import.meta.env.VITE_PUBLIC_WEB_URL?.trim();
  if (!configuredUrl) return null;

  try {
    const parsedUrl = new URL(configuredUrl);
    const isSecure = parsedUrl.protocol === "https:";
    const isLocalHttp =
      parsedUrl.protocol === "http:" &&
      (parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1");
    if (!isSecure && !isLocalHttp) return null;

    parsedUrl.search = "";
    parsedUrl.hash = "";
    return parsedUrl.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getCertificateVerificationUrl(
  certificateCode?: string | null,
): string | null {
  if (!certificateCode) return null;
  const baseUrl = getCertificatePublicBaseUrl();
  return baseUrl
    ? `${baseUrl}/certificate/verify/${encodeURIComponent(certificateCode)}`
    : null;
}

export function resolveCertificateText(
  element: CertificateElement,
  participant: CertificateParticipant,
  certificateCode?: string | null,
): string {
  if (element.type === "static-text") return element.content || "";

  switch (element.variable) {
    case "{{name}}":
      return participant.guest_name || participant.name;
    case "{{activity_name}}":
      return participant.activity_name;
    case "{{activity_date}}":
    case "{{date}}":
      return participant.activity_date;
    case "{{certificate_id}}":
    case "{{certificate_code}}":
      return certificateCode || "";
    case "{{university}}":
      return participant.university || "-";
    case "{{gender}}":
      return participant.gender || "-";
    default:
      return element.content || "";
  }
}

export function resolveCertificateSampleText(
  element: CertificateElement,
): string {
  return resolveCertificateText(
    element,
    CERTIFICATE_SAMPLE_PARTICIPANT,
    CERTIFICATE_SAMPLE_CODE,
  );
}
