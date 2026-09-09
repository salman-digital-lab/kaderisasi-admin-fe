import { create } from "zustand";
import type { AuthSession, SessionUser } from "../types/services/auth";

export interface AuthState {
  token: string | null;
  user: SessionUser | null;
  role: AuthSession["user"]["role"];
  permissions: string[];
  authenticationMethods: string[];
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setSession: (session: AuthSession) => void;
  clearAuth: () => void;
  markInitialized: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  role: null,
  permissions: [],
  authenticationMethods: [],
  isSuperAdmin: false,
  isAuthenticated: false,
  isInitialized: false,

  setSession: (session) =>
    set({
      token: session.access_token,
      user: session.user,
      role: session.user.role,
      permissions: session.permissions,
      authenticationMethods: session.authentication_methods,
      isSuperAdmin: session.is_super_admin,
      isAuthenticated: true,
      isInitialized: true,
    }),
  clearAuth: () =>
    set({
      token: null,
      user: null,
      role: null,
      permissions: [],
      authenticationMethods: [],
      isSuperAdmin: false,
      isAuthenticated: false,
      isInitialized: true,
    }),
  markInitialized: () => set({ isInitialized: true }),
  hasPermission: (permission) => get().permissions.includes(permission),
}));

export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useIsInitialized = () =>
  useAuthStore((state) => state.isInitialized);
export const useUser = () => useAuthStore((state) => state.user);
export const useToken = () => useAuthStore((state) => state.token);
export const usePermissions = () => useAuthStore((state) => state.permissions);
export const useRole = () => useAuthStore((state) => state.role);
export const useIsSuperAdmin = () =>
  useAuthStore((state) => state.isSuperAdmin);
export const useClearAuth = () => useAuthStore((state) => state.clearAuth);
export const useSetSession = () => useAuthStore((state) => state.setSession);
export const useHasPermission = () =>
  useAuthStore((state) => state.hasPermission);

export const isAuthenticated = () => useAuthStore.getState().isAuthenticated;
export const hasPermission = (permission: string) =>
  useAuthStore.getState().hasPermission(permission);
export const getUserPermissions = () => useAuthStore.getState().permissions;
export const getUser = () => useAuthStore.getState().user;
export const clearUserCache = () => useAuthStore.getState().clearAuth();
