import { validateFieldsAndFocus } from "../../../../../components/common/Responsive/validate-fields";
import { ResponsiveDialog as Modal } from "../../../../../components/common/Responsive/ResponsiveDialog";
import { Alert, Form, Input, Switch } from "antd";
import { putAdminUser } from "../../../../../api/services/adminuser";
import { getRoles } from "../../../../../api/services/access";
import { useRequest } from "ahooks";
import { useEffect, useState, type ReactElement } from "react";
import { AdminUser } from "../../../../../types/model/adminuser";
import RoleAssignmentFields from "../RoleAssignmentFields";
import { assignedRoles } from "../../../../../utils/admin-roles";
import { actionError } from "../../../../../utils/action-error";
import { useUser } from "../../../../../stores/authStore";
import { refreshSessionProfile } from "../../../../../api/axios";

type EditAdminUserProps = {
  data: AdminUser | undefined;
  setData: (state: AdminUser | undefined) => void;
  refresh: () => void;
};

export default function EditAdminUser({
  data,
  setData,
  refresh,
}: EditAdminUserProps): ReactElement {
  const { runAsync, loading } = useRequest(putAdminUser, { manual: true });
  const {
    data: roles = [],
    loading: rolesLoading,
    error: rolesError,
    refresh: retryRoles,
  } = useRequest(getRoles, { ready: !!data });
  const [failure, setFailure] = useState("");
  const user = useUser();
  const [form] = Form.useForm<{
    displayName: string;
    isActive?: boolean;
    role_codes: string[];
  }>();

  useEffect(() => {
    setFailure("");
    if (data) {
      form.setFieldsValue({
        displayName: data.display_name || "",
        isActive: data.is_active,
        role_codes:
          data.role_codes ?? assignedRoles(data).map((role) => role.code),
      });
      return;
    }

    form.resetFields();
  }, [data, form]);

  return (
    <Modal
      title="Ubah Akun Admin"
      open={!!data}
      confirmLoading={loading}
      okText="Simpan perubahan"
      cancelText="Batal"
      okButtonProps={{ disabled: rolesLoading || !!rolesError }}
      cancelButtonProps={{ disabled: loading }}
      closable={!loading}
      keyboard={!loading}
      maskClosable={false}
      onOk={async () => {
        if (data && !loading && !rolesLoading && !rolesError) {
          try {
            const values = await validateFieldsAndFocus(form);
            await runAsync({
              id: String(data.id),
              data: {
                displayName: values.displayName.trim(),
                isActive: values.isActive,
                role_codes: values.role_codes ?? [],
              },
            });
            if (data.id === user?.id) {
              try {
                await refreshSessionProfile();
              } catch {
                setFailure(
                  "Perubahan sudah tersimpan, tetapi akses Anda belum berhasil diperbarui. Muat ulang halaman sebelum melanjutkan.",
                );
                refresh();
                return;
              }
            }
            refresh();
            form.resetFields();
            setData(undefined);
          } catch (cause) {
            if (
              typeof cause === "object" &&
              cause !== null &&
              "errorFields" in cause
            )
              return;
            setFailure(actionError(cause));
          }
        }
      }}
      onCancel={() => {
        if (loading) return;
        form.resetFields();
        setData(undefined);
      }}
    >
      {failure && (
        <Alert
          role="alert"
          type="error"
          title={failure}
          style={{ marginBottom: 16 }}
        />
      )}
      <Form
        name="edit-admin-user"
        scrollToFirstError={{ focus: true }}
        form={form}
        layout="vertical"
        disabled={loading}
      >
        <Form.Item
          label="Nama"
          name="displayName"
          rules={[
            { required: true, whitespace: true, message: "Masukkan nama" },
            { max: 255, message: "Nama maksimal 255 karakter" },
          ]}
        >
          <Input maxLength={255} autoComplete="name" />
        </Form.Item>
        <RoleAssignmentFields
          roles={roles}
          loading={rolesLoading}
          error={rolesError}
          retry={retryRoles}
          originalCodes={
            data
              ? (data.role_codes ??
                assignedRoles(data).map((role) => role.code))
              : []
          }
          self={data?.id === user?.id}
        />
        <Form.Item label="Status Akun" name="isActive" valuePropName="checked">
          <Switch
            disabled={loading || data?.id === user?.id}
            checkedChildren="Aktif"
            unCheckedChildren="Nonaktif"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
