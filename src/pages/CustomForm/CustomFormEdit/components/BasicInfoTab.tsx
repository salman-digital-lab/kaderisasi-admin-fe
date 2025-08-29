import { Form, Input, Row, Col, Card, Space, Typography } from "antd";
import type { CustomForm } from "../../../../types/model/customForm";
import type { FormInstance } from "antd";

const { Text } = Typography;
const { TextArea } = Input;

interface BasicInfoTabProps {
  form: FormInstance;
  initialData: CustomForm;
  onSave: (values: { formName: string; formDescription: string }) => void;
}

export const BasicInfoTab = ({
  form,
  initialData,
  onSave,
}: BasicInfoTabProps) => {

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSave}
      initialValues={{
        formName: initialData.form_name,
        formDescription: initialData.form_description || "",
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
            <Input placeholder="Masukkan nama form" size="large" />
          </Form.Item>

          <Form.Item
            label="Deskripsi Form"
            name="formDescription"
            rules={[
              { max: 500, message: "Deskripsi maksimal 500 karakter!" },
            ]}
          >
            <TextArea
              placeholder="Masukkan deskripsi form (opsional)"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Card
            size="small"
            title="Informasi Form"
            style={{ backgroundColor: "#fafafa" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Text strong>Tipe Fitur:</Text>
                <br />
                <Text type="secondary">
                  {initialData.feature_type === "activity_registration"
                    ? "Pendaftaran Aktivitas"
                    : "Pendaftaran Klub"}
                </Text>
              </div>

              <div>
                <Text strong>ID Fitur:</Text>
                <br />
                <Text type="secondary">{initialData.feature_id}</Text>
              </div>

              <div>
                <Text strong>Status:</Text>
                <br />
                <Text
                  type={initialData.is_active ? "success" : "danger"}
                >
                  {initialData.is_active ? "Aktif" : "Tidak Aktif"}
                </Text>
              </div>

              <div>
                <Text strong>Jumlah Section:</Text>
                <br />
                <Text type="secondary">
                  {initialData.form_schema?.fields?.length || 0}
                </Text>
              </div>

              <div>
                <Text strong>Total Field:</Text>
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
