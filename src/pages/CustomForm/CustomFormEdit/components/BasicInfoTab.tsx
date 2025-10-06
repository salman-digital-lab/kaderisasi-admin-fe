import { Form, Input, Row, Col, Card, Space, Typography, Select } from "antd";
import type { CustomForm } from "../../../../types/model/customForm";
import type { Activity } from "../../../../types/model/activity";
import type { Club } from "../../../../types/model/club";
import type { FormInstance } from "antd";
import { useEffect, useState } from "react";
import {
  getAvailableActivities,
  getAvailableClubs,
} from "../../../../api/services/customForm";
import { RichTextEditor } from "../../../../components";

const { Text } = Typography;
const { TextArea } = Input;

interface BasicInfoTabProps {
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
}: BasicInfoTabProps) => {
  const [featureType, setFeatureType] = useState<
    "activity_registration" | "club_registration" | "independent_form"
  >(initialData.feature_type);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>(
    [],
  );
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingClubs, setLoadingClubs] = useState(false);

  useEffect(() => {
    if (featureType === "activity_registration") {
      fetchAvailableActivities();
    } else if (featureType === "club_registration") {
      fetchAvailableClubs();
    }
  }, [featureType]);

  const fetchAvailableActivities = async () => {
    setLoadingActivities(true);
    try {
      const data = await getAvailableActivities(initialData.id);
      setAvailableActivities(data || []);
    } catch (error) {
      console.error("Error fetching available activities:", error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchAvailableClubs = async () => {
    setLoadingClubs(true);
    try {
      const data = await getAvailableClubs(initialData.id);
      setAvailableClubs(data || []);
    } catch (error) {
      console.error("Error fetching available clubs:", error);
    } finally {
      setLoadingClubs(false);
    }
  };

  const handleFeatureTypeChange = (
    value: "activity_registration" | "club_registration" | "independent_form",
  ) => {
    setFeatureType(value);
    // Reset feature_id when changing type
    form.setFieldValue("featureId", null);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSave}
      initialValues={{
        formName: initialData.form_name,
        formDescription: initialData.form_description || "",
        postSubmissionInfo: initialData.post_submission_info || "",
        featureType: initialData.feature_type,
        featureId: initialData.feature_id,
      }}
    >
      <Row gutter={24}>
        <Col span={16}>
          <Form.Item
            label="Nama Form"
            name="formName"
            rules={[
              { required: true, message: "Nama form harus diisi!" },
              { min: 3, message: "Nama form minimal 3 karakter!" },
              { max: 100, message: "Nama form maksimal 100 karakter!" },
            ]}
          >
            <Input placeholder="Masukkan nama form" />
          </Form.Item>

          <Form.Item
            label="Informasi Awal Pengisian Form (Opsional)"
            name="formDescription"
            rules={[{ max: 500, message: "Maksimal 500 karakter!" }]}
          >
            <TextArea
              placeholder="Masukkan informasi awal pengisian form"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="Informasi Pasca Pengisian Form (Opsional)"
            name="postSubmissionInfo"
            tooltip="Informasi ini akan ditampilkan setelah pengguna berhasil mengisi form"
          >
            <RichTextEditor
              placeholder="Masukkan informasi pasca pengisian form (opsional)"
              minHeight="200px"
              maxHeight="400px"
            />
          </Form.Item>

          <Form.Item label="Tipe Form" name="featureType">
            <Select
              placeholder="Pilih tipe fitur"
              onChange={handleFeatureTypeChange}
            >
              <Select.Option value="activity_registration">
                Pendaftaran Aktivitas
              </Select.Option>
              <Select.Option value="club_registration">
                Pendaftaran Unit Kegiatan
              </Select.Option>
              <Select.Option value="independent_form">
                Form Independen
              </Select.Option>
            </Select>
          </Form.Item>

          {featureType === "activity_registration" && (
            <Form.Item
              label="Pilih Aktivitas"
              name="featureId"
              rules={[{ required: true, message: "Aktivitas harus dipilih!" }]}
            >
              <Select
                placeholder="Pilih aktivitas"
                loading={loadingActivities}
                showSearch
                optionFilterProp="children"
              >
                {availableActivities.map((activity) => (
                  <Select.Option key={activity.id} value={activity.id}>
                    {activity.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {featureType === "club_registration" && (
            <Form.Item
              label="Pilih Unit Kegiatan"
              name="featureId"
              rules={[
                { required: true, message: "Unit kegiatan harus dipilih!" },
              ]}
            >
              <Select
                placeholder="Pilih unit kegiatan"
                loading={loadingClubs}
                showSearch
                optionFilterProp="children"
              >
                {availableClubs.map((club) => (
                  <Select.Option key={club.id} value={club.id}>
                    {club.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {featureType === "independent_form" && (
            <Form.Item
              label="ID Fitur"
              help="Form independen tidak memerlukan ID fitur"
            >
              <Input value="Tidak ada" disabled />
            </Form.Item>
          )}
        </Col>

        <Col span={8}>
          <Card
            size="small"
            title="Informasi Form"
            style={{ backgroundColor: "#fafafa" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Text strong>Status:</Text>
                <br />
                <Text type={initialData.is_active ? "success" : "danger"}>
                  {initialData.is_active ? "Aktif" : "Tidak Aktif"}
                </Text>
              </div>

              <div>
                <Text strong>Jumlah Grup Pertanyaan:</Text>
                <br />
                <Text type="secondary">
                  {initialData.form_schema?.fields?.length || 0}
                </Text>
              </div>

              <div>
                <Text strong>Total Pertanyaan:</Text>
                <br />
                <Text type="secondary">
                  {initialData.form_schema?.fields?.reduce(
                    (total: number, section: any) =>
                      total + section.fields.length,
                    0,
                  ) || 0}
                </Text>
              </div>

              <div>
                <Text strong>Dibuat:</Text>
                <br />
                <Text type="secondary">
                  {new Date(initialData.created_at).toLocaleDateString(
                    "id-ID",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </Text>
              </div>

              <div>
                <Text strong>Terakhir Diperbarui:</Text>
                <br />
                <Text type="secondary">
                  {new Date(initialData.updated_at).toLocaleDateString(
                    "id-ID",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </Form>
  );
};
