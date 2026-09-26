import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "../axios";
import {
  getCertificateApproval,
  requestCertificateApprovals,
} from "./certificateApproval";

vi.mock("../axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

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

it("sends a fixed document identity independently of the approving admin", async () => {
  vi.mocked(axios.post).mockResolvedValue({ data: { data: [] } });
  await requestCertificateApprovals(
    { activity_id: 1, template_id: 2, template_version: 3 } as Parameters<
      typeof requestCertificateApprovals
    >[0],
    [4],
    9,
    "oktofa-yudha-sudrajad",
  );
  expect(axios.post).toHaveBeenCalledWith(
    "/certificates/approvals",
    {
      registration_ids: [4],
      signer_id: 9,
      document_signer_key: "oktofa-yudha-sudrajad",
      expected: { activity_id: 1, template_id: 2, template_version: 3 },
    },
    { timeout: 60000 },
  );
});
