import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "../axios";
import { getCertificateApproval } from "./certificateApproval";

vi.mock("../axios", () => ({ default: { get: vi.fn() } }));

describe("certificate approval detail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserves a renderable snapshot", async () => {
    const detail = {
      id: 1,
      content_hash: "unchanged",
      snapshot: {
        participant: { name: "Peserta" },
        activity: { name: "Kegiatan" },
        template: { template_data: { elements: [] } },
      },
    };
    vi.mocked(axios.get).mockResolvedValue({ data: { data: detail } });
    await expect(getCertificateApproval(1)).resolves.toEqual(detail);
  });

  it.each([undefined, "eyJwYXJ0aWNpcGFudCI6e319", {}, { participant: {} }])(
    "rejects an invalid snapshot before the review renders: %j",
    async (snapshot) => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { data: { id: 1, snapshot } },
      });
      await expect(getCertificateApproval(1)).rejects.toThrow(
        "INVALID_CERTIFICATE_APPROVAL_SNAPSHOT",
      );
    },
  );
});
