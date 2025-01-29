import { Button, Space, TableProps } from "antd";
import { AdminUser, Role } from "../../../../types/model/adminuser";
import { renderAdminRole } from "../../../../constants/render";

export const TABLE_SCHEMA = (
  setEdittedRow: (val: AdminUser | undefined) => void,
): TableProps<AdminUser>["columns"] => [
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Nama",
      dataIndex: "display_name",
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (_, record) => renderAdminRole(record.role),
    },
    {
      title: "",
      dataIndex: "id",
      render: (_, record) => (
        <Space>
          <Button onClick={() => setEdittedRow(record)}>Ubah</Button>
        </Space>
      ),
    },
  ];

export const TABLE_SCHEMA_ROLES: TableProps<Role>["columns"] = [
  {
    title: "Id",
    dataIndex: "id",
  },
  {
    title: "Nama",
    dataIndex: "role_name",
  },
];
