import { ResponsiveEnvironment } from "./components/common/Responsive/ResponsiveEnvironment";
import "antd/dist/reset.css";
import "./styles/global.css";
import "./styles/responsive.css";
import React from "react";
import type { ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { App as AntApp, ConfigProvider } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/id";
import idID from "antd/locale/id_ID";
import { appTheme } from "./theme/tokens";

dayjs.locale("id");

const notificationConfig = { placement: "topRight" as const };

// Static message/notification/Modal calls render outside the React tree;
// holderRender gives them the same theme and locale as the rest of the app.
ConfigProvider.config({
  holderRender: (children: ReactNode) => (
    <ConfigProvider theme={appTheme} locale={idID}>
      <AntApp notification={notificationConfig}>{children}</AntApp>
    </ConfigProvider>
  ),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider theme={appTheme} locale={idID}>
      <AntApp notification={notificationConfig}>
        <ResponsiveEnvironment />
        <App />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
