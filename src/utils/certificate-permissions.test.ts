import { describe, expect, it } from "vitest";
import {
  canAccessCertificates,
  canIssueCertificates,
  canManageCertificateTemplates,
  canRevokeCertificates,
} from "./certificate-permissions";

describe("certificate permissions", () => {
  it.each([0, 1, 2, 3, "0", "3"])(
    "allows certificate access and issuance for role %s",
    (role) => {
      expect(canAccessCertificates(role)).toBe(true);
      expect(canIssueCertificates(role)).toBe(true);
    },
  );

  it.each([0, 1, "0", "1"])(
    "limits template management and revocation to role %s",
    (role) => {
      expect(canManageCertificateTemplates(role)).toBe(true);
      expect(canRevokeCertificates(role)).toBe(true);
    },
  );

  it.each([2, 3, 4, "unknown", null, undefined])(
    "denies management and revocation for role %s",
    (role) => {
      expect(canManageCertificateTemplates(role)).toBe(false);
      expect(canRevokeCertificates(role)).toBe(false);
    },
  );

  it.each([4, "4", "unknown", null, undefined])(
    "denies certificate access for role %s",
    (role) => {
      expect(canAccessCertificates(role)).toBe(false);
      expect(canIssueCertificates(role)).toBe(false);
    },
  );
});
