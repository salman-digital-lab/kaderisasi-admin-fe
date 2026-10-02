import { useAuthStore } from "../../../../stores/authStore";
import { validateFieldsAndFocus } from "../../../../components/common/Responsive/validate-fields";
import { ResponsiveDialog as Modal } from "../../../../components/common/Responsive/ResponsiveDialog";
import { useRequest } from "ahooks";
import { Form, Input } from "antd";
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
      okText="Buat akun"
      cancelText="Batal"
      onOk={async () => {
        const data = await validateFieldsAndFocus(form);
        if (
          data &&
          useAuthStore
            .getState()
            .permissions.includes("members.credentials.manage")
        ) {
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
      <Form scrollToFirstError={{ focus: true }} layout="vertical" form={form}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Email wajib diisi" },
            { type: "email", message: "Format email tidak valid" },
          ]}
        >
          <Input placeholder="Email" />
        </Form.Item>
        <Form.Item
          label="Kata sandi"
          name="password"
          rules={[
            { required: true, message: "Kata sandi wajib diisi" },
            { min: 8, message: "Kata sandi minimal 8 karakter" },
          ]}
        >
          <Input.Password placeholder="Kata sandi" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
