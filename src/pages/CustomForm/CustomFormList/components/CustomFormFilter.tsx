import { Input, Col, Row, Card, Form, Button, Space, Select, Modal, message } from "antd";
import { SearchOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useState } from "react";

import { FilterType } from "../constants/type";
import { createCustomForm } from "../../../../api/services/customForm";

type FieldType = {
  search?: string;
  feature_type?: 'activity_registration' | 'club_registration';
  feature_id?: string;
  is_active?: boolean;
};

type CreateFormType = {
  formName: string;
  formDescription?: string;
};

type FilterProps = {
  setParameter: React.Dispatch<React.SetStateAction<FilterType>>;
};

const CustomFormFilter = ({ setParameter }: FilterProps) => {
  const [form] = Form.useForm<FieldType>();
  const [createForm] = Form.useForm<CreateFormType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleReset = () => {
    form.resetFields();
    setParameter((prev) => ({
      ...prev,
      search: "",
      feature_type: undefined,
      feature_id: "",
      is_active: undefined,
      page: 1,
    }));
  };

  const showModal = () => {
    setIsModalVisible(true);
    createForm.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    createForm.resetFields();
  };

  const handleCreate = async (values: CreateFormType) => {
    setIsCreating(true);
    try {
      // Create a default form schema with basic structure

      await createCustomForm({
        formName: values.formName,
        formDescription: values.formDescription,
        isActive: true
      });

      message.success("Form berhasil dibuat!");
      setIsModalVisible(false);
      createForm.resetFields();
      // Refresh the form list
      window.location.reload();
    } catch (error) {
      // Error is already handled by the API service
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Card>
        <Form
          layout="vertical"
          form={form}
          onFinish={(val) =>
            setParameter((prev) => ({
              ...prev,
              search: val.search || "",
              feature_type: val.feature_type,
              feature_id: val.feature_id,
              is_active: val.is_active,
              page: 1,
            }))
          }
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Nama Form" name="search">
                <Input placeholder="Cari nama form..." allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tipe Fitur" name="feature_type">
                <Select
                  placeholder="Pilih tipe fitur"
                  allowClear
                  options={[
                    { label: "Pendaftaran Aktivitas", value: "activity_registration" },
                    { label: "Pendaftaran Klub", value: "club_registration" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="ID Fitur" name="feature_id">
                <Input placeholder="ID Fitur" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Status" name="is_active">
                <Select
                  placeholder="Pilih status"
                  allowClear
                  options={[
                    { label: "Aktif", value: true },
                    { label: "Tidak Aktif", value: false },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end">
            <Space>
              <Button icon={<SearchOutlined />} type="primary" htmlType="submit">
                Cari
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                Reset
              </Button>
              <Button icon={<PlusOutlined />} onClick={showModal}>
                Tambah Form
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>

      <Modal
        title="Buat Form Baru"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
          requiredMark={false}
        >
          <Form.Item
            label="Nama Form"
            name="formName"
            rules={[
              { required: true, message: "Nama form harus diisi" },
              { min: 3, message: "Nama form minimal 3 karakter" }
            ]}
          >
            <Input placeholder="Masukkan nama form" />
          </Form.Item>

          <Form.Item
            label="Deskripsi Form"
            name="formDescription"
            rules={[
              { max: 500, message: "Deskripsi maksimal 500 karakter" }
            ]}
          >
            <Input.TextArea 
              placeholder="Masukkan deskripsi form (opsional)"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>
                Batal
              </Button>
              <Button type="primary" htmlType="submit" loading={isCreating}>
                Buat Form
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CustomFormFilter;
