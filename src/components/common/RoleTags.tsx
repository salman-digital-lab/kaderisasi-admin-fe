import { Space, Tag, Typography } from "antd";
import type { ReactElement } from "react";
import type { AssignedRole } from "../../types/services/auth";

export default function RoleTags({
  roles,
}: {
  roles: AssignedRole[];
}): ReactElement {
  if (!roles.length)
    return (
      <Typography.Text type="secondary">Belum memiliki peran</Typography.Text>
    );
  return (
    <Space size={[4, 4]} wrap>
      {roles.map((role) => (
        <Tag
          key={role.code}
          color="blue"
          style={{ margin: 0, whiteSpace: "normal" }}
        >
          {role.name}
        </Tag>
      ))}
    </Space>
  );
}
