import { useAuthStore } from "../../../../stores/authStore";
import { validateFieldsAndFocus } from "../../../../components/common/Responsive/validate-fields";
import { ResponsiveDialog as Modal } from "../../../../components/common/Responsive/ResponsiveDialog";
import { useRequest } from "ahooks";
import { Alert, Form, Input } from "antd";
import { putProfileAuth } from "../../../../api/services/member";

export type EditAuthMode = "email" | "password";

type EditAuthDataModalProps = {
  mode: EditAuthMode | null;
  close: () => void;
  id: string;
  currentEmail?: string;
  refresh: () => void;
};

export default function EditAuthDataModal({
  mode,
  close,
  id,
  currentEmail,
  refresh,
}: EditAuthDataModalProps) {
  const { runAsync, loading } = useRequest(putProfileAuth, { manual: true });
  const [form] = Form.useForm<{ email?: string; password?: string }>();
  const isEmail = mode === "email";

  const cancel = () => {
    form.resetFields();
    close();
  };

  return (
    <Modal
      title={isEmail ? "Ubah email" : "Ubah kata sandi"}
      open={mode !== null}
      confirmLoading={loading}
      okText={isEmail ? "Ubah email" : "Ubah kata sandi"}
      okButtonProps={{ danger: isEmail }}
      cancelText="Batal"
      destroyOnHidden
      onOk={async () => {
        const data = await validateFieldsAndFocus(form);
        if (
          !data ||
          !useAuthStore
            .getState()
            .permissions.includes("members.credentials.manage")
        )
          return;
        const body = isEmail
          ? { email: data.email?.trim().toLowerCase() }
          : { password: data.password };
        if (await runAsync(id, body)) {
          cancel();
          refresh();
        }
      }}
      onCancel={cancel}
    >
      {isEmail && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          title="Perubahan email langsung berlaku"
          description={
            <>
              Anggota harus masuk dengan email baru, dan tidak ada email
              pemberitahuan yang dikirim. Jika email lama dipakai untuk masuk
              dengan Google, masuk dengan Google memakai email lama akan membuat
              akun baru yang terpisah.
            </>
          }
        />
      )}
      <Form
        scrollToFirstError={{ focus: true }}
        layout="vertical"
        form={form}
        initialValues={{ email: currentEmail }}
        preserve={false}
      >
        {isEmail ? (
          <Form.Item
            label="Email baru"
            name="email"
            normalize={(value?: string) => value?.trim()}
            rules={[
              { required: true, message: "Email wajib diisi" },
              { type: "email", message: "Format email tidak valid" },
              {
                validator: (_, value?: string) =>
                  value?.trim().toLowerCase() === currentEmail?.toLowerCase()
                    ? Promise.reject(
                        new Error("Email baru sama dengan email sekarang"),
                      )
                    : Promise.resolve(),
              },
            ]}
          >
            <Input placeholder="nama@contoh.com" autoComplete="off" />
          </Form.Item>
        ) : (
          <Form.Item
            label="Kata sandi baru"
            name="password"
            rules={[{ required: true, message: "Kata sandi wajib diisi" }]}
          >
            <Input.Password
              placeholder="Kata sandi baru"
              autoComplete="new-password"
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
