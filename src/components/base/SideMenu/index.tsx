import { Layout, Menu, Typography } from "antd";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import { menuItems } from "./data";
import { SidebarProps } from "../../../types";
import { usePermissions } from "../../../stores/authStore";

const { Sider } = Layout;
const { Text } = Typography;

const SideMenu = ({ collapsed, onCollapse }: SidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const permissions = usePermissions();

  // Memoize menu items based on permissions - will re-calculate when permissions change
  const memoizedMenuItems = useMemo(
    () => menuItems(permissions),
    [permissions],
  );

  // Determine selected keys based on current path
  const getSelectedKeys = () => {
    if (currentPath.startsWith("/dashboard")) return ["/dashboard"];
    if (currentPath.startsWith("/activity")) return ["/activity"];
    if (currentPath.startsWith("/member")) return ["/member"];
    if (currentPath.startsWith("/ruang-curhat")) return ["/ruang-curhat"];
    if (currentPath.startsWith("/achievement")) return ["/achievement"];
    if (currentPath.startsWith("/monthly-leaderboard"))
      return ["/monthly-leaderboard"];
    if (currentPath.startsWith("/lifetime-leaderboard"))
      return ["/lifetime-leaderboard"];
    if (currentPath.startsWith("/club")) return ["/club"];
    if (currentPath.startsWith("/province")) return ["/province"];
    if (currentPath.startsWith("/universities")) return ["/universities"];
    if (currentPath.startsWith("/custom-form")) return ["/custom-form"];
    if (currentPath.startsWith("/admin-users")) return ["/admin-users"];
    return ["/dashboard"];
  };

  const getOpenKeys = () => {
    if (
      currentPath.startsWith("/province") ||
      currentPath.startsWith("/universities")
    ) {
      return ["/data-center"];
    }
    if (currentPath.startsWith("/admin-users")) {
      return ["setting"];
    }
    if (
      currentPath.startsWith("/achievement") ||
      currentPath.startsWith("/monthly-leaderboard") ||
      currentPath.startsWith("/lifetime-leaderboard")
    ) {
      return ["/leaderboard"];
    }
    return [];
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={256}
      collapsedWidth={80}
      theme="light"
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        borderRight: "1px solid #f0f0f0",
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "0 16px" : "0 24px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : 12,
          }}
        >
          <img
            src={"/BMKA_logo.svg"}
            alt="BMKA Logo"
            style={{
              width: collapsed ? 32 : 40,
              height: collapsed ? 32 : 40,
              background: "#ffffff",
              padding: "4px",
              borderRadius: "6px",
              border: "1px solid #f0f0f0",
            }}
          />
          {!collapsed && (
            <div>
              <Text
                style={{
                  color: "#262626",
                  fontSize: "16px",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  display: "block",
                }}
              >
                BMKA Admin
              </Text>
              <Text
                style={{
                  color: "#8c8c8c",
                  fontSize: "12px",
                  lineHeight: 1.2,
                  display: "block",
                }}
              >
                Dashboard
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* Menu Section */}
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={memoizedMenuItems}
        style={{
          border: "none",
        }}
      />
    </Sider>
  );
};

export default SideMenu;
