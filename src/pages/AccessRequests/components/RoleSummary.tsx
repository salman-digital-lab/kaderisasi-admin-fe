import { Alert, Collapse, Typography } from "antd";
import type { ReactElement } from "react";
import type { RbacRole } from "../../../types/model/access";
import RoleCapabilitiesTable from "./RoleCapabilitiesTable";

export default function RoleSummary({
  role,
}: {
  role: RbacRole;
}): ReactElement {
  return (
    <div>
      <Typography.Title level={3}>{role.name}</Typography.Title>
      <p>{role.description}</p>
      {!!role.capabilities?.length && (
        <ul>
          {role.capabilities.slice(0, 3).map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>
      )}
      {role.limitation && (
        <Alert
          type="info"
          showIcon
          title={role.limitation}
          style={{ marginBottom: 16 }}
        />
      )}
      <Collapse
        ghost
        items={[
          {
            key: "permissions",
            label: "Lihat rincian akses",
            children: <RoleCapabilitiesTable permissions={role.permissions} />,
          },
        ]}
      />
    </div>
  );
}
