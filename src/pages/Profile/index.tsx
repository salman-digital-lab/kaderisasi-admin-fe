import { useState, type ReactElement } from "react";
import { Alert, Button, Card, Form, Input, Typography, message } from "antd";
import { updateProfile } from "../../api/services/profile";
import { useSetSession, useUser } from "../../stores/authStore";

export default function ProfilePage(): ReactElement {
  const user = useUser();
  const setSession = useSetSession();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const save = async (values: { displayName: string }): Promise<void> => {
    setSaving(true);
    setFailed(false);
    try {
      setSession(await updateProfile(values.displayName.trim()));
      message.success("Nama berhasil diperbarui");
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div style={{ padding: 12 }}>
      <Typography.Title level={4}>Profil Saya</Typography.Title>
      <Card style={{ maxWidth: 640 }}>
        {failed && (
          <Alert
            type="error"
            showIcon
            title="Nama belum tersimpan. Silakan coba lagi."
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          layout="vertical"
          initialValues={{ displayName: user?.display_name || "" }}
          onFinish={save}
          disabled={saving}
        >
          <Form.Item label="Email">
            <Input value={user?.email || ""} readOnly />
          </Form.Item>
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
          <Button type="primary" htmlType="submit" loading={saving}>
            Simpan Nama
          </Button>
        </Form>
      </Card>
    </div>
  );
}
