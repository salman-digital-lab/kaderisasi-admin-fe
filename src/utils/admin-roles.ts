import type { AssignedRole } from "../types/services/auth";
import type { RbacRole } from "../types/model/access";

export function assignedRoles(value: {
  roles?: AssignedRole[];
  role?: AssignedRole | null;
}): AssignedRole[] {
  return value.roles ?? (value.role ? [value.role] : []);
}

export function mergedPermissions(
  codes: string[],
  catalog: RbacRole[],
): string[] {
  return [
    ...new Set(
      catalog
        .filter((role) => codes.includes(role.code))
        .flatMap((role) => role.permissions),
    ),
  ];
}

export function canDeleteFeatures(roles: AssignedRole[]): boolean {
  return roles.some(
    (role) => role.code === "super_admin" || role.code === "admin",
  );
}
