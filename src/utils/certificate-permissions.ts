import { ADMIN_ROLE_ENUM } from "../types/constants/profile";

export type AdminRoleValue = string | number | null | undefined;

function normalizeRole(role: AdminRoleValue): number | null {
  if (typeof role === "number") return role;
  if (typeof role === "string" && role.trim() !== "") {
    const parsed = Number(role);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function canAccessCertificates(role: AdminRoleValue): boolean {
  const normalized = normalizeRole(role);
  return (
    normalized === ADMIN_ROLE_ENUM.SUPER_ADMIN ||
    normalized === ADMIN_ROLE_ENUM.ADMIN ||
    normalized === ADMIN_ROLE_ENUM.ASMEN ||
    normalized === ADMIN_ROLE_ENUM.KAPRO
  );
}

export function canManageCertificateTemplates(role: AdminRoleValue): boolean {
  const normalized = normalizeRole(role);
  return (
    normalized === ADMIN_ROLE_ENUM.SUPER_ADMIN ||
    normalized === ADMIN_ROLE_ENUM.ADMIN
  );
}

export function canIssueCertificates(role: AdminRoleValue): boolean {
  return canAccessCertificates(role);
}

export function canRevokeCertificates(role: AdminRoleValue): boolean {
  return canManageCertificateTemplates(role);
}
