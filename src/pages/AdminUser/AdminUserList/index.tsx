import { Flex, Tabs, TabsProps } from "antd";
import useUrlState from "@ahooksjs/use-url-state";

import AdminUserTable from "./components/AdminUserTable";
import RolesTable from "./components/RolesTable";
import PermissionsTable from "./components/PermissionsTable";

export default function AdminUserList() {
  const [state, setState] = useUrlState({ tab: "1" });

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Akun",
      children: <AdminUserTable />,
    },
    {
      key: "2",
      label: "Role",
      children: <RolesTable />,
    },

    {
      key: "3",
      label: "Permission",
      children: <PermissionsTable />,
    },
  ];

  return (
    <Flex vertical gap="middle">
      <Tabs
        activeKey={state.tab}
        onTabClick={(key) => setState({ tab: key })}
        tabPosition="top"
        items={items}
      />
    </Flex>
  );
}
