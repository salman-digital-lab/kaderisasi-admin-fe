import React from "react";
import {
  Card,
  Space,
  Tabs,
  Row,
  Col,
  Avatar,
  Tag,
  Button,
  Tooltip,
  Divider,
  Typography,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { TabPane } = Tabs;

interface ProfileFieldsSectionProps {
  selectedBasicFields: string[];
  profileDataCategories: any[];
  profileDataTemplates: any[];
  fieldTypes: any[];
  onAddProfileField: (template: any) => void;
  onRemoveProfileField: (fieldKey: string) => void;
  onMoveProfileField: (fieldKey: string, direction: "up" | "down") => void;
}

export const ProfileFieldsSection: React.FC<ProfileFieldsSectionProps> = ({
  selectedBasicFields,
  profileDataCategories,
  profileDataTemplates,
  fieldTypes,
  onAddProfileField,
  onRemoveProfileField,
  onMoveProfileField,
}) => {

  return (
    <Card
      title={
        <Space>
          <span>👤</span>
          <span>Data Profil Pengguna</span>
        </Space>
      }
      size="small"
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* Available Profile Fields */}
        <div>
          <Text strong style={{ marginBottom: 16, display: "block" }}>
            Field Profil Tersedia
          </Text>
          <Tabs size="small" type="card">
            {profileDataCategories.map((category) => (
              <TabPane
                key={category.key}
                tab={
                  <Space>
                    <category.icon />
                    {category.label}
                  </Space>
                }
              >
                <Row gutter={[12, 12]}>
                  {profileDataTemplates
                    .filter((template) => template.category === category.key)
                    .map((template) => (
                      <Col span={8} key={template.name}>
                        <Card
                          size="small"
                          hoverable
                          style={{
                            cursor: selectedBasicFields.includes(
                              template.field.key,
                            )
                              ? "not-allowed"
                              : "pointer",
                            borderColor: selectedBasicFields.includes(
                              template.field.key,
                            )
                              ? "#d9d9d9"
                              : "#1890ff",
                            backgroundColor:
                              selectedBasicFields.includes(
                                template.field.key,
                              )
                                ? "#f5f5f5"
                                : "white",
                            opacity: selectedBasicFields.includes(
                              template.field.key,
                            )
                              ? 0.6
                              : 1,
                          }}
                          onClick={() =>
                            !selectedBasicFields.includes(
                              template.field.key,
                            ) &&
                            onAddProfileField(template)
                          }
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
                                backgroundColor:
                                  selectedBasicFields.includes(
                                    template.field.key,
                                  )
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
                              <br />
                              <Space
                                size="small"
                                style={{ marginTop: 8 }}
                              >
                                <Tag color="blue">
                                  {
                                    fieldTypes.find(
                                      (type) =>
                                        type.value ===
                                        template.field.type,
                                    )?.label
                                  }
                                </Tag>
                                {template.field.required && (
                                  <Tag color="red">Wajib</Tag>
                                )}
                              </Space>
                            </div>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                </Row>
              </TabPane>
            ))}
          </Tabs>
        </div>

        {/* Selected Profile Fields - Draggable List */}
        {selectedBasicFields.length > 0 && (
          <div>
            <Divider />
            <Text
              strong
              style={{ marginBottom: 16, display: "block" }}
            >
              Field Profil Terpilih ({selectedBasicFields.length})
            </Text>
            <Space direction="vertical" style={{ width: "100%" }}>
              {selectedBasicFields.map((fieldKey, index) => {
                const template = profileDataTemplates.find(
                  (t) => t.field.key === fieldKey,
                );
                if (!template) return null;

                return (
                  <Card key={fieldKey} size="small">
                    <Row align="middle" gutter={16}>
                      <Col flex="auto">
                        <Space>
                          <Avatar
                            size="small"
                            style={{
                              backgroundColor:
                                profileDataCategories.find(
                                  (cat) =>
                                    cat.key === template.category,
                                )?.color,
                            }}
                          >
                            <template.icon />
                          </Avatar>
                          <div>
                            <Text strong>{template.name}</Text>
                            <br />
                            <Space size="small">
                              <Tag color="blue">
                                {
                                  fieldTypes.find(
                                    (type) =>
                                      type.value ===
                                      template.field.type,
                                  )?.label
                                }
                              </Tag>
                              {template.field.required && (
                                <Tag color="red">Wajib</Tag>
                              )}
                            </Space>
                          </div>
                        </Space>
                      </Col>
                      <Col flex="none">
                        <Space size="small">
                          <Tooltip title="Pindah Ke Atas">
                            <Button
                              type="text"
                              size="small"
                              icon={<ArrowUpOutlined />}
                              onClick={() =>
                                onMoveProfileField(fieldKey, "up")
                              }
                              disabled={index === 0}
                            />
                          </Tooltip>
                          <Tooltip title="Pindah Ke Bawah">
                            <Button
                              type="text"
                              size="small"
                              icon={<ArrowDownOutlined />}
                              onClick={() =>
                                onMoveProfileField(
                                  fieldKey,
                                  "down",
                                )
                              }
                              disabled={
                                index ===
                                selectedBasicFields.length - 1
                              }
                            />
                          </Tooltip>
                          <Tooltip title="Hapus">
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() =>
                                onRemoveProfileField(fieldKey)
                              }
                              disabled={fieldKey === "name" || fieldKey === "gender"} // Nama lengkap dan jenis kelamin tidak dapat dihapus
                            />
                          </Tooltip>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                );
              })}
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};
