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
  Typography,
  Dropdown,
  MenuProps,
  message,
  Flex,
  Avatar,
} from "antd";
import SideMenu from "./SideMenu";
import { Outlet, useLocation } from "react-router-dom";
import { logout } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import { useUser, useClearAuth, useRoles } from "../../stores/authStore";
import Breadcrumb from "../common/Breadcrumb";
import NotificationBell from "../../features/notifications/NotificationBell";
import { APP_COLORS } from "../../theme/tokens";

const { Header, Content } = Layout;
const { Text } = Typography;

const HELP_URL = "https://chat.whatsapp.com/G4qpf2oFwtBJjaQb5YwDiV";

const items: MenuProps["items"] = [
  { label: "Profil Saya", key: "profile", icon: <UserOutlined /> },
  { type: "divider" },
  { label: "Keluar", key: "logout", icon: <LogoutOutlined />, danger: true },
];

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { compact: isMobile, drawerNavigation } = useAdminViewport();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  const user = useUser();
  const roles = useRoles();
  const clearAuth = useClearAuth();
  const navigate = useNavigate();

  const displayName = user?.display_name || "Admin";
  const roleLabel =
    roles.length === 0
      ? "Belum memiliki peran"
      : roles.length === 1
        ? roles[0].name
        : `${roles[0].name} +${roles.length - 1}`;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search, drawerNavigation]);

  const handleMenuClick: MenuProps["onClick"] = async (e) => {
    if (e.key === "profile") navigate("/profile");
    if (e.key === "logout") {
      try {
        await logout();
        clearAuth();
        message.success("Anda telah keluar");
        navigate("/login");
      } catch {
        message.error("Gagal keluar. Coba lagi.");
      }
    }
  };

  const handleCollapse = (collapsed: boolean) => {
    setCollapsed(collapsed);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {drawerNavigation ? (
        <Drawer
          title="BMKA Admin"
          placement="left"
          size={320}
          styles={{ wrapper: { maxWidth: "90vw" } }}
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
          transition: "margin-left 0.2s",
          position: "relative",
          minWidth: 0,
        }}
      >
        <Header className="admin-header">
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
                className="header-menu-btn"
              />
              {!isMobile && <div className="admin-header-divider" />}
              <Breadcrumb />
            </Flex>

            <Flex align="center" gap={8}>
              <NotificationBell key={user?.id} />
              <Button
                type="text"
                icon={<WhatsAppOutlined />}
                href={HELP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="header-help-btn"
                aria-label={isMobile ? "Bantuan dan dukungan" : undefined}
              >
                {!isMobile && "Bantuan"}
              </Button>

              <Dropdown
                menu={{ items, onClick: handleMenuClick }}
                placement="bottomRight"
                trigger={["click"]}
                open={accountMenuOpen}
                onOpenChange={setAccountMenuOpen}
              >
                <Button
                  type="text"
                  style={{
                    height: 40,
                    padding: "0 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  aria-label={`Menu akun ${displayName}`}
                  aria-expanded={accountMenuOpen}
                  className="header-profile-btn"
                >
                  <Avatar
                    size={24}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: APP_COLORS.primary,
                      flexShrink: 0,
                    }}
                  />
                  {!isMobile && (
                    <Flex vertical align="start" style={{ minWidth: 0 }}>
                      <Text
                        strong
                        ellipsis
                        style={{ fontSize: 13, lineHeight: 1.2, maxWidth: 140 }}
                      >
                        {displayName}
                      </Text>
                      <Text
                        type="secondary"
                        ellipsis
                        style={{ fontSize: 12, lineHeight: 1.2, maxWidth: 140 }}
                      >
                        {roleLabel}
                      </Text>
                    </Flex>
                  )}
                  <DownOutlined />
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
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
