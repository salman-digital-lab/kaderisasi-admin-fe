import { Alert, Button, Collapse, Form, Select, Typography } from "antd";
import type { ReactElement } from "react";
import type { RbacRole } from "../../../../types/model/access";
import RoleCapabilitiesTable from "../../../AccessRequests/components/RoleCapabilitiesTable";
import { mergedPermissions } from "../../../../utils/admin-roles";

type Props = {
  roles: RbacRole[];
  loading: boolean;
  error?: Error;
  retry: () => void;
  originalCodes?: string[];
  self?: boolean;
};

export default function RoleAssignmentFields({
  roles,
  loading,
  error,
  retry,
  originalCodes = [],
  self = false,
}: Props): ReactElement {
  const form = Form.useFormInstance();
  const codes: string[] = Form.useWatch("role_codes", form) ?? [];
  const active: boolean | undefined = Form.useWatch("isActive", form);
  const permissions = mergedPermissions(codes, roles);
  const removed = originalCodes.filter((code) => !codes.includes(code));
  return (
    <>
      <Form.Item
        name="role_codes"
        label="Peran"
        extra="Pilih satu atau beberapa peran. Hak akses dari seluruh peran digabungkan."
      >
        <Select
          mode="multiple"
          allowClear
          showSearch={{ optionFilterProp: "label" }}
          loading={loading}
          disabled={loading || !!error}
          placeholder="Pilih peran admin"
          options={roles.map((role) => ({
            value: role.code,
            label: role.name,
          }))}
        />
      </Form.Item>
      {error && (
        <Alert
          type="error"
          title="Daftar peran belum berhasil dimuat"
          action={<Button onClick={retry}>Coba lagi</Button>}
        />
      )}
      {!!removed.length && (
        <Alert
          type="warning"
          showIcon
          title={`Peran yang akan dilepas: ${removed.map((code) => roles.find((role) => role.code === code)?.name ?? code).join(", ")}`}
          description="Hak akses yang juga diberikan oleh peran lain yang dipilih tetap tersedia."
          style={{ marginBottom: 16 }}
        />
      )}
      {self &&
        originalCodes.includes("super_admin") &&
        !codes.includes("super_admin") && (
          <Alert
            type="warning"
            title="Anda akan kehilangan akses pengelolaan akun admin"
            description="Perubahan hanya dapat disimpan jika masih ada Super Admin aktif lainnya."
            style={{ marginBottom: 16 }}
          />
        )}
      {!codes.length ? (
        <Alert
          type="info"
          title="Tanpa peran, akun tidak memiliki akses fitur"
          description="Pemilik akun tetap dapat masuk dan mengajukan akses."
        />
      ) : (
        !error &&
        !loading && (
          <Collapse
            items={[
              {
                key: "permissions",
                label: `Gabungan hak akses (${permissions.length})`,
                children: <RoleCapabilitiesTable permissions={permissions} />,
              },
            ]}
          />
        )
      )}
      {active === false && (
        <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
          Akun nonaktif tidak dapat masuk atau menggunakan hak akses. Peran yang
          dipilih tetap tersimpan.
        </Typography.Paragraph>
      )}
    </>
  );
}
