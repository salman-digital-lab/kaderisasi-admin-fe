import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Button,
  Divider,
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
  fieldTypes: any[];
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
    if (visible && editingField) {
      form.setFieldsValue({
        ...editingField,
        options: editingField.options || [],
      });
    } else if (visible && !editingField) {
      // Reset form for new field
      form.resetFields();
    }
  }, [editingField, visible, form]);

  const handleFieldTypeChange = (value: string) => {
    onFieldTypeChange?.(value);
  };

  const hasOptionsField = (fieldType: string) => {
    return ["select", "radio", "checkbox"].includes(fieldType);
  };

  return (
    <Modal
      title={
        <Space>
          <FormOutlined />
          {editingField?.key?.startsWith("custom_")
            ? "Tambah Field Baru"
            : "Edit Field"}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
      >
        {/* Basic Settings Tab */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Label Field"
              name="label"
              rules={[
                {
                  required: true,
                  message: "Label field wajib diisi!",
                },
                { min: 2, message: "Label minimal 2 karakter!" },
                {
                  max: 100,
                  message: "Label maksimal 100 karakter!",
                },
              ]}
            >
              <Input placeholder="Masukkan label field" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Tipe Field"
              name="type"
              rules={[
                {
                  required: true,
                  message: "Tipe field wajib dipilih!",
                },
              ]}
            >
              <Select
                placeholder="Pilih tipe field"
                onChange={handleFieldTypeChange}
              >
                {fieldTypes.map((type) => (
                  <Select.Option
                    key={type.value}
                    value={type.value}
                  >
                    <Space>
                      <type.icon />
                      {type.label}
                      <Text
                        type="secondary"
                        style={{ fontSize: "12px" }}
                      >
                        {type.description}
                      </Text>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Teks Placeholder"
              name="placeholder"
              rules={[
                {
                  max: 200,
                  message: "Placeholder maksimal 200 karakter!",
                },
              ]}
            >
              <Input placeholder="Masukkan teks placeholder (opsional)" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Teks Bantuan"
              name="helpText"
              rules={[
                {
                  max: 300,
                  message: "Teks bantuan maksimal 300 karakter!",
                },
              ]}
            >
              <Input placeholder="Masukkan teks bantuan (opsional)" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Field Wajib Diisi"
          name="required"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        {/* Options Tab - Only shown for fields that need options */}
        {editingField?.type && hasOptionsField(editingField.type) && (
          <>
            <Divider />
            <Text
              type="secondary"
              style={{ marginBottom: 16, display: "block" }}
            >
              Konfigurasi opsi untuk field pilihan (Select, Radio, Checkbox)
            </Text>

            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row
                      key={key}
                      gutter={16}
                      align="middle"
                      style={{ marginBottom: 8 }}
                    >
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
                        >
                          <Input
                            placeholder="Label opsi (akan otomatis mengisi nilai)"
                            onChange={(e) => {
                              const labelValue = e.target.value;
                              // Auto-sync label to value
                              const currentOptions = form.getFieldValue('options') || [];
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
                      </Col>
                      <Col flex="none">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          style={{ height: "32px" }}
                        >
                          Hapus
                        </Button>
                      </Col>
                    </Row>
                  ))}
                  <Form.Item>
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
          </>
        )}

        <Divider />

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel}>Batal</Button>
            <Button type="primary" htmlType="submit">
              Simpan Field
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
