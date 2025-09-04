import routes from "./routes";
import { RouterProvider } from "react-router-dom";
import { useAuthInit, useSessionManager } from "./hooks/useAuthInit";

const App = () => {
  // Initialize auth state from localStorage
  const { isInitialized } = useAuthInit();

  // Handle session management (warnings, cleanup, etc.)
  useSessionManager();

  // Don't render router until auth is initialized to prevent flash
  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return <RouterProvider router={routes} />;
};

export default App;
