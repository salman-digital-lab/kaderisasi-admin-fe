import { describe, expect, it, vi } from "vitest";
import type {
  BatchResult,
  IssuancePlan,
  IssuanceResult,
} from "../../../types/services/certificateWorkflow";
import { runCertificateBatches } from "./batch-runner";

const plan = (count: number): IssuancePlan => ({
  activity_id: 1,
  template_id: 1,
  template_version: 2,
  registration_ids: Array.from({ length: count }, (_, i) => i + 1),
  excluded: { already_issued: 0, revoked: 0, not_eligible: 0, missing: 0 },
  preview: null,
});
const batch = (ids: number[]): BatchResult => ({
  results: ids.map((id) => ({
    registration_id: id,
    name: `Peserta ${id}`,
    state: "created",
  })),
  paused: false,
  remaining_ids: [],
});

describe("certificate batches", () => {
  it.each([0, 1, 100, 101, 1000])(
    "issues %i recipients sequentially in batches of at most 100",
    async (count) => {
      let active = 0;
      const results: IssuanceResult[] = [];
      const issue = vi.fn(async (ids: number[]) => {
        expect(++active).toBe(1);
        expect(ids.length).toBeLessThanOrEqual(100);
        await Promise.resolve();
        active--;
        return batch(ids);
      });
      const outcome = await runCertificateBatches(plan(count), {
        issue,
        shouldStop: () => false,
        onResult: (items) => results.push(...items),
      });
      expect(issue).toHaveBeenCalledTimes(Math.ceil(count / 100));
      expect(results.map((item) => item.registration_id)).toEqual(
        plan(count).registration_ids,
      );
      expect(outcome).toEqual({ remaining: [], contextChanged: false });
    },
  );
  it("stops only after the current batch and preserves completed results", async () => {
    let stop = false;
    const result = await runCertificateBatches(plan(101), {
      issue: async (ids) => {
        stop = true;
        return batch(ids);
      },
      shouldStop: () => stop,
      onResult: (items) => expect(items).toHaveLength(100),
    });
    expect(result.remaining).toEqual([101]);
  });
  it("keeps uncertain requests available for idempotent retry", async () => {
    const result = await runCertificateBatches(plan(101), {
      issue: async () => {
        throw new Error("connection lost after commit");
      },
      shouldStop: () => false,
      onResult: () => {
        throw new Error("no confirmed results");
      },
    });
    expect(result.remaining).toEqual(plan(101).registration_ids);
  });
  it("pauses on a template conflict without losing partial successes", async () => {
    const onResult = vi.fn();
    const result = await runCertificateBatches(plan(101), {
      issue: async (ids) => ({
        ...batch(ids.slice(0, 2)),
        paused: true,
        remaining_ids: ids.slice(2),
      }),
      shouldStop: () => false,
      onResult,
    });
    expect(onResult.mock.calls[0][0]).toHaveLength(2);
    expect(result).toEqual({
      remaining: plan(101).registration_ids.slice(2),
      contextChanged: true,
    });
  });
  it("reports named partial failures and continues the next batch", async () => {
    const results: IssuanceResult[] = [];
    await runCertificateBatches(plan(101), {
      issue: async (ids) => ({
        ...batch(ids),
        results: batch(ids).results.map((item) =>
          item.registration_id === 2
            ? { ...item, state: "failed", reason: "GENERAL_ERROR" }
            : item,
        ),
      }),
      shouldStop: () => false,
      onResult: (items) => results.push(...items),
    });
    expect(results).toHaveLength(101);
    expect(results[1]).toMatchObject({ name: "Peserta 2", state: "failed" });
    expect(results[100].state).toBe("created");
  });
});

it("latches an interruption during an active request even if the page returns before it completes", async () => {
  let stopped = false;
  let finish: (result: BatchResult) => void = () => {};
  const issue = vi.fn(
    (ids: number[]) =>
      new Promise<BatchResult>((resolve) => {
        finish = resolve;
        expect(ids).toHaveLength(100);
      }),
  );
  const completed = vi.fn();
  const work = runCertificateBatches(plan(1000), {
    issue,
    shouldStop: () => stopped,
    onResult: completed,
  });
  stopped = true; // visibilitychange/pagehide latch; returning does not clear it
  finish(batch(plan(100).registration_ids));
  const outcome = await work;
  expect(issue).toHaveBeenCalledTimes(1);
  expect(completed.mock.calls[0][0]).toHaveLength(100);
  expect(outcome.remaining).toEqual(plan(1000).registration_ids.slice(100));
});
it("does not begin any request when the page is already hidden or unmounted", async () => {
  const issue = vi.fn();
  const outcome = await runCertificateBatches(plan(1000), {
    issue,
    shouldStop: () => true,
    onResult: vi.fn(),
  });
  expect(issue).not.toHaveBeenCalled();
  expect(outcome.remaining).toEqual(plan(1000).registration_ids);
});
