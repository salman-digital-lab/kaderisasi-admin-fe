import { ResponsiveTable as Table } from "../../../components/common/Responsive/ResponsiveTable";
import { useRequest } from "ahooks";
import { Alert, Card, Space, Tag, Typography } from "antd";
import { getRoles } from "../../../api/services/access";
import type { RbacRole } from "../../../types/model/access";
import type { ReactElement } from "react";
import RoleSummary from "../../AccessRequests/components/RoleSummary";
import PageHeader from "../../../components/common/PageHeader";
import { NAV_LABELS } from "../../../constants/navigation";

export default function RbacRolesPage(): ReactElement {
  const { data: roles = [], loading, error } = useRequest(getRoles);

  return (
    <div className="page-container">
      <PageHeader
        title={NAV_LABELS.roles}
        description={`Satu akun dapat memiliki beberapa peran. Hak akses dari seluruh peran digabungkan. Tetapkan peran melalui ${NAV_LABELS.adminUsers} atau ajukan peran tambahan melalui ${NAV_LABELS.myRequests}.`}
      />
      <Card size="small">
        {error && (
          <Alert type="error" title="Daftar peran gagal dimuat" showIcon />
        )}
        <Table<RbacRole>
          listId="pages/Rbac/Roles/index:1"
          rowKey="code"
          loading={loading}
          dataSource={roles}
          scroll={{ x: 700 }}
          pagination={false}
          expandable={{
            expandedRowRender: (role) => <RoleSummary role={role} />,
          }}
          columns={[
            {
              title: "Role",
              width: 230,
              render: (_, role) => (
                <Space orientation="vertical" size={0}>
                  <Typography.Text strong>{role.name}</Typography.Text>
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
          ]}
        />
      </Card>
    </div>
  );
}
