import { Form, Modal, Select, Switch } from "antd";
import { putAdminUser } from "../../../../../api/services/adminuser";
import { useRequest } from "ahooks";
import { useEffect } from "react";
import { AdminUser } from "../../../../../types/model/adminuser";
import { ADMIN_ROLE_OPTIONS } from "../../../../../constants/options";

type EditAdminUserProps = {
  data: AdminUser | undefined;
  setData: (state: AdminUser | undefined) => void;
  refresh: () => void;
};

export default function EditAdminUser({ data, setData, refresh }: EditAdminUserProps) {
  const { runAsync, loading } = useRequest(putAdminUser, { manual: true });
  const [form] = Form.useForm<{
    role?: number;
    isActive?: boolean;
  }>();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        role: data.role,
        isActive: data.is_active,
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
              role: values.role,
              isActive: values.isActive,
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
        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: "Role tidak boleh kosong" }]}
        >
          <Select style={{ width: "100%" }} options={ADMIN_ROLE_OPTIONS} />
        </Form.Item>
        <Form.Item
          label="Status Akun"
          name="isActive"
          valuePropName="checked"
        >
          <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
