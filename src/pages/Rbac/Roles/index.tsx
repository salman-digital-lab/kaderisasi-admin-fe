import { useRequest } from "ahooks";
import { Alert, Card, Space, Table, Tag, Typography } from "antd";
import { getRoles } from "../../../api/services/access";
import type { RbacRole } from "../../../types/model/access";
import type { ReactElement } from "react";

export default function RbacRolesPage(): ReactElement {
  const { data: roles = [], loading, error } = useRequest(getRoles);

  return (
    <div style={{ padding: 12 }}>
      <Card
        size="small"
        title={
          <div style={{ whiteSpace: "normal", paddingBlock: 8 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Role & Permission
            </Typography.Title>
            <Typography.Text type="secondary">
              Lihat akses setiap role. Penetapan role dilakukan melalui Akun
              Admin.
            </Typography.Text>
          </div>
        }
      >
        {error && (
          <Alert type="error" title="Daftar role gagal dimuat" showIcon />
        )}
        <Table<RbacRole>
          rowKey="code"
          loading={loading}
          dataSource={roles}
          scroll={{ x: 1050 }}
          pagination={false}
          expandable={{
            expandedRowRender: (role) => (
              <Space wrap>
                {role.permissions.map((permission) => (
                  <Tag key={permission}>{permission}</Tag>
                ))}
              </Space>
            ),
          }}
          columns={[
            {
              title: "Role",
              width: 230,
              render: (_, role) => (
                <Space orientation="vertical" size={0}>
                  <Typography.Text strong>{role.name}</Typography.Text>
                  <Typography.Text code>{role.code}</Typography.Text>
                </Space>
              ),
            },
            { title: "Akses", dataIndex: "description", width: 420 },
            {
              title: "Permintaan Akses",
              width: 220,
              render: (_, role) => (
                <Tag color={role.is_requestable ? "blue" : "default"}>
                  {role.is_requestable
                    ? "Dapat diminta"
                    : "Penetapan Super Admin"}
                </Tag>
              ),
            },
            {
              title: "Permission",
              render: (_, role) => role.permissions.length,
            },
          ]}
        />
      </Card>
    </div>
  );
}
