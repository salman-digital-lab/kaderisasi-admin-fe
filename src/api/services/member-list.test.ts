import { expect, it, vi } from "vitest";
import axios from "../axios";
import { getProfiles } from "./member";

vi.mock("../axios", () => ({ default: { get: vi.fn() } }));
vi.mock("../errorHandling", () => ({ handleError: vi.fn() }));

it("distinguishes a failed member read from a successful empty list", async () => {
  const failure = new Error("server unavailable");
  vi.mocked(axios.get).mockRejectedValueOnce(failure);
  await expect(getProfiles({ page: "1", per_page: "10" })).rejects.toBe(
    failure,
  );
  vi.mocked(axios.get).mockResolvedValueOnce({
    data: { data: { data: [], meta: { total: 0 } } },
  });
  await expect(getProfiles({ page: "1", per_page: "10" })).resolves.toEqual({
    data: [],
    meta: { total: 0 },
  });
});
