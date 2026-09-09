import { useRequest } from "ahooks";
import { Form, Input, Modal } from "antd";

import { postAdminUser } from "../../../../../api/services/adminuser";

type AddAdminUserProps = {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
};

export default function AddAdminUser({ isOpen, setIsOpen }: AddAdminUserProps) {
  const { runAsync, loading } = useRequest(postAdminUser, { manual: true });

  const [form] = Form.useForm<{
    displayName?: string;
    email?: string;
    password?: string;
  }>();

  return (
    <Modal
      title="Tambah Akun Admin"
      open={isOpen}
      confirmLoading={loading}
      okText="Tambah"
      cancelText="Batal"
      onOk={async () => {
        const data = await form.validateFields();
        if (data) {
          await runAsync(data);
          form.resetFields();
          setIsOpen(false);
        }
      }}
      onCancel={() => {
        form.resetFields();
        setIsOpen(false);
      }}
    >
      <Form layout="vertical" form={form}>
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
          <Input placeholder="Password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
