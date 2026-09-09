import axiosLibrary, { AxiosError } from "axios";
import axios from "./axios";
import type {
  AuthSessionResponse,
  PutLogoutResp,
} from "../types/services/auth";
import { useAuthStore } from "../stores/authStore";

type LoginFields = { email?: string; password?: string };

function authError(error: unknown): never {
  if (error instanceof AxiosError) {
    throw new Error(
      (error.response?.data as { message?: string } | undefined)?.message,
    );
  }
  throw error;
}

export async function loginUser(
  values: LoginFields,
): Promise<AuthSessionResponse> {
  try {
    return (await axios.post<AuthSessionResponse>("/auth/login", values)).data;
  } catch (error) {
    return authError(error);
  }
}

export async function loginWithGoogle(
  credential: string,
): Promise<AuthSessionResponse> {
  try {
    return (
      await axios.post<AuthSessionResponse>("/auth/google", { credential })
    ).data;
  } catch (error) {
    return authError(error);
  }
}

export async function bootstrapSession(): Promise<void> {
  const baseURL = import.meta.env.VITE_PUBLIC_BE_ADMIN_API as string;
  const client = axiosLibrary.create({
    baseURL,
    withCredentials: true,
    timeout: 10000,
  });
  try {
    const refreshed = await client.post<AuthSessionResponse>("/auth/refresh");
    useAuthStore.getState().setSession(refreshed.data.data);
    return;
  } catch {
    const rawLegacySession = localStorage.getItem("auth-storage");
    if (rawLegacySession) {
      try {
        const parsed = JSON.parse(rawLegacySession) as {
          state?: { token?: string };
        };
        if (parsed.state?.token) {
          const migrated = await client.post<AuthSessionResponse>(
            "/auth/session/migrate",
            {},
            { headers: { Authorization: `Bearer ${parsed.state.token}` } },
          );
          useAuthStore.getState().setSession(migrated.data.data);
          localStorage.removeItem("auth-storage");
          return;
        }
      } catch {
        localStorage.removeItem("auth-storage");
      }
    }
  }
  useAuthStore.getState().markInitialized();
}

export async function logout(): Promise<void> {
  try {
    await axios.post<PutLogoutResp>("/auth/logout");
  } finally {
    useAuthStore.getState().clearAuth();
  }
}
