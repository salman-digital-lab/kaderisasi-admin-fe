import { Flex } from "antd";

import AdminUserTable from "./components/AdminUserTable";
import { getAdminUsers } from "../../../api/services/adminuser";
import { useRequest } from "ahooks";
import { useState } from "react";
import { AdminUser } from "../../../types/model/adminuser";
import AdminUserFilter from "./components/AdminUserFilter";

export default function AdminUserList() {
  const [adminUserParam, setAdminUserParam] = useState({
    page: 1,
    per_page: 10,
    name: "",
  });

  const [editedRow, setEditedRow] = useState<AdminUser | undefined>();

  const { data, loading } = useRequest(
    () =>
      getAdminUsers({
        per_page: String(adminUserParam.per_page),
        page: String(adminUserParam.page),
        search: adminUserParam.name,
      }),
    {
      refreshDeps: [adminUserParam],
    },
  );
  return (
    <Flex vertical gap="middle">
      <AdminUserFilter setParameter={setAdminUserParam} />
      <AdminUserTable
        data={data}
        loading={loading}
        setAdminUserParam={setAdminUserParam}
        setEditedRow={setEditedRow}
        editedRow={editedRow}
      />
    </Flex>
  );
}
