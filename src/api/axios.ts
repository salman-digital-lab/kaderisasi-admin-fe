import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/authStore";
import type { AuthSessionResponse } from "../types/services/auth";

const baseURL = import.meta.env.VITE_PUBLIC_BE_ADMIN_API as string;

const instance = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
});

export const sessionClient = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

function endSession(): void {
  // The route guard sends signed-out users to /login without reloading.
  // A reload would bootstrap the same refresh cookie and restart the cycle.
  useAuthStore.getState().clearAuth();
}

export async function refreshSession(): Promise<string> {
  if (!refreshPromise) {
    const originalToken = useAuthStore.getState().token;
    refreshPromise = sessionClient
      .post<AuthSessionResponse>("/auth/refresh")
      .then(({ data }) => {
        if (useAuthStore.getState().token !== originalToken) {
          throw new axios.CanceledError("Session changed during refresh");
        }
        useAuthStore.getState().setSession(data.data);
        return data.data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function refreshSessionProfile(): Promise<void> {
  const token = useAuthStore.getState().token;
  if (!token) return;
  try {
    const { data } = await sessionClient.get<AuthSessionResponse>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    useAuthStore.getState().setSession(data.data);
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      await refreshSession();
      return;
    }
    throw error;
  }
}

instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as
      | (InternalAxiosRequestConfig & {
          _sessionRetry?: boolean;
          _permissionRefresh?: boolean;
        })
      | undefined;

    const isAuthenticationAttempt =
      config?.url === "/auth/login" || config?.url === "/auth/google";
    if (error.response?.status === 401 && config && !isAuthenticationAttempt) {
      // Stop rejected replays and late responses after session failure.
      if (config._sessionRetry || !useAuthStore.getState().isAuthenticated) {
        endSession();
        return Promise.reject(error);
      }
      config._sessionRetry = true;
      try {
        const token = await refreshSession();
        config.headers.Authorization = `Bearer ${token}`;
        return instance(config);
      } catch {
        endSession();
      }
    }

    if (
      error.response?.status === 403 &&
      config &&
      !config._permissionRefresh
    ) {
      config._permissionRefresh = true;
      try {
        await refreshSessionProfile();
      } catch {
        // Keep the original forbidden response; profile refresh is best effort.
      }
    }
    return Promise.reject(error);
  },
);

export default instance;
