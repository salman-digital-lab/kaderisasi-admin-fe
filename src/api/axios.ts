import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const instance = axios.create({
  baseURL: import.meta.env.VITE_PUBLIC_BE_ADMIN_API as string,
  timeout: 10000,
});

instance.interceptors.request.use(
  (config) => {
    // Get token from Zustand store instead of localStorage for consistency
    const { token } = useAuthStore.getState();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor to handle 401 errors more gracefully
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only auto-logout if we're not already on the login page
      if (window.location.pathname !== '/login') {
        // Clear auth state
        const { clearAuth } = useAuthStore.getState();
        clearAuth();

        // Redirect to login with a message
        window.location.href = '/login?message=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
