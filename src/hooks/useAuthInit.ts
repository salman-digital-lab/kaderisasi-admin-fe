import { useEffect, useRef } from "react";
import { message } from "antd";
import { bootstrapSession } from "../api/auth";
import { refreshSessionProfile } from "../api/axios";
import { useAuthStore, useIsInitialized } from "../stores/authStore";

export const useAuthInit = () => {
  const isInitialized = useIsInitialized();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void bootstrapSession();
  }, []);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (
        document.visibilityState === "visible" &&
        useAuthStore.getState().isAuthenticated
      ) {
        void refreshSessionProfile().catch(() => {
          useAuthStore.getState().clearAuth();
        });
      }
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, []);

  return { isInitialized };
};

export const useSessionManager = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("message") === "session_expired") {
      message.warning("Sesi Anda telah berakhir. Silakan login kembali.");
      window.history.replaceState({}, document.title, url.pathname);
    }
  }, []);
  return { isAuthenticated };
};
