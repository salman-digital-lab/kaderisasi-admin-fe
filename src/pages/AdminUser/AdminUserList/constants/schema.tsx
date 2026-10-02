import { Button, Space, TableProps, Tag } from "antd";
import { AdminUser } from "../../../../types/model/adminuser";
import RoleTags from "../../../../components/common/RoleTags";
import { assignedRoles } from "../../../../utils/admin-roles";

export const TABLE_SCHEMA = (
  setEdittedRow: (val: AdminUser | undefined) => void,
  setPasswordRow: (val: AdminUser | undefined) => void,
  isSuperAdmin: boolean,
  viewTalentResult: (id: number) => void,
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
    title: "Aksi",
    key: "actions",
    dataIndex: "id",
    render: (_, record) => (
      <Space>
        <Button onClick={() => setEdittedRow(record)}>Ubah akun</Button>
        <Button onClick={() => setPasswordRow(record)}>Ubah kata sandi</Button>
        {isSuperAdmin && record.talent_assessment_completed && (
          <Button onClick={() => viewTalentResult(record.id)}>
            Lihat hasil bakat
          </Button>
        )}
      </Space>
    ),
  },
];
