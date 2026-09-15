import { describe, expect, it } from "vitest";
import {
  assignedRoles,
  canDeleteFeatures,
  mergedPermissions,
} from "./admin-roles";
import type { RbacRole } from "../types/model/access";

const catalog: RbacRole[] = [
  {
    code: "a",
    name: "A",
    description: "",
    capabilities: [],
    limitation: "",
    is_requestable: true,
    permissions: ["activities.read", "activities.manage"],
  },
  {
    code: "b",
    name: "B",
    description: "",
    capabilities: [],
    limitation: "",
    is_requestable: true,
    permissions: ["activities.read", "counseling.read"],
  },
];

describe("multiple admin roles", () => {
  it("previews a union and preserves shared access after removing a role", () => {
    expect(mergedPermissions(["a", "b", "a"], catalog)).toEqual([
      "activities.read",
      "activities.manage",
      "counseling.read",
    ]);
    expect(mergedPermissions(["b"], catalog)).toEqual([
      "activities.read",
      "counseling.read",
    ]);
    expect(mergedPermissions([], catalog)).toEqual([]);
  });
  it("honors an explicitly empty assignment over a legacy role", () => {
    expect(
      assignedRoles({ roles: [], role: { code: "admin", name: "Admin" } }),
    ).toEqual([]);
  });
  it("recognizes a privileged secondary role for feature deletion", () => {
    expect(
      canDeleteFeatures([
        { code: "konselor", name: "Konselor" },
        { code: "admin", name: "Admin" },
      ]),
    ).toBe(true);
    expect(
      canDeleteFeatures([{ code: "activity_manager", name: "Panitia" }]),
    ).toBe(false);
  });
});
