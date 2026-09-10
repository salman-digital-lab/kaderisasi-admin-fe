import { beforeEach, expect, it, vi } from "vitest";
import axios from "../axios";
import { putRemoveActivityImage, putReorderActivityImages } from "./activity";

vi.mock("../axios", () => ({ default: { put: vi.fn() } }));
vi.mock("../errorHandling", () => ({ handleError: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

it.each([
  ["remove", () => putRemoveActivityImage(1, { image: "fixture.png" })],
  ["reorder", () => putReorderActivityImages(1, { images: ["fixture.png"] })],
] as const)(
  "propagates a failed image %s so the UI cannot report success",
  async (_action, mutate) => {
    const failure = new Error("connection lost");
    vi.mocked(axios.put).mockRejectedValueOnce(failure);
    await expect(mutate()).rejects.toBe(failure);
    expect(axios.put).toHaveBeenCalledTimes(1);
  },
);
