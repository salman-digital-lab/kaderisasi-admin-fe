import React from "react";
import {
  Modal,
  Space,
  Tabs,
  Row,
  Col,
  Avatar,
  Card,
  Typography,
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
  // Filter out already added fields
  const availableTemplates = profileDataTemplates.filter(
    (template) => !selectedBasicFields.includes(template.field.key)
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
      destroyOnClose
    >
      {availableTemplates.length === 0 ? (
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

            // Only show tabs that have available templates
            if (categoryTemplates.length === 0) {
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
                <Row gutter={[12, 12]}>
                  {categoryTemplates.map((template) => (
                    <Col span={8} key={template.name}>
                      <Card
                        size="small"
                        hoverable
                        style={{
                          cursor: "pointer",
                          borderColor: "#1890ff",
                        }}
                        onClick={() => handleAddField(template)}
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
                              backgroundColor: category.color,
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
                    </Col>
                  ))}
                </Row>
              </TabPane>
            );
          })}
        </Tabs>
      )}
    </Modal>
  );
};

