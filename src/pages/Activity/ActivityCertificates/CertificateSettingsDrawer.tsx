import {
  Alert,
  Button,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Skeleton,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCertificateSettings,
  saveCertificateSettings,
} from "../../../api/services/certificateWorkflow";
import type {
  CertificateSettings,
  CertificateTemplateData,
} from "../../../types/services/certificateTemplate";
import {
  ACTIVITY_NUMBER_INFIX,
  type ActivitySettingField,
  formatCertificateActivityNumber,
  getHijriMonthYear,
  getTemplateVariables,
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

const FIELDS: Array<{
  name: Exclude<ActivitySettingField, "certificate_activity_number">;
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

export interface CertificateSettingsDrawerProps {
  activityId: number;
  /** The activity's template; the form shows only the settings it prints. */
  template: CertificateTemplateData;
  open: boolean;
  /** Read-only when the admin cannot manage certificate templates. */
  disabled: boolean;
  onClose: () => void;
  onSaved: (settings: CertificateSettings) => void;
}

/** Activity-wide certificate content, edited in a right-side drawer. */
export function CertificateSettingsDrawer({
  open,
  ...props
}: CertificateSettingsDrawerProps): React.ReactElement {
  const [saving, setSaving] = useState(false);
  const { fields } = useMemo(
    () => getTemplateVariables(props.template),
    [props.template],
  );
  const editable =
    !props.disabled &&
    (fields.size > 0 || props.template.scoreSheetLayout === "salman-v1");
  return (
    <Drawer
      title="Isi sertifikat"
      open={open}
      onClose={props.onClose}
      size={640}
      destroyOnHidden
      styles={{ wrapper: { maxWidth: "100vw" } }}
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={props.onClose} disabled={saving}>
            {editable ? "Batal" : "Tutup"}
          </Button>
          {editable && (
            <Button
              type="primary"
              htmlType="submit"
              form="certificate-settings"
              loading={saving}
            >
              Simpan
            </Button>
          )}
        </Flex>
      }
    >
      {open && (
        <SettingsForm {...props} saving={saving} setSaving={setSaving} />
      )}
    </Drawer>
  );
}

function SettingsForm({
  activityId,
  template,
  disabled,
  onSaved,
  saving,
  setSaving,
}: Omit<CertificateSettingsDrawerProps, "open" | "onClose"> & {
  saving: boolean;
  setSaving: (saving: boolean) => void;
}): React.ReactElement {
  const { fields, automatic } = useMemo(
    () => getTemplateVariables(template),
    [template],
  );
  const isSalman = template.scoreSheetLayout === "salman-v1";
  const showsNumber = fields.has("certificate_activity_number");
  const visibleFields = FIELDS.filter((field) => fields.has(field.name));
  const [form] = Form.useForm<SettingsFormValues>();
  const sequence = Form.useWatch("activity_number_sequence", form);
  const hijriMonth = Form.useWatch("activity_number_month", form);
  const hijriYear = Form.useWatch("activity_number_year", form);
  const activityNumber =
    sequence && hijriMonth && hijriYear
      ? formatCertificateActivityNumber({ sequence, hijriMonth, hijriYear })
      : null;
  // Settings the template does not print keep their saved (or default) values.
  const loaded = useRef<CertificateSettings | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<boolean>();
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    getCertificateSettings(activityId, controller.signal)
      .then(({ saved: wasSaved, ...data }) => {
        if (controller.signal.aborted) return;
        loaded.current = data;
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
        setSaved(wasSaved);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Isi sertifikat gagal dimuat.");
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
    if (!loaded.current) return;
    setSaving(true);
    setError("");
    try {
      const savedSettings = await saveCertificateSettings(activityId, {
        ...loaded.current,
        ...values,
        certificate_activity_number: !showsNumber
          ? (loaded.current.certificate_activity_number ?? "")
          : activity_number_sequence &&
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
      onSaved(savedSettings);
    } catch {
      setError("Isi sertifikat gagal disimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  const fillable = visibleFields.length > 0 || showsNumber || isSalman;
  return (
    <Flex vertical gap={16}>
      <Typography.Text type="secondary">
        Isian mengikuti template yang dipilih dan berlaku untuk semua sertifikat
        kegiatan ini. Perubahan hanya memengaruhi sertifikat yang diterbitkan
        setelahnya.
      </Typography.Text>
      {saved === false && fillable && (
        <Alert
          type="warning"
          showIcon
          title="Isi sertifikat belum disimpan"
          description="Isian di bawah masih usulan bawaan. Periksa lalu simpan sebelum menerbitkan sertifikat."
        />
      )}
      {error && <Alert type="error" showIcon title={error} />}
      <Skeleton active loading={loading} paragraph={{ rows: 8 }}>
        {!fillable ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Template ini tidak memakai isian kegiatan."
          />
        ) : (
          <Form
            id="certificate-settings"
            form={form}
            layout="vertical"
            onFinish={submit}
            disabled={disabled || saving}
          >
            {showsNumber && (
              <fieldset
                style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
              >
                <legend style={{ fontSize: "inherit", marginBottom: 8 }}>
                  <Typography.Text strong>
                    Nomor sertifikat kegiatan
                  </Typography.Text>
                </legend>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
                    gap: "0 16px",
                  }}
                >
                  <Form.Item
                    name="activity_number_sequence"
                    label="Nomor urut"
                    rules={[
                      { required: true, message: "Nomor urut wajib diisi." },
                      {
                        pattern: /^\d{1,10}$/,
                        message: "Nomor urut hanya berisi angka.",
                      },
                    ]}
                  >
                    <Input
                      placeholder="mis. 1719"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </Form.Item>
                  <Form.Item
                    name="activity_number_month"
                    label="Bulan Hijriah"
                    rules={[
                      { required: true, message: "Pilih bulan Hijriah." },
                    ]}
                  >
                    <Select options={hijriMonthOptions} />
                  </Form.Item>
                  <Form.Item
                    name="activity_number_year"
                    label="Tahun Hijriah"
                    rules={[{ required: true, message: "Isi tahun Hijriah." }]}
                  >
                    <InputNumber
                      min={1000}
                      max={9999}
                      precision={0}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </div>
                <Typography.Paragraph type="secondary">
                  Tampil di bawah judul sebagai{" "}
                  <Typography.Text code>
                    {activityNumber ?? `…/${ACTIVITY_NUMBER_INFIX}/…`}
                  </Typography.Text>
                  . Kode unik sertifikat tetap tercetak di bawah QR.
                </Typography.Paragraph>
              </fieldset>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
                gap: "0 16px",
              }}
            >
              {visibleFields.map((field) => (
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
            {isSalman && (
              <Form.Item
                name="include_scores"
                label="Sertakan daftar nilai"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            )}
          </Form>
        )}
      </Skeleton>
      {automatic.length > 0 && (
        <section aria-labelledby="certificate-automatic-heading">
          <Typography.Text strong id="certificate-automatic-heading">
            Diisi otomatis untuk setiap peserta
          </Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Space size={[8, 8]} wrap>
              {automatic.map((label) => (
                <Tag key={label}>{label}</Tag>
              ))}
            </Space>
          </div>
        </section>
      )}
    </Flex>
  );
}
