import { Card, Table } from "antd";

import { TABLE_SCHEMA } from "../constants/schema";
import EditAdminUser from "./modal/EditAdminUser";
import { AdminUser } from "../../../../types/model/adminuser";
import { Pagination } from "../../../../types/services/base";

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
  setEditedRow: React.Dispatch<React.SetStateAction<AdminUser | undefined>>;
  editedRow: AdminUser | undefined;
}

const AdminUserTable = ({
  data,
  loading,
  setAdminUserParam,
  setEditedRow,
  editedRow,
}: AdminUserTableProps) => {
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
