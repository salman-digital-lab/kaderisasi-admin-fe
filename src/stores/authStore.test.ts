import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./authStore";
import type { AuthSession } from "../types/services/auth";

const session: AuthSession = {
  access_token: "memory-only-token",
  access_token_expires_in: 900,
  user: {
    id: 1,
    email: "admin@example.com",
    display_name: "Admin",
    is_active: true,
    role: { code: "super_admin", name: "Super Admin" },
  },
  authentication_methods: ["password"],
  permissions: ["dashboard.read", "tickets.review"],
  is_super_admin: false,
};

describe("auth store", () => {
  beforeEach(() => useAuthStore.getState().clearAuth());

  it("derives authorization only from the backend session", () => {
    useAuthStore.getState().setSession(session);
    expect(useAuthStore.getState().hasPermission("tickets.review")).toBe(true);
    expect(useAuthStore.getState().hasPermission("admin_users.manage")).toBe(
      false,
    );
    expect(useAuthStore.getState().token).toBe("memory-only-token");
  });

  it("clears access tokens and effective permissions together", () => {
    useAuthStore.getState().setSession(session);
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().permissions).toEqual([]);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
