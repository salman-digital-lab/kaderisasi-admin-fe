import { useRequest } from "ahooks";
import { Form, Input, Modal } from "antd";
import { putProfileAuth } from "../../../../api/services/member";

type EditAuthDataModalProps = {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
  id: string;
  refresh: () => void;
};

export default function EditAuthDataModal({
  isOpen,
  setIsOpen,
  id,
  refresh,
}: EditAuthDataModalProps) {
  const { runAsync, loading } = useRequest(putProfileAuth, { manual: true });

  const [form] = Form.useForm<{
    email?: string;
    password?: string;
  }>();

  return (
    <Modal
      title="Ubah Email dan Password"
      open={isOpen}
      confirmLoading={loading}
      okText="Ubah"
      cancelText="Batal"
      onOk={async () => {
        const data = await form.validateFields();
        if (data) {
          await runAsync(id, data);
          form.resetFields();
          setIsOpen(false);
          refresh();
        }
      }}
      onCancel={() => {
        form.resetFields();
        setIsOpen(false);
      }}
    >
      <Form layout="vertical" form={form}>
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
