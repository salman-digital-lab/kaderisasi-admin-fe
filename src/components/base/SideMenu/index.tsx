import { Layout, Menu } from "antd";

import { menuItems } from "./data";
import { SidebarProps } from "../../../types";
import logo from "../../../assets/images/BMKALogo.png";

const { Sider } = Layout;

const SideMenu = ({ collapsed, onCollapse }: SidebarProps) => {
  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      {!collapsed && <img width="auto" height={100} src={logo} />}

      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={["1"]}
        items={menuItems}
      />
    </Sider>
  );
};

export default SideMenu;
