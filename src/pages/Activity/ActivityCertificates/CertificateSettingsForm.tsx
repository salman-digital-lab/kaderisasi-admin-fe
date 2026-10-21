import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import {
  getCertificateSettings,
  saveCertificateSettings,
} from "../../../api/services/certificateWorkflow";
import type { CertificateSettings } from "../../../types/services/certificateTemplate";
import {
  ACTIVITY_NUMBER_INFIX,
  formatCertificateActivityNumber,
  getHijriMonthYear,
  HIJRI_MONTH_NUMERALS,
  parseCertificateActivityNumber,
} from "../../DigitalCertificate/utils/certificate-content";

type SettingsFormValues = Omit<
  CertificateSettings,
  "certificate_activity_number"
> & {
  activity_number_sequence?: string;
  activity_number_month?: number;
  activity_number_year?: number;
};

const hijriMonthOptions = HIJRI_MONTH_NUMERALS.map((label, index) => ({
  label,
  value: index + 1,
}));

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
  onStatusChange,
}: {
  activityId: number;
  disabled: boolean;
  onSaved: () => void;
  onStatusChange?: (saved: boolean) => void;
}): React.ReactElement {
  const [form] = Form.useForm<SettingsFormValues>();
  const sequence = Form.useWatch("activity_number_sequence", form);
  const hijriMonth = Form.useWatch("activity_number_month", form);
  const hijriYear = Form.useWatch("activity_number_year", form);
  const activityNumber =
    sequence && hijriMonth && hijriYear
      ? formatCertificateActivityNumber({ sequence, hijriMonth, hijriYear })
      : null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<boolean>();
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    getCertificateSettings(activityId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          const { certificate_activity_number, ...settings } = data;
          const parts = parseCertificateActivityNumber(
            certificate_activity_number,
          );
          const today = getHijriMonthYear(new Date());
          form.setFieldsValue({
            ...settings,
            activity_number_sequence: parts?.sequence,
            activity_number_month: parts?.hijriMonth ?? today.hijriMonth,
            activity_number_year: parts?.hijriYear ?? today.hijriYear,
          });
          setSaved(data.saved);
          onStatusChange?.(data.saved);
        }
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
  async function submit({
    activity_number_sequence,
    activity_number_month,
    activity_number_year,
    ...values
  }: SettingsFormValues): Promise<void> {
    setSaving(true);
    setError("");
    try {
      await saveCertificateSettings(activityId, {
        ...values,
        certificate_activity_number:
          activity_number_sequence &&
          activity_number_month &&
          activity_number_year
            ? formatCertificateActivityNumber({
                sequence: activity_number_sequence,
                hijriMonth: activity_number_month,
                hijriYear: activity_number_year,
              })
            : "",
        version: 1,
      });
      setSaved(true);
      onStatusChange?.(true);
      onSaved();
    } catch {
      setError("Pengaturan sertifikat gagal disimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card title="Isi sertifikat Salman" loading={loading}>
      {saved === false && (
        <Alert
          type="warning"
          showIcon
          title="Pengaturan belum disimpan"
          description="Isian di bawah masih usulan bawaan. Periksa lalu simpan sebelum meninjau sertifikat."
          style={{ marginBottom: 16 }}
        />
      )}
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
        <Form.Item
          label="Nomor sertifikat kegiatan"
          required
          extra={
            <Typography.Text type="secondary">
              Tampil di bawah logo:{" "}
              <Typography.Text code>
                {activityNumber ?? `…/${ACTIVITY_NUMBER_INFIX}/…`}
              </Typography.Text>
              . Kode unik sertifikat tetap tercetak di bawah QR.
            </Typography.Text>
          }
        >
          <Space.Compact block>
            <Form.Item
              name="activity_number_sequence"
              noStyle
              rules={[
                {
                  required: true,
                  message: "Nomor urut wajib diisi.",
                },
                {
                  pattern: /^\d{1,10}$/,
                  message: "Nomor urut hanya berisi angka.",
                },
              ]}
            >
              <Input
                aria-label="Nomor urut"
                placeholder="Nomor urut, mis. 1719"
                inputMode="numeric"
                maxLength={10}
                style={{ width: "40%" }}
              />
            </Form.Item>
            <Input
              aria-label="Kode tetap"
              value={ACTIVITY_NUMBER_INFIX}
              disabled
              style={{ width: "25%" }}
            />
            <Form.Item
              name="activity_number_month"
              noStyle
              rules={[{ required: true }]}
            >
              <Select
                aria-label="Bulan Hijriah"
                options={hijriMonthOptions}
                style={{ width: "15%" }}
              />
            </Form.Item>
            <Form.Item
              name="activity_number_year"
              noStyle
              rules={[{ required: true }]}
            >
              <InputNumber
                aria-label="Tahun Hijriah"
                min={1000}
                max={9999}
                precision={0}
                style={{ width: "20%" }}
              />
            </Form.Item>
          </Space.Compact>
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
