import { useState, type ReactElement } from "react";
import { Alert, Button, Card, Form, Input, Typography, message } from "antd";
import { updateProfile } from "../../api/services/profile";
import { useRoles, useSetSession, useUser } from "../../stores/authStore";
import TalentProfileSection from "../../features/talent-assessment/ProfileSection";
import RoleTags from "../../components/common/RoleTags";
import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { NAV_LABELS } from "../../constants/navigation";

export default function ProfilePage(): ReactElement {
  const user = useUser();
  const roles = useRoles();
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
    <div className="page-container">
      <PageHeader title={NAV_LABELS.profile} />
      <Card style={{ maxWidth: 640 }}>
        <section style={{ marginBottom: 24 }}>
          <Typography.Title level={5}>Peran Anda</Typography.Title>
          <RoleTags roles={roles} />
          <Typography.Paragraph style={{ marginTop: 12 }}>
            <Link to="/my-requests">
              Lihat hak akses gabungan dan pengajuan peran
            </Link>
          </Typography.Paragraph>
        </section>
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
            Simpan nama
          </Button>
        </Form>
      </Card>
      <TalentProfileSection key={user?.id} />
    </div>
  );
}
