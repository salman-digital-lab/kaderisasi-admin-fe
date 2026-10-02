import {
  Form,
  Input,
  Row,
  Col,
  Typography,
  Select,
  Collapse,
  Alert,
  Button,
} from "antd";
import type { CustomForm } from "../../../../types/model/customForm";
import type { Activity } from "../../../../types/model/activity";
import type { FormInstance } from "antd";
import { useEffect, useState } from "react";
import { getAvailableActivities } from "../../../../api/services/customForm";
import { RichTextEditor } from "../../../../components";
import { formatDateTime } from "../../../../utils/date-format";

const { Text } = Typography;
const { TextArea } = Input;

interface BasicInfoTabProps {
  onChange?: () => void;
  form: FormInstance;
  initialData: CustomForm;
  onSave: (values: {
    formName: string;
    formDescription: string;
    postSubmissionInfo: string;
    featureType:
      | "activity_registration"
      | "club_registration"
      | "independent_form";
    featureId: number | null;
  }) => void;
}

export const BasicInfoTab = ({
  form,
  initialData,
  onSave,
  onChange,
}: BasicInfoTabProps) => {
  const initialFeatureType = initialData.feature_type;
  const [featureType, setFeatureType] = useState<
    "activity_registration" | "club_registration" | "independent_form"
  >(initialFeatureType);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>(
    [],
  );
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesFailed, setActivitiesFailed] = useState(false);

  useEffect(() => {
    if (featureType === "activity_registration") {
      fetchAvailableActivities();
    }
  }, [featureType]);

  const fetchAvailableActivities = async () => {
    setLoadingActivities(true);
    setActivitiesFailed(false);
    try {
      const data = await getAvailableActivities(initialData.id);
      setAvailableActivities(data || []);
    } catch {
      setActivitiesFailed(true);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleFeatureTypeChange = (
    value: "activity_registration" | "club_registration" | "independent_form",
  ) => {
    if (value === "club_registration") return;

    setFeatureType(value);
    // Reset feature_id when changing type
    form.setFieldValue("featureId", null);
  };

  return (
    <Form
      className="builder-basic-settings"
      scrollToFirstError={{ focus: true }}
      form={form}
      layout="vertical"
      onFinish={onSave}
      onValuesChange={onChange}
      initialValues={{
        formName: initialData.form_name,
        formDescription: initialData.form_description || "",
        postSubmissionInfo: initialData.post_submission_info || "",
        featureType: initialFeatureType,
        featureId: initialData.feature_id,
      }}
    >
      <section className="guided-section">
        <Form.Item
          label="Nama Formulir"
          name="formName"
          rules={[
            { required: true, message: "Isi nama formulir." },
            {
              min: 3,
              message: "Gunakan minimal 3 karakter untuk nama formulir.",
            },
            {
              max: 100,
              message: "Batasi nama formulir hingga 100 karakter.",
            },
          ]}
        >
          <Input placeholder="Masukkan nama formulir" />
        </Form.Item>

        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Form.Item
              label="Informasi Awal Pengisian Formulir (Opsional)"
              name="formDescription"
            >
              <TextArea
                placeholder="Masukkan informasi awal pengisian formulir"
                autoSize={{ minRows: 8, maxRows: 12 }}
                showCount
              />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item
              label="Informasi Pasca Pengisian Formulir (Opsional)"
              name="postSubmissionInfo"
              tooltip="Informasi ini akan ditampilkan setelah pengguna berhasil mengisi formulir"
            >
              <RichTextEditor
                placeholder="Masukkan informasi pasca pengisian formulir (opsional)"
                minHeight="164px"
                maxHeight="280px"
              />
            </Form.Item>
          </Col>
        </Row>

        <Collapse
          ghost
          defaultActiveKey={[]}
          style={{ marginLeft: -16, marginRight: -16 }}
          items={[
            {
              key: "pengaturan-tambahan",
              label: (
                <Typography.Text strong>Pengaturan Tambahan</Typography.Text>
              ),
              children: (
                <>
                  <Form.Item label="Tipe Formulir" name="featureType">
                    <Select
                      placeholder="Pilih tipe fitur"
                      onChange={handleFeatureTypeChange}
                      options={[
                        {
                          value: "activity_registration",
                          label: "Pendaftaran Kegiatan",
                        },
                        ...(initialData.feature_type === "club_registration"
                          ? [
                              {
                                value: "club_registration",
                                label: "Pendaftaran Klub",
                                disabled: true,
                              },
                            ]
                          : []),
                        {
                          value: "independent_form",
                          label: "Formulir Independen",
                        },
                      ]}
                    />
                  </Form.Item>

                  {featureType === "activity_registration" &&
                    activitiesFailed && (
                      <Alert
                        type="error"
                        showIcon
                        title="Daftar kegiatan belum dapat dimuat"
                        description="Periksa koneksi, lalu muat ulang daftar kegiatan. Isian formulir Anda tetap tersedia."
                        action={
                          <Button
                            onClick={() => void fetchAvailableActivities()}
                            loading={loadingActivities}
                          >
                            Coba lagi
                          </Button>
                        }
                      />
                    )}
                  {featureType === "activity_registration" && (
                    <Form.Item
                      label="Pilih Kegiatan"
                      name="featureId"
                      rules={[
                        {
                          required: true,
                          message:
                            "Pilih kegiatan yang akan menggunakan formulir ini.",
                        },
                      ]}
                    >
                      <Select
                        placeholder="Pilih kegiatan"
                        loading={loadingActivities}
                        showSearch
                        optionFilterProp="label"
                        options={availableActivities.map((activity) => ({
                          value: activity.id,
                          label: activity.name,
                        }))}
                      />
                    </Form.Item>
                  )}

                  {featureType === "independent_form" && (
                    <Form.Item
                      label="ID Fitur"
                      help="Formulir independen tidak memerlukan ID fitur"
                    >
                      <Input value="Tidak ada" disabled />
                    </Form.Item>
                  )}
                </>
              ),
            },
          ]}
        />
      </section>
      <dl className="builder-form-metadata" aria-label="Informasi formulir">
        <div>
          <dt>Status</dt>
          <dd>
            <Text>{initialData.is_active ? "Aktif" : "Tidak Aktif"}</Text>
          </dd>
        </div>

        <div>
          <dt>Bagian</dt>
          <dd>{initialData.form_schema?.fields?.length || 0}</dd>
        </div>

        <div>
          <dt>Pertanyaan</dt>
          <dd>
            {initialData.form_schema?.fields?.reduce(
              (total, section) => total + section.fields.length,
              0,
            ) || 0}
          </dd>
        </div>

        <div>
          <dt>Dibuat</dt>
          <dd>{formatDateTime(initialData.created_at)}</dd>
        </div>

        <div>
          <dt>Terakhir diperbarui</dt>
          <dd>{formatDateTime(initialData.updated_at)}</dd>
        </div>
      </dl>
    </Form>
  );
};
