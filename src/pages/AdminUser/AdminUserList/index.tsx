import { useState } from "react";
import { useRequest } from "ahooks";

import AdminUserTable from "./components/AdminUserTable";
import { getAdminUsers } from "../../../api/services/adminuser";
import AdminUserFilter from "./components/AdminUserFilter";

export default function AdminUserList() {
  const [adminUserParam, setAdminUserParam] = useState({
    page: 1,
    per_page: 10,
    name: "",
    role_code: "",
    is_active: "",
  });

  const { data, loading, refresh } = useRequest(
    () =>
      getAdminUsers({
        per_page: String(adminUserParam.per_page),
        page: String(adminUserParam.page),
        search: adminUserParam.name,
        role_code: adminUserParam.role_code,
        is_active: adminUserParam.is_active,
      }),
    {
      refreshDeps: [adminUserParam],
    },
  );

  return (
    <div style={{ padding: 12 }}>
      <AdminUserFilter
        setParameter={setAdminUserParam}
        refresh={refresh}
        loading={loading}
      />
      <div style={{ marginTop: 12 }}>
        <AdminUserTable
          data={data}
          loading={loading}
          setAdminUserParam={setAdminUserParam}
          refresh={refresh}
        />
      </div>
    </div>
  );
}
