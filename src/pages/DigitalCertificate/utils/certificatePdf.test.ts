import { describe, expect, it } from "vitest";
import { getPdfPageSize, getRasterScale } from "./certificatePdf";

describe("certificate raster export dimensions", () => {
  it.each([
    [800, 566],
    [566, 800],
    [5000, 5000],
    [5000, 100],
  ])("caps %i × %i at 2× and eight megapixels", (width, height) => {
    const scale = getRasterScale(width, height);
    expect(scale).toBeLessThanOrEqual(2);
    expect(width * height * scale * scale).toBeLessThanOrEqual(8_000_001);
  });
  it("uses A4 landscape and portrait", () => {
    expect(getPdfPageSize(800, 566)).toEqual({ width: 841.89, height: 595.28 });
    expect(getPdfPageSize(566, 800)).toEqual({ width: 595.28, height: 841.89 });
  });
  it("uses Letter and preserves custom page proportions", () => {
    expect(getPdfPageSize(816, 1056)).toEqual({ width: 612, height: 792 });
    expect(getPdfPageSize(1200, 400)).toEqual({ width: 900, height: 300 });
  });
});
