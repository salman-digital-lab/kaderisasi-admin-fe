import { useAdminViewport } from "../../hooks/useAdminViewport";
import { useEffect, useRef, useState } from "react";
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  UserOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import {
  Layout,
  Drawer,
  Button,
  theme,
  Typography,
  Dropdown,
  MenuProps,
  message,
  Flex,
  Avatar,
  Badge,
} from "antd";
import SideMenu from "./SideMenu";
import { Outlet, useLocation } from "react-router-dom";
import { logout } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import { useUser, useClearAuth } from "../../stores/authStore";
import Breadcrumb from "../common/Breadcrumb";

const { Header, Content } = Layout;
const { Text } = Typography;

const items: MenuProps["items"] = [
  {
    label: "Logout",
    key: "1",
    icon: <LogoutOutlined />,
  },
];

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { compact: isMobile, drawerNavigation } = useAdminViewport();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  const user = useUser();
  const clearAuth = useClearAuth();
  const navigate = useNavigate();

  const displayName = user?.display_name || "Admin";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search, drawerNavigation]);

  const handleMenuClick: MenuProps["onClick"] = async (e) => {
    if (e.key === "1") {
      try {
        await logout();
        // Clear auth state when user logs out
        clearAuth();
        message.success("Logout successful");
        navigate("/login");
      } catch {
        message.error("An error occured");
      }
    }
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleCollapse = (collapsed: boolean) => {
    setCollapsed(collapsed);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {drawerNavigation ? (
        <Drawer
          title="BMKA Admin"
          placement="left"
          width="min(320px, 90vw)"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          afterOpenChange={(open) => {
            if (!open) menuButtonRef.current?.focus();
          }}
          rootClassName="admin-navigation-drawer"
        >
          <SideMenu
            collapsed={false}
            onCollapse={handleCollapse}
            navigationOnly
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </Drawer>
      ) : (
        <SideMenu collapsed={collapsed} onCollapse={handleCollapse} />
      )}
      <Layout
        style={{
          marginLeft: drawerNavigation ? 0 : collapsed ? 64 : 220,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          minWidth: 0,
        }}
      >
        <Header
          className="admin-header"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            padding: "0 16px",
            background: colorBgContainer,
            borderBottom: "1px solid #f0f0f0",
            height: "48px",
            lineHeight: "48px",
          }}
        >
          <Flex
            justify="space-between"
            align="center"
            style={{ height: "48px" }}
          >
            <Flex align="center" gap={8} style={{ minWidth: 0, flex: 1 }}>
              <Button
                ref={menuButtonRef}
                aria-label={
                  drawerNavigation ? "Buka navigasi" : "Ubah lebar navigasi"
                }
                aria-expanded={drawerNavigation ? mobileMenuOpen : !collapsed}
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() =>
                  drawerNavigation
                    ? setMobileMenuOpen(true)
                    : setCollapsed(!collapsed)
                }
                style={{
                  fontSize: "16px",
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                className="header-menu-btn"
              />
              {!isMobile && (
                <div
                  style={{
                    height: "32px",
                    width: "1px",
                    backgroundColor: "#f0f0f0",
                    margin: "0 8px",
                  }}
                />
              )}
              <Breadcrumb />
            </Flex>

            <Flex align="center" gap={8}>
              <Badge dot={false}>
                <Button
                  type="text"
                  icon={<WhatsAppOutlined />}
                  href="https://chat.whatsapp.com/G4qpf2oFwtBJjaQb5YwDiV"
                  target="_blank"
                  style={{
                    fontSize: "14px",
                    height: 32,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "0 12px",
                    transition: "all 0.2s",
                  }}
                  className="header-help-btn"
                  title="Bantuan & Dukungan"
                >
                  Bantuan
                </Button>
              </Badge>

              <Dropdown
                menu={menuProps}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button
                  type="text"
                  style={{
                    height: 36,
                    padding: "0 8px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                    border: "1px solid transparent",
                  }}
                  aria-label={`Menu akun ${displayName}`}
                  className="header-profile-btn"
                >
                  <Avatar
                    size={24}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: "#1F99CB",
                      flexShrink: 0,
                    }}
                  />
                  {!isMobile && (
                    <Flex vertical align="start" style={{ minWidth: 0 }}>
                      <Text
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          lineHeight: 1.2,
                          color: "#262626",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          maxWidth: "120px",
                        }}
                      >
                        {displayName || "Admin"}
                      </Text>
                      <Text
                        style={{
                          fontSize: "11px",
                          color: "#8c8c8c",
                          lineHeight: 1.2,
                        }}
                      >
                        Administrator
                      </Text>
                    </Flex>
                  )}
                  <DownOutlined
                    style={{
                      fontSize: "12px",
                      color: "#8c8c8c",
                      transition: "transform 0.2s",
                    }}
                  />
                </Button>
              </Dropdown>
            </Flex>
          </Flex>
        </Header>

        <Content
          style={{
            minHeight: "calc(100vh - 48px)",
            overflow: "auto",
            minWidth: 0,
            backgroundColor: "white",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;

// Add custom styles
const styles = `
  .header-menu-btn:hover {
    background-color: #f5f5f5 !important;
  }
  
  .header-help-btn:hover {
    background-color: #e6f7ff !important;
    color: #1890ff !important;
  }
  
  .header-profile-btn:hover {
    background-color: #f5f5f5 !important;
    border-color: #d9d9d9 !important;
  }
  
  .header-profile-btn:hover .anticon-down {
    transform: rotate(180deg);
  }
  
  @media (max-width: 768px) {
    .header-profile-btn {
      padding: 0 8px !important;
    }
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
