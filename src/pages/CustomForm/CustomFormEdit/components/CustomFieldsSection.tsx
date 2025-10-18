import React, { useState } from "react";
import {
  Card,
  Space,
  Avatar,
  Tag,
  Button,
  Tooltip,
  Badge,
  Typography,
  Input,
  Modal,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FormOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { FormField } from "../../../../types/model/customForm";

const { Text } = Typography;

interface CustomFieldsSectionProps {
  sectionKey: string;
  sectionNumber: number;
  customFields: FormField[];
  fieldTypes: readonly any[];
  fieldCategories: readonly any[];
  isFirst: boolean;
  isLast: boolean;
  onAddField: () => void;
  onEditField: (field: FormField) => void;
  onDeleteField: (fieldKey: string) => void;
  onDuplicateField: (field: FormField) => void;
  onMoveField: (fieldKey: string, direction: "up" | "down") => void;
  onDeleteSection: () => void;
  onMoveSection: (direction: "up" | "down") => void;
  onUpdateSectionName: (newName: string) => void;
}

export const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = ({
  sectionKey,
  sectionNumber,
  customFields,
  fieldTypes,
  fieldCategories,
  isFirst,
  isLast,
  onAddField,
  onEditField,
  onDeleteField,
  onDuplicateField,
  onMoveField,
  onDeleteSection,
  onMoveSection,
  onUpdateSectionName,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(
    sectionKey.startsWith("custom_section_") ? `Bagian ${sectionNumber}` : sectionKey
  );
  // Find field type configuration by value
  const findFieldType = (fieldType: string) => {
    return fieldTypes.find((type) => type.value === fieldType);
  };

  // Get category color by field type
  const getCategoryColor = (fieldType: string): string | undefined => {
    const type = findFieldType(fieldType);
    if (!type) return undefined;
    
    return fieldCategories.find((cat) => cat.key === type.category)?.color;
  };

  const handleTitleSave = () => {
    if (titleValue.trim()) {
      onUpdateSectionName(titleValue.trim());
      setIsEditingTitle(false);
    }
  };

  const handleDeleteClick = () => {
    Modal.confirm({
      title: "Hapus Grup Pertanyaan",
      content: "Apakah Anda yakin ingin menghapus grup pertanyaan ini? Semua pertanyaan di dalamnya akan terhapus.",
      okText: "Hapus",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: onDeleteSection,
    });
  };

  return (
    <Card
      title={
        <Space>
          <FormOutlined />
          {isEditingTitle ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onPressEnter={handleTitleSave}
              onBlur={handleTitleSave}
              autoFocus
              style={{ width: 200 }}
              size="small"
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              style={{ cursor: "pointer" }}
            >
              {titleValue}
            </span>
          )}
          <Badge count={customFields.length} showZero />
        </Space>
      }
      size="small"
      extra={
        <Space size="small">
          <Tooltip title="Pindah Ke Atas">
            <Button
              type="text"
              size="small"
              icon={<ArrowUpOutlined />}
              onClick={() => onMoveSection("up")}
              disabled={isFirst}
            />
          </Tooltip>
          <Tooltip title="Pindah Ke Bawah">
            <Button
              type="text"
              size="small"
              icon={<ArrowDownOutlined />}
              onClick={() => onMoveSection("down")}
              disabled={isLast}
            />
          </Tooltip>
          <Tooltip title="Hapus Grup">
            <Button
              type="text"
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={handleDeleteClick}
            />
          </Tooltip>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {customFields.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <Text type="secondary">Belum ada pertanyaan kustom</Text>
          </div>
        ) : (
          customFields.map((field, index) => {
            const fieldType = findFieldType(field.type);
            const categoryColor = getCategoryColor(field.type);
            const isFirst = index === 0;
            const isLast = index === customFields.length - 1;

            return (
              <Card key={field.key} size="small">
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
                        {fieldType?.icon && (
                          <span>{React.createElement(fieldType.icon)}</span>
                        )}
                      </Avatar>
                      <div>
                        <Text strong>{field.label}</Text>
                        <br />
                        <Space size="small">
                          <Tag color="blue">{fieldType?.label}</Tag>
                          {field.required && <Tag color="red">Wajib</Tag>}
                          {field.placeholder && (
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              "{field.placeholder}"
                            </Text>
                          )}
                        </Space>
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
                        onClick={() => onMoveField(field.key, "up")}
                        disabled={isFirst}
                      />
                    </Tooltip>
                    <Tooltip title="Pindah Ke Bawah">
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowDownOutlined />}
                        onClick={() => onMoveField(field.key, "down")}
                        disabled={isLast}
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
                        onClick={() => onDeleteField(field.key)}
                      />
                    </Tooltip>
                  </Space>
                </div>
              </Card>
            );
          })
        )}

        {/* Add Question Button at the bottom of the section */}
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={onAddField}
          style={{ marginTop: customFields.length > 0 ? "8px" : "0" }}
        >
          Tambah Pertanyaan
        </Button>
      </Space>
    </Card>
  );
};
