import { Flex } from "antd";

import AdminUserTable from "./components/AdminUserTable";

export default function AdminUserList() {

  return (
    <Flex vertical gap="middle">
      <AdminUserTable />
    </Flex>
  );
}
