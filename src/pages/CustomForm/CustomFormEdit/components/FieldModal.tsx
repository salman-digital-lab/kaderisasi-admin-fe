import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Button,
  Row,
  Col,
  Typography,
} from "antd";
import { FormOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { FormField } from "../../../../types/model/customForm";

const { Text } = Typography;

interface FieldModalProps {
  visible: boolean;
  editingField: FormField | null;
  fieldTypes: readonly any[];
  onCancel: () => void;
  onSave: (values: any) => void;
  onFieldTypeChange?: (value: string) => void;
}

export const FieldModal: React.FC<FieldModalProps> = ({
  visible,
  editingField,
  fieldTypes,
  onCancel,
  onSave,
  onFieldTypeChange,
}) => {
  const [form] = Form.useForm();

  // Reset form values when editingField changes
  useEffect(() => {
    if (visible) {
      // Always reset form first to clear previous values
      form.resetFields();

      if (editingField) {
        // Then set the new values
        form.setFieldsValue({
          ...editingField,
          options: editingField.options || [],
        });
      }
    }
  }, [editingField, visible, form]);

  const handleFieldTypeChange = (value: string) => {
    onFieldTypeChange?.(value);
  };

  const hasOptionsField = (fieldType: string) => {
    return ["select", "radio", "checkbox"].includes(fieldType);
  };

  const handleOk = () => {
    form.submit();
  };

  return (
    <Modal
      title={
        <Space>
          <FormOutlined />
          {editingField?.key?.startsWith("custom_")
            ? "Tambah Pertanyaan Baru"
            : "Edit Pertanyaan"}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Simpan Pertanyaan"
      cancelText="Batal"
      width={800}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSave}>
        {/* Basic Settings Section */}
        <div style={{ marginBottom: 24 }}>
          <Form.Item
            label="Label Pertanyaan"
            name="label"
            rules={[
              {
                required: true,
                message: "Label pertanyaan wajib diisi!",
              },
              { min: 2, message: "Label minimal 2 karakter!" },
            ]}
          >
            <Input.TextArea
              placeholder="Masukkan label pertanyaan"
              rows={2}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label="Tipe Pertanyaan"
                name="type"
                rules={[
                  {
                    required: true,
                    message: "Tipe pertanyaan wajib dipilih!",
                  },
                ]}
              >
                <Select
                  placeholder="Pilih tipe pertanyaan"
                  onChange={handleFieldTypeChange}
                >
                  {fieldTypes.map((type) => (
                    <Select.Option key={type.value} value={type.value}>
                      <Space>
                        <type.icon />
                        {type.label}
                        <Text type="secondary">{type.description}</Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Wajib Diisi"
                name="required"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Teks Bantuan (Opsional)" name="helpText">
            <Input.TextArea
              placeholder="Masukkan teks bantuan untuk membantu pengguna mengisi pertanyaan ini"
              rows={2}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
        </div>

        {/* Options Section - Only shown for fields that need options */}
        {editingField?.type && hasOptionsField(editingField.type) && (
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: 24,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong>Opsi Pilihan</Text>
              <br />
              <Text type="secondary">
                Konfigurasi opsi untuk pertanyaan pilihan (Select, Radio,
                Checkbox)
              </Text>
            </div>

            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <Row
                      key={key}
                      gutter={12}
                      align="middle"
                      style={{
                        marginBottom: 12,
                        backgroundColor: "white",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #e8e8e8",
                      }}
                    >
                      <Col flex="none" style={{ width: 40 }}>
                        <Text type="secondary" strong>
                          {index + 1}.
                        </Text>
                      </Col>
                      <Col flex="auto">
                        <Form.Item
                          {...restField}
                          name={[name, "label"]}
                          rules={[
                            {
                              required: true,
                              message: "Label opsi wajib diisi",
                            },
                          ]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            placeholder="Label opsi (akan otomatis mengisi nilai)"
                            onChange={(e) => {
                              const labelValue = e.target.value;
                              // Auto-sync label to value
                              const currentOptions =
                                form.getFieldValue("options") || [];
                              const updatedOptions = [...currentOptions];
                              if (updatedOptions[name]) {
                                updatedOptions[name] = {
                                  ...updatedOptions[name],
                                  label: labelValue,
                                  value: labelValue, // Fill value with label
                                };
                              } else {
                                updatedOptions[name] = {
                                  label: labelValue,
                                  value: labelValue,
                                };
                              }
                              form.setFieldsValue({
                                options: updatedOptions,
                              });
                            }}
                          />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, "value"]} hidden>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col flex="none">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          title="Hapus opsi"
                        />
                      </Col>
                    </Row>
                  ))}
                  <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                      style={{ width: "100%" }}
                    >
                      Tambah Opsi
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </div>
        )}
      </Form>
    </Modal>
  );
};
