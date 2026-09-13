import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "../axios";
import { findDetailShortLink } from "./short-link";

vi.mock("../axios", () => ({ default: { get: vi.fn() } }));
const get = vi.mocked(axios.get);
const destination = "https://example.test/activity/kajian";

describe("detail short-link lookup", () => {
  beforeEach(() => get.mockReset());

  it("ignores partial matches and continues through result pages", async () => {
    const exact = { code: "Kajian", original_url: destination };
    get.mockResolvedValueOnce({
      data: {
        data: {
          data: [{ code: "Other", original_url: `${destination}-lain` }],
          meta: { last_page: 2 },
        },
      },
    });
    get.mockResolvedValueOnce({
      data: { data: { data: [exact], meta: { last_page: 2 } } },
    });
    expect(await findDetailShortLink(destination)).toEqual(exact);
    expect(get).toHaveBeenLastCalledWith("/short-links", {
      params: { search: destination, page: 2, per_page: 100 },
    });
  });

  it("returns no link when all matches point to other destinations", async () => {
    get.mockResolvedValueOnce({
      data: { data: { data: [], meta: { last_page: 1 } } },
    });
    expect(await findDetailShortLink(destination)).toBeNull();
  });

  it("propagates lookup failure so creation cannot assume the link is absent", async () => {
    get.mockRejectedValueOnce(new Error("Database unavailable"));
    await expect(findDetailShortLink(destination)).rejects.toThrow(
      "Database unavailable",
    );
  });
});
