import { Button, Space, TableProps, Tag } from "antd";
import { AdminUser } from "../../../../types/model/adminuser";

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
    title: "Akses",
    render: (_, record) => (
      <Space wrap>
        <Tag color={record.role ? "blue" : "default"}>
          {record.role?.name ?? "Roleless"}
        </Tag>
      </Space>
    ),
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
    title: "",
    dataIndex: "id",
    render: (_, record) => (
      <Space>
        <Button onClick={() => setEdittedRow(record)}>Ubah Akun</Button>
        <Button onClick={() => setPasswordRow(record)}>Ubah Password</Button>
      </Space>
    ),
  },
];
