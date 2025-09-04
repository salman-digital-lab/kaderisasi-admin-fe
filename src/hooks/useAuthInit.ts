import { useEffect, useRef } from 'react';
import { useIsInitialized, useAuthStore } from '../stores/authStore';
import { message } from 'antd';

/**
 * Hook to initialize authentication state from localStorage
 * Should be called once at the app root level
 */
export const useAuthInit = () => {
  const isInitialized = useIsInitialized();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized && !hasInitialized.current) {
      hasInitialized.current = true;
      // Get initialize function directly to avoid dependency issues
      const { initialize } = useAuthStore.getState();
      initialize();
    }
  }, [isInitialized]);

  return { isInitialized };
};

/**
 * Hook to handle session expiration warnings and automatic logout
 */
export const useSessionManager = () => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check for session expired message in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionMessage = urlParams.get('message');

    if (sessionMessage === 'session_expired') {
      message.warning('Sesi Anda telah berakhir. Silakan login kembali.');
      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // You could add more session management logic here in the future
  // such as periodic token validation or activity-based session extension

  return { isAuthenticated };
};
