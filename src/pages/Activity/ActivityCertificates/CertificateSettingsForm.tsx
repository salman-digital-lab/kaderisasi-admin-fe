import { Alert, Button, Card, Form, Input, Switch } from "antd";
import { useEffect, useState } from "react";
import {
  getCertificateSettings,
  saveCertificateSettings,
} from "../../../api/services/certificateWorkflow";
import type { CertificateSettings } from "../../../types/services/certificateTemplate";

const fields: Array<{
  name: keyof CertificateSettings;
  label: string;
  required?: boolean;
}> = [
  { name: "institution", label: "Institusi", required: true },
  { name: "role", label: "Peran peserta", required: true },
  { name: "event_date", label: "Tanggal kegiatan" },
  { name: "hijri_date", label: "Tanggal Hijriah" },
  { name: "delivery_mode", label: "Cara pelaksanaan" },
  { name: "venue", label: "Tempat kegiatan" },
  { name: "organizer", label: "Penyelenggara", required: true },
  { name: "document_place", label: "Tempat penerbitan", required: true },
  {
    name: "document_date",
    label: "Tanggal tertulis pada sertifikat",
    required: true,
  },
];

export function CertificateSettingsForm({
  activityId,
  disabled,
  onSaved,
}: {
  activityId: number;
  disabled: boolean;
  onSaved: () => void;
}): React.ReactElement {
  const [form] = Form.useForm<CertificateSettings>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    getCertificateSettings(activityId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) form.setFieldsValue(data);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Pengaturan sertifikat gagal dimuat.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [activityId, form]);
  async function submit(values: CertificateSettings): Promise<void> {
    setSaving(true);
    setError("");
    try {
      await saveCertificateSettings(activityId, { ...values, version: 1 });
      onSaved();
    } catch {
      setError("Pengaturan sertifikat gagal disimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card title="Isi sertifikat Salman" loading={loading}>
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          style={{ marginBottom: 16 }}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        disabled={disabled || saving}
      >
        <Form.Item name="version" hidden>
          <Input />
        </Form.Item>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
            gap: "0 16px",
          }}
        >
          {fields.map((field) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={
                field.required
                  ? [
                      {
                        required: true,
                        whitespace: true,
                        message: `${field.label} wajib diisi.`,
                      },
                    ]
                  : undefined
              }
            >
              {field.name === "venue" ? (
                <Input.TextArea rows={2} maxLength={500} />
              ) : (
                <Input maxLength={500} />
              )}
            </Form.Item>
          ))}
        </div>
        <Form.Item
          name="include_scores"
          label="Sertakan daftar nilai"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Button htmlType="submit" type="primary" loading={saving}>
          Simpan pengaturan
        </Button>
      </Form>
    </Card>
  );
}
