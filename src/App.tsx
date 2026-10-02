import routes from "./routes";
import { RouterProvider } from "react-router-dom";
import { Flex, Spin } from "antd";
import { useAuthInit, useSessionManager } from "./hooks/useAuthInit";

const App = () => {
  // Initialize auth state from localStorage
  const { isInitialized } = useAuthInit();

  // Handle session management (warnings, cleanup, etc.)
  useSessionManager();

  // Don't render router until auth is initialized to prevent flash
  if (!isInitialized) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
        <Spin size="large" aria-label="Memuat aplikasi" />
      </Flex>
    );
  }

  return <RouterProvider router={routes} />;
};

export default App;
