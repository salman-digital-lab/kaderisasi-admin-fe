import type {
  BatchResult,
  IssuancePlan,
  IssuanceResult,
} from "../../../types/services/certificateWorkflow";

export async function runCertificateBatches(
  plan: IssuancePlan,
  options: {
    issue: (ids: number[]) => Promise<BatchResult>;
    shouldStop: () => boolean;
    onResult: (results: IssuanceResult[]) => void;
  },
): Promise<{ remaining: number[]; contextChanged: boolean }> {
  let remaining = [...plan.registration_ids];
  while (remaining.length && !options.shouldStop()) {
    const ids = remaining.slice(0, 100);
    let result: BatchResult;
    try {
      result = await options.issue(ids);
    } catch {
      // The server may have committed before the connection failed. Retrying is idempotent.
      return { remaining, contextChanged: false };
    }
    options.onResult(result.results);
    remaining = [...result.remaining_ids, ...remaining.slice(ids.length)];
    if (result.paused) return { remaining, contextChanged: true };
  }
  return { remaining, contextChanged: false };
}
