import React from "react";
import {
  Card,
  Space,
  Avatar,
  Button,
  Tooltip,
  Typography,
  Switch,
  Badge,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface ProfileFieldsSectionProps {
  selectedBasicFields: string[];
  profileDataCategories: readonly any[];
  profileDataTemplates: readonly any[];
  fieldTypes: readonly any[];
  profileFieldRequiredOverrides?: Record<string, boolean>;
  onRemoveProfileField: (fieldKey: string) => void;
  onMoveProfileField: (fieldKey: string, direction: "up" | "down") => void;
  onToggleRequiredField?: (fieldKey: string, required: boolean) => void;
  onOpenAddModal: () => void;
}

// Constants for immutable fields
const IMMUTABLE_FIELD_KEYS = ["name", "gender"];

export const ProfileFieldsSection: React.FC<ProfileFieldsSectionProps> = ({
  selectedBasicFields,
  profileDataCategories,
  profileDataTemplates,
  fieldTypes,
  profileFieldRequiredOverrides = {},
  onRemoveProfileField,
  onMoveProfileField,
  onToggleRequiredField,
  onOpenAddModal,
}) => {
  // Check if a field is immutable (cannot be edited or deleted)
  const isImmutableField = (fieldKey: string): boolean => {
    return IMMUTABLE_FIELD_KEYS.includes(fieldKey);
  };

  // Get the effective required status for a field
  const getEffectiveRequired = (fieldKey: string, defaultRequired: boolean): boolean => {
    if (isImmutableField(fieldKey)) {
      return defaultRequired;
    }
    return profileFieldRequiredOverrides[fieldKey] ?? defaultRequired;
  };

  // Find template by field key
  const findTemplate = (fieldKey: string) => {
    return profileDataTemplates.find((t) => t.field.key === fieldKey);
  };

  // Get field type label
  const getFieldTypeLabel = (fieldType: string): string | undefined => {
    return fieldTypes.find((type) => type.value === fieldType)?.label;
  };

  // Get category color
  const getCategoryColor = (categoryKey: string): string | undefined => {
    return profileDataCategories.find((cat) => cat.key === categoryKey)?.color;
  };

  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          <span>Pertanyaan Dasar</span>
          <Badge count={selectedBasicFields.length} showZero />
        </Space>
      }
      size="small"
      extra={
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={onOpenAddModal}
        >
          Tambah Pertanyaan
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {selectedBasicFields.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <Text type="secondary">Belum ada pertanyaan dasar</Text>
          </div>
        ) : (
          selectedBasicFields.map((fieldKey, index) => {
            const template = findTemplate(fieldKey);
            if (!template) return null;

            const isFirst = index === 0;
            const isLast = index === selectedBasicFields.length - 1;
            const canModifyRequired = !isImmutableField(fieldKey);
            const categoryColor = getCategoryColor(template.category);
            const fieldTypeLabel = getFieldTypeLabel(template.field.type);

            return (
              <Card key={fieldKey} size="small">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  {/* Field Info */}
                  <div style={{ flex: 1 }}>
                    <Space>
                      <Avatar size="small" style={{ backgroundColor: categoryColor }}>
                        <template.icon />
                      </Avatar>
                      <div>
                        <Text strong>{template.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {fieldTypeLabel}
                        </Text>
                        {canModifyRequired && (
                          <div style={{ marginTop: 8 }}>
                            <Space>
                              <Text style={{ fontSize: "12px" }}>Wajib:</Text>
                              <Switch
                                size="small"
                                checked={getEffectiveRequired(
                                  fieldKey,
                                  template.field.required
                                )}
                                onChange={(checked) =>
                                  onToggleRequiredField?.(fieldKey, checked)
                                }
                              />
                            </Space>
                          </div>
                        )}
                      </div>
                    </Space>
                  </div>

                  {/* Action Buttons */}
                  <Space size="small">
                    <Tooltip title="Pindah Ke Atas">
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowUpOutlined />}
                        onClick={() => onMoveProfileField(fieldKey, "up")}
                        disabled={isFirst}
                      />
                    </Tooltip>
                    <Tooltip title="Pindah Ke Bawah">
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowDownOutlined />}
                        onClick={() => onMoveProfileField(fieldKey, "down")}
                        disabled={isLast}
                      />
                    </Tooltip>
                    <Tooltip title="Hapus">
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onRemoveProfileField(fieldKey)}
                        disabled={isImmutableField(fieldKey)}
                      />
                    </Tooltip>
                  </Space>
                </div>
              </Card>
            );
          })
        )}
      </Space>
    </Card>
  );
};
