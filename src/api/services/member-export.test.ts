import { expect, it, vi } from "vitest";
import axios from "../axios";
import { getMemberExportPreview } from "./member-export";

vi.mock("../axios", () => ({ default: { get: vi.fn() } }));

it("previews applied filters without copying pagination", async () => {
  const preview = { total: 42, columns: [{ key: "email", label: "Email" }] };
  vi.mocked(axios.get).mockResolvedValueOnce({ data: { data: preview } });
  const filters = {
    search: "Nama & Email",
    badge: "LMD",
    member_id: "00012",
    education_institution: "ITB",
    page: 3,
    per_page: 10,
  };
  await expect(getMemberExportPreview(filters)).resolves.toEqual(preview);
  expect(axios.get).toHaveBeenCalledWith(
    "/profiles/export/preview?search=Nama+%26+Email&badge=LMD&member_id=00012&education_institution=ITB",
  );
});

it("propagates preview failures so downloads remain disabled", async () => {
  const error = new Error("Forbidden");
  vi.mocked(axios.get).mockRejectedValueOnce(error);
  await expect(
    getMemberExportPreview({
      search: "",
      badge: "",
      member_id: "",
      education_institution: "",
    }),
  ).rejects.toBe(error);
});
