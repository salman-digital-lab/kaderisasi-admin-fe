import { describe, expect, it, vi } from "vitest";
import {
  CertificateAutosaveController,
  type AutosaveState,
} from "./autosave-controller";

describe("CertificateAutosaveController", () => {
  it("debounces, serializes, and coalesces edits during a save", async () => {
    vi.useFakeTimers();
    const resolvers: Array<(version: number) => void> = [];
    const save = vi.fn(
      () =>
        new Promise<number>((resolve) => {
          resolvers.push(resolve);
        }),
    );
    const states: AutosaveState[] = [];
    const controller = new CertificateAutosaveController({
      initialVersion: 3,
      save,
      classifyError: () => ({ type: "fatal" }),
      onStateChange: (state) => states.push(state),
    });

    controller.schedule("one");
    controller.schedule("two");
    await vi.advanceTimersByTimeAsync(1_200);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("two", 3);

    controller.schedule("three");
    resolvers[0](4);
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("three", 4);
    resolvers[1](5);
    await Promise.resolve();
    expect(states[states.length - 1]?.status).toBe("saved");
    vi.useRealTimers();
  });

  it("retries retryable failures and resumes immediately when online", async () => {
    vi.useFakeTimers();
    const save = vi
      .fn<() => Promise<number>>()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(2);
    const states: AutosaveState[] = [];
    const controller = new CertificateAutosaveController({
      initialVersion: 1,
      save,
      classifyError: () => ({ type: "retryable" }),
      onStateChange: (state) => states.push(state),
    });
    controller.schedule("draft");
    await vi.advanceTimersByTimeAsync(1_200);
    expect(save).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(states[states.length - 1]?.status).toBe("saved");

    controller.schedule("offline");
    controller.setOnline(false);
    expect(states[states.length - 1]?.status).toBe("offline");
    controller.setOnline(true);
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it("pauses on conflicts and overwrites only with an explicit server version", async () => {
    vi.useFakeTimers();
    const conflict = { currentVersion: 8, updatedAt: "2026-07-18T00:00:00Z" };
    const save = vi
      .fn<() => Promise<number>>()
      .mockRejectedValueOnce(conflict)
      .mockResolvedValue(9);
    const states: AutosaveState[] = [];
    const controller = new CertificateAutosaveController({
      initialVersion: 7,
      save,
      classifyError: (error) => ({
        type: "conflict",
        conflict: error as typeof conflict,
      }),
      onStateChange: (state) => states.push(state),
    });
    controller.schedule("local");
    await vi.advanceTimersByTimeAsync(1_200);
    expect(states[states.length - 1]).toEqual({
      status: "conflict",
      conflict,
    });
    controller.retry();
    expect(save).toHaveBeenCalledTimes(1);
    controller.overwriteWithVersion(8);
    await Promise.resolve();
    expect(save).toHaveBeenLastCalledWith("local", 8);
    vi.useRealTimers();
  });

  it("keeps an invalid published edit local until saving is allowed", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue(2);
    const states: AutosaveState[] = [];
    const controller = new CertificateAutosaveController({
      initialVersion: 1,
      save,
      classifyError: () => ({ type: "fatal" }),
      onStateChange: (state) => states.push(state),
    });

    controller.schedule("invalid", false);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(save).not.toHaveBeenCalled();
    expect(states[states.length - 1]?.status).toBe("needs-fix");

    controller.schedule("fixed", true);
    await vi.advanceTimersByTimeAsync(1_200);
    expect(save).toHaveBeenCalledWith("fixed", 1);
    vi.useRealTimers();
  });
});
