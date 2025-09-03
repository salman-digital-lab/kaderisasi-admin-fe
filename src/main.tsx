import "antd/dist/reset.css";
// import "./styles/global.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ConfigProvider, theme } from "antd";
import "dayjs/locale/id";
import idID from "antd/locale/id_ID";

const customTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: "#1F99CB", // BMKA blue color from logo
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#ff4d4f",
    colorInfo: "#1F99CB",
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider theme={customTheme} locale={idID}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
