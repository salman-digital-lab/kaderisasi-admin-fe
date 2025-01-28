import { useState } from "react";
import { Card, Table } from "antd";

import { TABLE_SCHEMA } from "../constants/schema";
import { useRequest } from "ahooks";
import { getAdminUsers } from "../../../../api/services/adminuser";
import EditAdminUser from "./modal/EditAdminUser";
import { AdminUser } from "../../../../types/model/adminuser";

const AdminUserTable = () => {
  const [adminUserParam, setAdminUserParam] = useState({
    page: 1,
    per_page: 10,
  });

  const [editedRow, setEditedRow] = useState<AdminUser | undefined>();

  const { data, loading } = useRequest(
    () =>
      getAdminUsers({
        per_page: String(adminUserParam.per_page),
        page: String(adminUserParam.page),
      }),
    {
      refreshDeps: [adminUserParam],
    },
  );

  return (
    <Card>
      <EditAdminUser data={editedRow} setData={setEditedRow} />
      <Table
        rowKey="id"
        columns={TABLE_SCHEMA(setEditedRow)}
        dataSource={data?.data}
        pagination={{
          current: data?.meta.current_page,
          pageSize: data?.meta.per_page,
          showSizeChanger: true,
          total: data?.meta.total,
        }}
        loading={loading}
        onChange={(pagination) =>
          setAdminUserParam((prev) => ({
            ...prev,
            page: pagination.current || 1,
            per_page: pagination.pageSize || 10,
          }))
        }
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};

export default AdminUserTable;
