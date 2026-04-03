import React from "react";
import {
  Alert,
  Modal,
  Space,
  Tabs,
  Row,
  Col,
  Avatar,
  Card,
  Typography,
  Tooltip,
} from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { TabPane } = Tabs;

interface BasicFieldModalProps {
  visible: boolean;
  selectedBasicFields: string[];
  profileDataCategories: readonly any[];
  profileDataTemplates: readonly any[];
  onCancel: () => void;
  onAddProfileField: (template: any) => void;
}

export const BasicFieldModal: React.FC<BasicFieldModalProps> = ({
  visible,
  selectedBasicFields,
  profileDataCategories,
  profileDataTemplates,
  onCancel,
  onAddProfileField,
}) => {
  const EDUCATION_PAIR = ["education_history", "current_education"];
  const selectedEducationField = EDUCATION_PAIR.find((key) =>
    selectedBasicFields.includes(key)
  );
  const blockedEducationField = selectedEducationField
    ? EDUCATION_PAIR.find((key) => key !== selectedEducationField)
    : null;

  const CITY_REQUIRES_PROVINCE: Record<string, string> = {
    city_id: "province_id",
    origin_city_id: "origin_province_id",
  };
  const CITY_BLOCKED_LABEL: Record<string, string> = {
    city_id: "Provinsi Domisili",
    origin_city_id: "Provinsi Asal",
  };

  // Filter out already added fields AND the mutually exclusive education partner
  const availableTemplates = profileDataTemplates.filter(
    (template) =>
      !selectedBasicFields.includes(template.field.key) &&
      template.field.key !== blockedEducationField
  );

  const handleAddField = (template: any) => {
    onAddProfileField(template);
    // Don't close the modal automatically to allow adding multiple fields
  };

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          <span>Pilih Pertanyaan Dasar</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      destroyOnHidden
    >
      {availableTemplates.length === 0 && !blockedEducationField ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <UserOutlined
            style={{
              fontSize: "48px",
              color: "#d9d9d9",
              marginBottom: 16,
            }}
          />
          <Text type="secondary">Semua pertanyaan dasar sudah ditambahkan</Text>
        </div>
      ) : (
        <Tabs size="small" type="card">
          {profileDataCategories.map((category) => {
            const categoryTemplates = availableTemplates.filter(
              (template) => template.category === category.key
            );
            const isEducationCategory = category.key === "education";
            const showEducationAlert = isEducationCategory && !!blockedEducationField;

            // Hide tab if no templates and no alert to show
            if (categoryTemplates.length === 0 && !showEducationAlert) {
              return null;
            }

            return (
              <TabPane
                key={category.key}
                tab={
                  <Space>
                    <category.icon />
                    {category.label}
                  </Space>
                }
              >
                {showEducationAlert && (
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message={
                      blockedEducationField === "current_education"
                        ? 'Formulir sudah menggunakan "Riwayat Pendidikan". Tidak dapat menambahkan "Pendidikan Sekarang" secara bersamaan — hanya salah satu yang boleh dipilih.'
                        : 'Formulir sudah menggunakan "Pendidikan Sekarang". Tidak dapat menambahkan "Riwayat Pendidikan" secara bersamaan — hanya salah satu yang boleh dipilih.'
                    }
                  />
                )}
                <Row gutter={[12, 12]}>
                  {categoryTemplates.map((template) => {
                    const requiredProvince = CITY_REQUIRES_PROVINCE[template.field.key];
                    const isProvinceBlocked =
                      !!requiredProvince &&
                      !selectedBasicFields.includes(requiredProvince);
                    const blockedLabel = CITY_BLOCKED_LABEL[template.field.key];

                    return (
                      <Col span={8} key={template.name}>
                        <Tooltip
                          title={
                            isProvinceBlocked
                              ? `Tambahkan "${blockedLabel}" terlebih dahulu`
                              : undefined
                          }
                        >
                          <Card
                            size="small"
                            hoverable={!isProvinceBlocked}
                            style={{
                              cursor: isProvinceBlocked ? "not-allowed" : "pointer",
                              borderColor: isProvinceBlocked ? "#d9d9d9" : "#1890ff",
                              opacity: isProvinceBlocked ? 0.5 : 1,
                            }}
                            onClick={() => !isProvinceBlocked && handleAddField(template)}
                          >
                            <Space
                              direction="vertical"
                              style={{
                                width: "100%",
                                textAlign: "center",
                              }}
                            >
                              <Avatar
                                style={{
                                  backgroundColor: isProvinceBlocked
                                    ? "#d9d9d9"
                                    : category.color,
                                }}
                              >
                                <template.icon />
                              </Avatar>
                              <div>
                                <Text strong>{template.name}</Text>
                                <br />
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "12px" }}
                                >
                                  {template.description}
                                </Text>
                              </div>
                            </Space>
                          </Card>
                        </Tooltip>
                      </Col>
                    );
                  })}
                </Row>
              </TabPane>
            );
          })}
        </Tabs>
      )}
    </Modal>
  );
};

