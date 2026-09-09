import { describe, expect, it } from "vitest";
import {
  canAccessCertificates,
  canIssueCertificates,
  canManageCertificateTemplates,
  canRevokeCertificates,
} from "./certificate-permissions";

describe("certificate permissions", () => {
  it("uses effective permission codes", () => {
    const permissions = [
      "certificate.read",
      "certificate.issue",
      "certificate.template.manage",
      "certificate.revoke",
    ];
    expect(canAccessCertificates(permissions)).toBe(true);
    expect(canIssueCertificates(permissions)).toBe(true);
    expect(canManageCertificateTemplates(permissions)).toBe(true);
    expect(canRevokeCertificates(permissions)).toBe(true);
  });

  it("does not derive access from numeric roles", () => {
    expect(canAccessCertificates([])).toBe(false);
    expect(canManageCertificateTemplates([])).toBe(false);
  });
});
