import { useEffect, useState } from "react";
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  Layout,
  Button,
  theme,
  Typography,
  Dropdown,
  Space,
  MenuProps,
  message,
  Flex,
} from "antd";
import SideMenu from "./SideMenu";
import { Outlet } from "react-router-dom";
import { logout } from "../../api/auth";
import { useNavigate } from "react-router-dom";

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
  const [displayName, setDisplayName] = useState<string>("");

  const navigate = useNavigate();

  const handleMenuClick: MenuProps["onClick"] = async (e) => {
    if (e.key === "2") {
      try {
        await logout();
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

  useEffect(() => {
    const user = localStorage.getItem("user");

    const parseData = JSON.parse(user || "{}");

    setDisplayName(parseData?.user?.display_name || "");
  }, []);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleCollapse = (collapsed: boolean) => {
    setCollapsed(collapsed);
  };

  return (
    <Layout>
      <SideMenu collapsed={collapsed} onCollapse={handleCollapse} />
      <Layout
        style={{ marginLeft: collapsed ? 80 : 200, transition: "margin 0.2s" }}
      >
        <Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            padding: 0,
            background: colorBgContainer,
          }}
        >
          <Flex justify="space-between" align="center">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 64,
                height: 64,
              }}
            />
            <Space>
              <Button
                type="text"
                icon={<QuestionCircleOutlined />}
                href="https://chat.whatsapp.com/G4qpf2oFwtBJjaQb5YwDiV"
                target="_blank"
                style={{
                  fontSize: "16px",
                  width: 64,
                  height: 64,
                }}
              />
              <Dropdown menu={menuProps}>
                <Button size="large" style={{ marginRight: 24 }}>
                  <Space>
                    <Text>Hello, {displayName}</Text>
                    <DownOutlined />
                  </Space>
                </Button>
              </Dropdown>
            </Space>
          </Flex>
        </Header>

        <Content
          style={{
            padding: 24,
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
