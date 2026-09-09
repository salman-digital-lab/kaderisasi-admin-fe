import { Table, Space, Tag } from "antd";
import type { ReactElement } from "react";
import { permissionLabels } from "./permission-labels";

const modules: Record<string, string> = {
  dashboard: "Dasbor",
  members: "Anggota",
  activities: "Kegiatan",
  activity_registrations: "Pendaftaran Kegiatan",
  counseling: "Ruang Curhat",
  achievements: "Prestasi",
  leaderboards: "Peringkat",
  clubs: "Klub",
  club_registrations: "Pendaftaran Klub",
  custom_forms: "Formulir Digital",
  certificate: "Sertifikat",
  reference_data: "Data Referensi",
  admin_users: "Akun Admin",
  rbac: "Peran & Hak Akses",
  tickets: "Tiket",
};

export default function RoleCapabilitiesTable({
  permissions,
}: {
  permissions: string[];
}): ReactElement {
  const groups = new Map<string, string[]>();
  for (const permission of permissions) {
    const module = permission.split(".")[0];
    groups.set(module, [...(groups.get(module) ?? []), permission]);
  }
  return (
    <Table
      size="small"
      bordered
      pagination={false}
      rowKey="module"
      scroll={{ x: 520 }}
      dataSource={[...groups].map(([module, capabilities]) => ({
        module,
        capabilities,
      }))}
      columns={[
        {
          title: "Modul",
          dataIndex: "module",
          width: 190,
          render: (module: string) => modules[module] ?? "Lainnya",
        },
        {
          title: "Hak Akses",
          dataIndex: "capabilities",
          render: (capabilities: string[]) => (
            <Space size={[4, 4]} wrap>
              {capabilities.map((permission) => (
                <Tag
                  key={permission}
                  style={{ margin: 0, whiteSpace: "normal" }}
                >
                  {permissionLabels[permission] ?? "Kemampuan tambahan"}
                </Tag>
              ))}
            </Space>
          ),
        },
      ]}
    />
  );
}
