import type { AxiosAdapter } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import client from "../axios";
import { handleError } from "../errorHandling";
import { getIssuedCertificates } from "./certificateTemplate";

vi.mock("../errorHandling", () => ({ handleError: vi.fn() }));

const adapter = vi.fn<AxiosAdapter>();
const originalAdapter = client.defaults.adapter;

beforeEach(() => {
  adapter.mockReset();
  vi.mocked(handleError).mockClear();
  client.defaults.adapter = adapter;
});

afterEach(() => {
  client.defaults.adapter = originalAdapter;
});

describe("issued certificate requests", () => {
  it.each([1, 50, 100, 101, 205])(
    "looks up %i IDs in bounded JSON batches with a short URL",
    async (count) => {
      const ids = Array.from({ length: count }, (_, index) => 15740 - index);
      const sentIds: number[] = [];
      adapter.mockImplementation(async (config) => {
        expect(config.method).toBe("post");
        expect(config.url).toBe("/certificates/lookup");
        expect(config.params).toBeUndefined();
        expect(config.headers["Content-Type"]).toBe("application/json");
        const body = JSON.parse(config.data as string) as {
          activity_id: number;
          registration_ids: number[];
        };
        expect(Object.keys(body).sort()).toEqual([
          "activity_id",
          "registration_ids",
        ]);
        expect(body.activity_id).toBe(193);
        expect(body.registration_ids.length).toBeLessThanOrEqual(100);
        sentIds.push(...body.registration_ids);
        return {
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          data: {
            data: body.registration_ids.map((id) => ({ registration_id: id })),
          },
        };
      });
      const result = await getIssuedCertificates({
        activity_id: 193,
        registration_ids: [...ids, ids[0]],
      });
      expect(adapter).toHaveBeenCalledTimes(Math.ceil(count / 100));
      expect(sentIds).toEqual(ids);
      expect(result.map((row) => row.registration_id)).toEqual(ids);
    },
  );

  it("makes no request for an empty selection", async () => {
    await expect(
      getIssuedCertificates({ activity_id: 193, registration_ids: [] }),
    ).resolves.toEqual([]);
    expect(adapter).not.toHaveBeenCalled();
  });

  it("keeps ordinary certificate browsing on GET with pagination", async () => {
    adapter.mockImplementation(async (config) => ({
      status: 200,
      statusText: "OK",
      headers: {},
      config,
      data: { data: { meta: { current_page: 2 }, data: [] } },
    }));
    await expect(
      getIssuedCertificates({ activity_id: 193, page: 2, per_page: 50 }),
    ).resolves.toEqual([]);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: "get",
      url: "/certificates",
      params: { activity_id: 193, page: 2, per_page: 50 },
    });
  });

  it("reports a failed batch once and rejects the incomplete lookup", async () => {
    const failure = new Error("Lookup unavailable");
    adapter.mockRejectedValue(failure);
    await expect(
      getIssuedCertificates({ activity_id: 193, registration_ids: [15740] }),
    ).rejects.toBe(failure);
    expect(handleError).toHaveBeenCalledExactlyOnceWith(failure);
  });
});
