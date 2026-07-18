import { describe, expect, it } from "vitest";
import { getImageUploadError, IMAGE_UPLOAD_POLICIES } from "./image-upload";

describe("image upload validation", () => {
  it("accepts supported images within the selected policy limit", () => {
    expect(
      getImageUploadError(
        { name: "banner.webp", type: "image/webp", size: 1024 },
        IMAGE_UPLOAD_POLICIES.activity,
      ),
    ).toBeNull();
  });

  it("rejects unsupported content types", () => {
    expect(
      getImageUploadError(
        { name: "vector.svg", type: "image/svg+xml", size: 1024 },
        IMAGE_UPLOAD_POLICIES.clubLogo,
      ),
    ).toContain("JPG, PNG, atau WebP");
  });

  it("applies each upload policy size limit", () => {
    expect(
      getImageUploadError(
        {
          name: "large.jpg",
          type: "image/jpeg",
          size: 2 * 1024 * 1024,
        },
        IMAGE_UPLOAD_POLICIES.activity,
      ),
    ).toContain("maksimal 1 MB");
  });
});
