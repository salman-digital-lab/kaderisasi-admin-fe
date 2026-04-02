import { useRequest } from "ahooks";
import { Form, Input, Modal } from "antd";
import { generateAccount } from "../../../../api/services/member";

type GenerateAccountModalProps = {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
  userId: string;
  refresh: () => void;
};

export default function GenerateAccountModal({
  isOpen,
  setIsOpen,
  userId,
  refresh,
}: GenerateAccountModalProps) {
  const { runAsync, loading } = useRequest(generateAccount, { manual: true });

  const [form] = Form.useForm<{
    email: string;
    password: string;
  }>();

  return (
    <Modal
      title="Buat Akun"
      open={isOpen}
      confirmLoading={loading}
      okText="Buat Akun"
      cancelText="Batal"
      onOk={async () => {
        const data = await form.validateFields();
        if (data) {
          await runAsync(userId, data);
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
          rules={[
            { required: true, message: "Email tidak boleh kosong" },
            { type: "email", message: "Format email tidak valid" },
          ]}
        >
          <Input placeholder="Email" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: "Password tidak boleh kosong" },
            { min: 8, message: "Password minimal 8 karakter" },
          ]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
