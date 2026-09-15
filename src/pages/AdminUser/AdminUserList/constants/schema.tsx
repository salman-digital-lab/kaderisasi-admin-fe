import { Button, Space, TableProps, Tag } from "antd";
import { AdminUser } from "../../../../types/model/adminuser";
import RoleTags from "../../../../components/common/RoleTags";
import { assignedRoles } from "../../../../utils/admin-roles";

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
    title: "Peran",
    render: (_, record) => <RoleTags roles={assignedRoles(record)} />,
  },
  {
    title: "Status",
    dataIndex: "is_active",
    render: (_, record) => (
      <Tag color={record.is_active ? "success" : "default"}>
        {record.is_active ? "Aktif" : "Nonaktif"}
      </Tag>
    ),
  },
  {
    title: "Tindakan",
    key: "actions",
    dataIndex: "id",
    render: (_, record) => (
      <Space>
        <Button onClick={() => setEdittedRow(record)}>Ubah Akun</Button>
        <Button onClick={() => setPasswordRow(record)}>Ubah Password</Button>
      </Space>
    ),
  },
];
