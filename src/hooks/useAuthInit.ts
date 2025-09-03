import { useEffect, useRef } from 'react';
import { useIsInitialized, useAuthStore } from '../stores/authStore';

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
