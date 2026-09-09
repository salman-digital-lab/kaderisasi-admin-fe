export function canAccessCertificates(permissions: readonly string[]): boolean {
  return permissions.includes("certificate.read");
}

export function canManageCertificateTemplates(
  permissions: readonly string[],
): boolean {
  return permissions.includes("certificate.template.manage");
}

export function canIssueCertificates(permissions: readonly string[]): boolean {
  return permissions.includes("certificate.issue");
}

export function canRevokeCertificates(permissions: readonly string[]): boolean {
  return permissions.includes("certificate.revoke");
}
