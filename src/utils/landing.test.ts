import { describe, expect, it } from "vitest";
import { landingPath } from "./landing";

describe("landingPath", () => {
  it("prefers the dashboard, then members, then access requests", () => {
    expect(landingPath(["dashboard.read", "members.read"])).toBe("/dashboard");
    expect(landingPath(["members.read", "members.manage"])).toBe("/member");
    expect(landingPath([])).toBe("/my-requests");
  });
});
