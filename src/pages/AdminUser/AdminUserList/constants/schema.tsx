import { Button, Space, TableProps } from "antd";
import { AdminUser } from "../../../../types/model/adminuser";
import { renderAdminRole } from "../../../../constants/render";

export const TABLE_SCHEMA = (
  setEdittedRow: (val: AdminUser | undefined) => void,
  setPasswordRow: (val: AdminUser | undefined) => void,
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
          <Button onClick={() => setEdittedRow(record)}>Ubah Role</Button>
          <Button onClick={() => setPasswordRow(record)}>Ubah Password</Button>
        </Space>
      ),
    },
  ];
