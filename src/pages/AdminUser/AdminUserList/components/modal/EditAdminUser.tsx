import { Form, Modal, Select, Switch } from "antd";
import { putAdminUser } from "../../../../../api/services/adminuser";
import { getRoles } from "../../../../../api/services/access";
import { useRequest } from "ahooks";
import { useEffect } from "react";
import { AdminUser } from "../../../../../types/model/adminuser";

type EditAdminUserProps = {
  data: AdminUser | undefined;
  setData: (state: AdminUser | undefined) => void;
  refresh: () => void;
};

export default function EditAdminUser({
  data,
  setData,
  refresh,
}: EditAdminUserProps) {
  const { runAsync, loading } = useRequest(putAdminUser, { manual: true });
  const { data: roles = [] } = useRequest(getRoles);
  const [form] = Form.useForm<{
    isActive?: boolean;
    role_code?: string | null;
  }>();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        isActive: data.is_active,
        role_code: data.role?.code ?? null,
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
      onOk={async () => {
        if (data) {
          const values = await form.validateFields();
          await runAsync({
            id: String(data.id),
            data: {
              isActive: values.isActive,
              role_code: values.role_code ?? null,
            },
          });
          refresh();
          form.resetFields();
          setData(undefined);
        }
      }}
      onCancel={() => {
        form.resetFields();
        setData(undefined);
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Role" name="role_code">
          <Select
            allowClear
            placeholder="Belum memiliki role"
            options={roles.map((role) => ({
              value: role.code,
              label: role.name,
            }))}
          />
        </Form.Item>
        <Form.Item label="Status Akun" name="isActive" valuePropName="checked">
          <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
