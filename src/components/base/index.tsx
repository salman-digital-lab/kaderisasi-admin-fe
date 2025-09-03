import { useEffect, useState } from "react";
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  DownOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Layout,
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
import { Outlet } from "react-router-dom";
import { logout } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import { useUser, useClearAuth } from "../../stores/authStore";

const { Header, Content } = Layout;
const { Text } = Typography;

const items: MenuProps["items"] = [
  {
    label: (
      <a
        href="https://docs.google.com/presentation/d/1zMyotxV5g0kMH42ak_FqZriUmG9UitNErM57wnNx5S8/edit?usp=sharing"
        target="_blank"
        rel="noopener noreferrer"
      >
        Panduan Penggunaan
      </a>
    ),
    key: "1",
    icon: <ReadOutlined />,
  },
  {
    label: "Logout",
    key: "2",
    icon: <LogoutOutlined />,
  },
];

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const user = useUser();
  const clearAuth = useClearAuth();
  const navigate = useNavigate();
  
  const displayName = user?.display_name || "Admin";

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && !collapsed) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [collapsed]);

  const handleMenuClick: MenuProps["onClick"] = async (e) => {
    if (e.key === "2") {
      try {
        await logout();
        // Clear auth state when user logs out
        clearAuth();
        message.success("Logout successful");
        navigate("/login");
      } catch (error) {
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
      <SideMenu collapsed={collapsed} onCollapse={handleCollapse} />
      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 200,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
        }}
      >
        {/* Mobile overlay */}
        {isMobile && !collapsed && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              zIndex: 999,
            }}
            onClick={() => setCollapsed(true)}
          />
        )}

        <Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
                          padding: "0 16px",
              background: colorBgContainer,
              borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Flex
            justify="space-between"
            align="center"
            style={{ height: "64px" }}
          >
            <Flex align="center" gap={16}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: "16px",
                  width: 48,
                  height: 48,
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
            </Flex>

            <Flex align="center" gap={8}>
              <Badge dot={false}>
                <Button
                  type="text"
                  icon={<QuestionCircleOutlined />}
                  href="https://chat.whatsapp.com/G4qpf2oFwtBJjaQb5YwDiV"
                  target="_blank"
                  style={{
                    fontSize: "16px",
                    width: 40,
                    height: 40,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                  className="header-help-btn"
                  title="Bantuan & Dukungan"
                />
              </Badge>

              <Dropdown
                menu={menuProps}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button
                  type="text"
                  style={{
                    height: 48,
                    padding: "0 12px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                    border: "1px solid transparent",
                  }}
                  className="header-profile-btn"
                >
                  <Avatar
                    size={32}
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
                          fontSize: "14px",
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
                          fontSize: "12px",
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
            padding: isMobile ? 16 : 24,
            minHeight: "calc(100vh - 64px)",
            backgroundColor: "#fafafa",
            overflow: "auto",
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
