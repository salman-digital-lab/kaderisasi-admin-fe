import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ADMIN_ROLE_PERMISSION } from '../constants/permissions';

export interface User {
  id?: string;
  email?: string;
  display_name?: string;
  role?: keyof typeof ADMIN_ROLE_PERMISSION | string;
  [key: string]: any;
}

export interface AuthState {
  // State
  token: string | null;
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // Actions
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  initialize: () => void;
  
  // Computed getters
  hasPermission: (permission: string) => boolean;
  getUserRole: () => keyof typeof ADMIN_ROLE_PERMISSION | string | undefined;
  getPermissions: () => string[];
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      user: null,
      permissions: [],
      isAuthenticated: false,
      isInitialized: false,

      // Actions
      setAuth: (token: string, user: User) => {
        const role = user?.role as keyof typeof ADMIN_ROLE_PERMISSION;
        const permissions = ADMIN_ROLE_PERMISSION[role] || [];
        
        set({
          token,
          user,
          permissions,
          isAuthenticated: true,
          isInitialized: true,
        });
      },

      clearAuth: () => {
        set({
          token: null,
          user: null,
          permissions: [],
          isAuthenticated: false,
          isInitialized: true,
        });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        const updatedUser = { ...currentUser, ...userData };
        const role = updatedUser?.role as keyof typeof ADMIN_ROLE_PERMISSION;
        const permissions = ADMIN_ROLE_PERMISSION[role] || [];
        
        set({
          user: updatedUser,
          permissions,
        });
      },

      initialize: () => {
        const state = get();
        if (state.isInitialized) return;
        
        // Mark as initialized - the persist middleware has already loaded data
        set({ isInitialized: true });
      },

      // Computed getters
      hasPermission: (permission: string) => {
        return get().permissions.includes(permission);
      },

      getUserRole: () => {
        return get().user?.role;
      },

      getPermissions: () => {
        return get().permissions;
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
      // Handle hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalculate permissions in case ADMIN_ROLE_PERMISSION changed
          if (state.user?.role) {
            const role = state.user.role as keyof typeof ADMIN_ROLE_PERMISSION;
            const newPermissions = ADMIN_ROLE_PERMISSION[role] || [];
            state.permissions = newPermissions;
          }
          // Set initialized after all calculations are done
          state.isInitialized = true;
        }
      },
    }
  )
);

// Simple, stable selectors
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsInitialized = () => useAuthStore((state) => state.isInitialized);
export const useUser = () => useAuthStore((state) => state.user);
export const useToken = () => useAuthStore((state) => state.token);
export const usePermissions = () => useAuthStore((state) => state.permissions);

// Compound selectors for convenience
export const useAuth = () => useAuthStore((state) => ({
  token: state.token,
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isInitialized: state.isInitialized,
}));

// Action hooks
export const useSetAuth = () => useAuthStore((state) => state.setAuth);
export const useClearAuth = () => useAuthStore((state) => state.clearAuth);
export const useUpdateUser = () => useAuthStore((state) => state.updateUser);
export const useInitialize = () => useAuthStore((state) => state.initialize);

// Helper function for permission checking
export const useHasPermission = () => {
  return (permission: string) => {
    const permissions = useAuthStore.getState().permissions;
    return permissions.includes(permission);
  };
};

// Backward compatibility helpers
export const isAuthenticated = () => useAuthStore.getState().isAuthenticated;
export const hasPermission = (permission: string) => useAuthStore.getState().hasPermission(permission);
export const getUserPermissions = () => useAuthStore.getState().getPermissions();
export const getUserRole = () => useAuthStore.getState().getUserRole();
export const getUser = () => useAuthStore.getState().user;
export const clearUserCache = () => useAuthStore.getState().clearAuth();
