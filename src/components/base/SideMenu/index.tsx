import { Layout, Menu, Typography } from "antd";
import { useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { menuItems } from "./data";
import { SidebarProps } from "../../../types";
import { usePermissions } from "../../../stores/authStore";
import { getReviewTickets } from "../../../api/services/access";

const { Sider } = Layout;

const SELECTABLE_KEYS = [
  "/announcements",
  "/calendar",
  "/dashboard",
  "/my-requests",
  "/ticket-review",
  "/activity",
  "/member",
  "/ruang-curhat",
  "/achievement",
  "/monthly-leaderboard",
  "/club",
  "/courses",
  "/short-links",
  "/province",
  "/universities",
  "/custom-form",
  "/admin-users",
  "/digital-certificate",
];

const PARENT_KEYS: Record<string, string> = {
  "/my-requests": "/access-tickets",
  "/ticket-review": "/access-tickets",
  "/province": "/data-center",
  "/universities": "/data-center",
  "/admin-users": "setting",
  "/rbac/roles": "setting",
  "/achievement": "/leaderboard",
  "/monthly-leaderboard": "/leaderboard",
};
const { Text } = Typography;

interface SideMenuProps extends SidebarProps {
  navigationOnly?: boolean;
  onNavigate?: () => void;
}

const SideMenu = ({
  collapsed,
  onCollapse,
  navigationOnly = false,
  onNavigate,
}: SideMenuProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const permissions = usePermissions();
  const [reviewCount, setReviewCount] = useState(0);
  const canReviewTickets = permissions.includes("tickets.review");

  useEffect(() => {
    if (!canReviewTickets) {
      setReviewCount(0);
      return;
    }
    let cancelled = false;
    void getReviewTickets("open")
      .then((tickets) => {
        if (!cancelled) setReviewCount(tickets.length);
      })
      .catch(() => {
        if (!cancelled) setReviewCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [currentPath, canReviewTickets]);

  // Memoize menu items based on permissions - will re-calculate when permissions change
  const memoizedMenuItems = useMemo(
    () => menuItems(permissions, reviewCount),
    [permissions, reviewCount],
  );

  // Top-level route prefixes that map to a menu key.
  const selectedKey = SELECTABLE_KEYS.find(
    (key) => currentPath === key || currentPath.startsWith(`${key}/`),
  );
  const selectedKeys = currentPath.startsWith("/rbac")
    ? ["/rbac/roles"]
    : currentPath.startsWith("/registrant/")
      ? ["/activity"]
      : selectedKey
        ? [selectedKey]
        : [];
  const parentKey = selectedKeys[0] ? PARENT_KEYS[selectedKeys[0]] : undefined;

  // Keep the active section expanded when navigating, without collapsing
  // sections the user opened manually.
  const [openKeys, setOpenKeys] = useState<string[]>(
    parentKey ? [parentKey] : [],
  );
  useEffect(() => {
    if (parentKey) {
      setOpenKeys((keys) =>
        keys.includes(parentKey) ? keys : [...keys, parentKey],
      );
    }
  }, [parentKey]);

  const content = (
    <>
      {/* Logo Section */}
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "0 12px" : "0 16px",
          borderBottom: "1px solid var(--app-color-border-secondary)",
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
              width: collapsed ? 24 : 32,
              height: collapsed ? 24 : 32,
              background: "#ffffff",
              padding: "4px",
              border: "1px solid var(--app-color-border-secondary)",
            }}
          />
          {!collapsed && (
            <div>
              <Text
                style={{
                  color: "var(--app-color-text)",
                  fontSize: "14px",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  display: "block",
                }}
              >
                BMKA Admin
              </Text>
              <Text
                style={{
                  color: "var(--app-color-text-secondary)",
                  fontSize: "11px",
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
        selectedKeys={selectedKeys}
        openKeys={collapsed ? undefined : openKeys}
        onOpenChange={setOpenKeys}
        items={memoizedMenuItems}
        onClick={onNavigate}
        style={{
          border: "none",
          fontSize: "13px",
        }}
      />
    </>
  );
  return navigationOnly ? (
    content
  ) : (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={220}
      collapsedWidth={64}
      theme="light"
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        borderRight: "1px solid var(--app-color-border-secondary)",
      }}
    >
      {content}
    </Sider>
  );
};

export default SideMenu;
