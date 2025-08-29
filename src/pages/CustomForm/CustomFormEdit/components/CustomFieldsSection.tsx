import React from "react";
import {
  Card,
  Space,
  Avatar,
  Tag,
  Button,
  Tooltip,
  Badge,
  Typography,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FormOutlined,
} from "@ant-design/icons";
import type { FormField } from "../../../../types/model/customForm";

const { Text } = Typography;

interface CustomFieldsSectionProps {
  customFields: FormField[];
  fieldTypes: any[];
  fieldCategories: any[];
  onAddField: () => void;
  onEditField: (field: FormField) => void;
  onDeleteField: (fieldKey: string) => void;
  onDuplicateField: (field: FormField) => void;
  onMoveField: (fieldKey: string, direction: "up" | "down") => void;
}

export const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = ({
  customFields,
  fieldTypes,
  fieldCategories,
  onAddField,
  onEditField,
  onDeleteField,
  onDuplicateField,
  onMoveField,
}) => {

  return (
    <Card
      title={
        <Space>
          <FormOutlined />
          <span>Field Kustom</span>
          <Badge count={customFields.length} showZero />
        </Space>
      }
      size="small"
      extra={
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={onAddField}
        >
          Tambah Field
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {customFields.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <FormOutlined
              style={{
                fontSize: "48px",
                color: "#d9d9d9",
                marginBottom: 16,
              }}
            />
            <Text type="secondary">Belum ada field kustom</Text>
            <br />
            <Text type="secondary">
              Klik "Tambah Field" untuk memulai
            </Text>
          </div>
        ) : (
          customFields.map((field, index) => (
            <Card key={field.key} size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Space>
                      <Avatar
                        size="small"
                        style={{
                          backgroundColor:
                            fieldCategories.find(
                              (cat) =>
                                cat.key ===
                                fieldTypes.find(
                                  (type) => type.value === field.type,
                                )?.category,
                            )?.color,
                        }}
                      >
                        {fieldTypes.find(
                          (type) => type.value === field.type,
                        )?.icon && (
                          <span>
                            {React.createElement(
                              fieldTypes.find(
                                (type) => type.value === field.type,
                              )!.icon
                            )}
                          </span>
                        )}
                      </Avatar>
                      <div>
                        <Text strong>{field.label}</Text>
                        <br />
                        <Space size="small">
                          <Tag color="blue">
                            {
                              fieldTypes.find(
                                (type) => type.value === field.type,
                              )?.label
                            }
                          </Tag>
                          {field.required && (
                            <Tag color="red">Wajib</Tag>
                          )}
                          {field.placeholder && (
                            <Text
                              type="secondary"
                              style={{ fontSize: "12px" }}
                            >
                              "{field.placeholder}"
                            </Text>
                          )}
                        </Space>
                      </div>
                    </Space>
                  </div>
                  <div>
                    <Space size="small">
                      <Tooltip title="Pindah Ke Atas">
                        <Button
                          type="text"
                          size="small"
                          icon={<ArrowUpOutlined />}
                          onClick={() =>
                            onMoveField(field.key, "up")
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
                            onMoveField(field.key, "down")
                          }
                          disabled={index === customFields.length - 1}
                        />
                      </Tooltip>
                      <Tooltip title="Duplikat">
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => onDuplicateField(field)}
                        />
                      </Tooltip>
                      <Tooltip title="Edit">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => onEditField(field)}
                        />
                      </Tooltip>
                      <Tooltip title="Hapus">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            onDeleteField(field.key)
                          }
                        />
                      </Tooltip>
                    </Space>
                  </div>
                </div>
              </Space>
            </Card>
          ))
        )}
      </Space>
    </Card>
  );
};
