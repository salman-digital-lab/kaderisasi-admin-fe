import axios, { AxiosError, type AxiosAdapter } from "axios";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { useAuthStore } from "../stores/authStore";
import type { AuthSession } from "../types/services/auth";

const session: AuthSession = {
  access_token: "initial-token",
  access_token_expires_in: 900,
  user: {
    id: 1,
    email: "admin@example.com",
    display_name: "Admin",
    is_active: true,
    role: { code: "super_admin", name: "Super Admin" },
  },
  permissions: ["tickets.review"],
  authentication_methods: ["google"],
  is_super_admin: true,
};
const adapter = vi.fn<AxiosAdapter>();
const originalAdapter = axios.defaults.adapter;
let client: typeof import("./axios").default;
const redirect = vi.fn();
beforeAll(async () => {
  axios.defaults.adapter = adapter;
  client = (await import("./axios")).default;
});
afterAll(() => {
  axios.defaults.adapter = originalAdapter;
  vi.unstubAllGlobals();
});
beforeEach(() => {
  adapter.mockReset();
  redirect.mockReset();
  vi.stubGlobal("window", {
    location: {
      pathname: "/ticket-review",
      set href(value: string) {
        redirect(value);
      },
    },
  });
  useAuthStore.getState().setSession(session);
});
function respond(status: number, data: unknown = {}): AxiosAdapter {
  return async (config) => {
    const response = {
      status,
      statusText: String(status),
      data,
      headers: {},
      config,
    };
    if (status >= 400)
      throw new AxiosError(
        "Request rejected",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        response,
      );
    return response;
  };
}
const refreshed = respond(200, {
  data: { ...session, access_token: "refreshed-token" },
});
describe("session retries", () => {
  it("retries once with the refreshed token", async () => {
    adapter
      .mockImplementationOnce(respond(401))
      .mockImplementationOnce(refreshed)
      .mockImplementationOnce(respond(200));
    await client.get("/tickets/review");
    expect(adapter).toHaveBeenCalledTimes(3);
    expect(adapter.mock.calls[1][0].url).toBe("/auth/refresh");
    expect(adapter.mock.calls[2][0].headers.Authorization).toBe(
      "Bearer refreshed-token",
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(redirect).not.toHaveBeenCalled();
  });
  it("ends the session when the replay is unauthorized", async () => {
    adapter
      .mockImplementationOnce(respond(401))
      .mockImplementationOnce(refreshed)
      .mockImplementationOnce(respond(401));
    await expect(client.get("/tickets/review")).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(adapter).toHaveBeenCalledTimes(3);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().permissions).toEqual([]);
    expect(redirect).not.toHaveBeenCalled();
  });
  it("ends the session when refreshing fails", async () => {
    adapter
      .mockImplementationOnce(respond(401))
      .mockImplementationOnce(respond(401));
    await expect(client.get("/tickets/review")).rejects.toBeInstanceOf(
      AxiosError,
    );
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(redirect).not.toHaveBeenCalled();
  });
  it("does not refresh late unauthorized responses after clearing the session", async () => {
    let rejectLate: (() => void) | undefined;
    adapter.mockImplementationOnce(
      (config) =>
        new Promise((_, reject) => {
          rejectLate = () =>
            reject(
              new AxiosError(
                "Unauthorized",
                "ERR_BAD_REQUEST",
                config,
                undefined,
                {
                  status: 401,
                  statusText: "Unauthorized",
                  headers: {},
                  data: {},
                  config,
                },
              ),
            );
        }),
    );
    const pending = client.get("/tickets/review");
    const rejection = expect(pending).rejects.toBeInstanceOf(AxiosError);
    await vi.waitFor(() => expect(rejectLate).toBeDefined());
    useAuthStore.getState().clearAuth();
    rejectLate!();
    await rejection;
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(redirect).not.toHaveBeenCalled();
  });
  it.each(["/auth/login", "/auth/google"])(
    "does not refresh rejected credentials at %s",
    async (url) => {
      adapter.mockImplementation(respond(401));
      await expect(client.post(url)).rejects.toBeInstanceOf(AxiosError);
      expect(adapter).toHaveBeenCalledTimes(1);
      expect(redirect).not.toHaveBeenCalled();
    },
  );
});
