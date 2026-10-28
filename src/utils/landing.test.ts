import { describe, expect, it } from "vitest";
import { landingPath } from "./landing";

describe("landingPath", () => {
  it("prefers the dashboard, then P3RI, then access requests", () => {
    expect(landingPath(["dashboard.read", "p3ri.registrations.read"])).toBe(
      "/dashboard",
    );
    expect(landingPath(["p3ri.registrations.read"])).toBe("/p3ri");
    expect(landingPath([])).toBe("/my-requests");
  });
});
