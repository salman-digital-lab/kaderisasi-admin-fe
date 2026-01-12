import {
  Input,
  Card,
  Button,
  Space,
  Select,
  Modal,
  message,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { Form } from "antd";

import { FilterType } from "../constants/type";
import { createCustomForm } from "../../../../api/services/customForm";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

type CreateFormType = {
  formName: string;
  formDescription?: string;
};

type FilterProps = {
  setParameter: React.Dispatch<React.SetStateAction<FilterType>>;
  autoOpenModal?: boolean;
  refresh?: () => void;
  loading?: boolean;
};

const CustomFormFilter = ({
  setParameter,
  autoOpenModal,
  refresh,
  loading,
}: FilterProps) => {
  const [createForm] = Form.useForm<CreateFormType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Local filter state
  const [searchInput, setSearchInput] = useState("");
  const [featureType, setFeatureType] = useState<
    "activity_registration" | "club_registration" | undefined
  >();
  const [featureId, setFeatureId] = useState("");
  const [isActive, setIsActive] = useState<boolean | undefined>();

  const handleSearch = () => {
    setParameter((prev) => ({
      ...prev,
      search: searchInput,
      feature_type: featureType,
      feature_id: featureId,
      is_active: isActive,
      page: 1,
    }));
  };

  const showModal = () => {
    setIsModalVisible(true);
    createForm.resetFields();
  };

  // Auto-open modal if requested
  useEffect(() => {
    if (autoOpenModal) {
      setIsModalVisible(true);
      createForm.resetFields();
    }
  }, [autoOpenModal, createForm]);

  const handleCancel = () => {
    setIsModalVisible(false);
    createForm.resetFields();
  };

  const handleCreate = async (values: CreateFormType) => {
    setIsCreating(true);
    try {
      await createCustomForm({
        formName: values.formName,
        formDescription: values.formDescription,
        isActive: true,
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
      <Card style={cardStyle} styles={{ body: { padding: 12 } }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Left: Filters */}
          <Space size={12} wrap>
            <Input.Search
              placeholder="Cari nama form"
              allowClear
              style={{ width: 200 }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            />

            <Select
              placeholder="Tipe Fitur"
              allowClear
              style={{ width: 180 }}
              value={featureType}
              onChange={setFeatureType}
              options={[
                {
                  label: "Pendaftaran Aktivitas",
                  value: "activity_registration",
                },
                {
                  label: "Pendaftaran Unit Kegiatan",
                  value: "club_registration",
                },
              ]}
            />

            <Input
              placeholder="ID Fitur"
              allowClear
              style={{ width: 120 }}
              value={featureId}
              onChange={(e) => setFeatureId(e.target.value)}
            />

            <Select
              placeholder="Status"
              allowClear
              style={{ width: 120 }}
              value={isActive}
              onChange={setIsActive}
              options={[
                { label: "Aktif", value: true },
                { label: "Tidak Aktif", value: false },
              ]}
            />

            <Button
              icon={<SearchOutlined />}
              type="primary"
              onClick={handleSearch}
            >
              Cari
            </Button>
          </Space>

          {/* Right: Actions */}
          <Space size={8} wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
              Tambah Form
            </Button>
            {refresh && (
              <Tooltip placement="left" title="Refresh Data">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={refresh}
                  loading={loading}
                />
              </Tooltip>
            )}
          </Space>
        </div>
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
              { min: 3, message: "Nama form minimal 3 karakter" },
            ]}
          >
            <Input placeholder="Masukkan nama form" />
          </Form.Item>

          <Form.Item
            label="Deskripsi Form"
            name="formDescription"
            rules={[{ max: 500, message: "Deskripsi maksimal 500 karakter" }]}
          >
            <Input.TextArea
              placeholder="Masukkan deskripsi form (opsional)"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={handleCancel}>Batal</Button>
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
