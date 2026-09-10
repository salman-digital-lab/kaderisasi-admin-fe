import { expect, it, vi } from "vitest";
import axios from "../axios";
import { getCounselorOptions } from "./ruangcurhat";

vi.mock("../axios", () => ({ default: { get: vi.fn(), put: vi.fn() } }));
vi.mock("../errorHandling", () => ({ handleError: vi.fn() }));

it("loads counselor options through the counseling-scoped endpoint", async () => {
  vi.mocked(axios.get).mockResolvedValueOnce({
    data: {
      message: "GET_DATA_SUCCESS",
      data: [
        {
          id: 7,
          email: "counselor@example.test",
          display_name: "Counselor",
        },
      ],
    },
  });

  await expect(getCounselorOptions()).resolves.toEqual([
    {
      id: 7,
      email: "counselor@example.test",
      display_name: "Counselor",
    },
  ]);
  expect(axios.get).toHaveBeenCalledWith("/ruang-curhat/counselors");
});
