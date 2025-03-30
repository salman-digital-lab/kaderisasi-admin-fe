import { Card, Table } from "antd";

import { TABLE_SCHEMA } from "../constants/schema";
import EditAdminUser from "./modal/EditAdminUser";
import { AdminUser } from "../../../../types/model/adminuser";
import { Pagination } from "../../../../types/services/base";
import { useState } from "react";
import EditPasswordAdminUser from "./modal/EditPasswordAdminUser";

interface AdminUserTableProps {
  data:
    | {
        meta: Pagination;
        data: AdminUser[];
      }
    | undefined;
  loading: boolean;
  setAdminUserParam: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      name: string;
    }>
  >;
}

const AdminUserTable = ({
  data,
  loading,
  setAdminUserParam,
}: AdminUserTableProps) => {
  const [editedRow, setEditedRow] = useState<AdminUser | undefined>();
  const [passwordRow, setPasswordRow] = useState<AdminUser | undefined>();


  return (
    <Card>
      <EditAdminUser data={editedRow} setData={setEditedRow} />
      <EditPasswordAdminUser data={passwordRow} setData={setPasswordRow} />
      <Table
        rowKey="id"
        columns={TABLE_SCHEMA(setEditedRow, setPasswordRow)}
        dataSource={data?.data}
        pagination={{
          current: data?.meta.current_page,
          pageSize: data?.meta.per_page,
          showSizeChanger: true,
          total: data?.meta.total,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
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
