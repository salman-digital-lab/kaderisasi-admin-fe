import { validateFieldsAndFocus } from "../../../../../components/common/Responsive/validate-fields";
import { ResponsiveDialog as Modal } from "../../../../../components/common/Responsive/ResponsiveDialog";
import { useRequest } from "ahooks";
import { Alert, Form, Input } from "antd";
import { useState, type ReactElement } from "react";
import { getRoles } from "../../../../../api/services/access";
import RoleAssignmentFields from "../RoleAssignmentFields";
import { actionError } from "../../../../../utils/action-error";

import { postAdminUser } from "../../../../../api/services/adminuser";

type AddAdminUserProps = {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
  onCreated?: () => void;
};

export default function AddAdminUser({
  isOpen,
  setIsOpen,
  onCreated,
}: AddAdminUserProps): ReactElement {
  const { runAsync, loading } = useRequest(postAdminUser, { manual: true });
  const {
    data: roles = [],
    loading: rolesLoading,
    error: rolesError,
    refresh: retryRoles,
  } = useRequest(getRoles, { ready: isOpen });
  const [failure, setFailure] = useState("");

  const [form] = Form.useForm<{
    displayName?: string;
    email?: string;
    password?: string;
    role_codes: string[];
  }>();

  return (
    <Modal
      title="Tambah Akun Admin"
      open={isOpen}
      confirmLoading={loading}
      okText="Tambah akun"
      cancelText="Batal"
      okButtonProps={{ disabled: rolesLoading || !!rolesError }}
      cancelButtonProps={{ disabled: loading }}
      closable={!loading}
      keyboard={!loading}
      maskClosable={false}
      onOk={async () => {
        if (loading || rolesLoading || rolesError) return;
        setFailure("");
        try {
          const data = await validateFieldsAndFocus(form);
          if (data) {
            await runAsync({ ...data, role_codes: data.role_codes ?? [] });
            onCreated?.();
            form.resetFields();
            setIsOpen(false);
          }
        } catch (cause) {
          if (
            typeof cause === "object" &&
            cause !== null &&
            "errorFields" in cause
          )
            return;
          setFailure(actionError(cause));
        }
      }}
      onCancel={() => {
        if (loading) return;
        setFailure("");
        form.resetFields();
        setIsOpen(false);
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
        name="add-admin-user"
        scrollToFirstError={{ focus: true }}
        layout="vertical"
        form={form}
        initialValues={{ role_codes: [] }}
        disabled={loading}
      >
        <Form.Item
          label="Nama"
          name="displayName"
          rules={[{ required: true, message: "Nama tidak boleh kosong" }]}
        >
          <Input placeholder="Nama" />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Email tidak boleh kosong" }]}
        >
          <Input placeholder="Email" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Password tidak boleh kosong" }]}
        >
          <Input.Password placeholder="Password" autoComplete="new-password" />
        </Form.Item>
        <RoleAssignmentFields
          roles={roles}
          loading={rolesLoading}
          error={rolesError}
          retry={retryRoles}
        />
      </Form>
    </Modal>
  );
}
