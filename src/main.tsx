import "antd/dist/reset.css";
import "./styles/global.css";
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
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      fontSize: 14,
      fontWeight: 500,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 16,
      paddingLG: 24,
    },
    Form: {
      labelFontSize: 14,
      labelColor: 'rgba(0, 0, 0, 0.88)',
    },
  },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider theme={customTheme} locale={idID}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
