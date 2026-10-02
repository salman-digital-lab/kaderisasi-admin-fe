import { ResponsiveFilters } from "../../../../components/common/Responsive/ResponsiveFilters";
import { ResponsiveDialog as Modal } from "../../../../components/common/Responsive/ResponsiveDialog";
import { Input, Card, Button, Space, Select, message, Tooltip } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form } from "antd";

import { FilterType } from "../constants/type";
import { createCustomForm } from "../../../../api/services/customForm";

const cardStyle = {
  boxShadow: "none",
};

type CreateFormType = {
  featureType: "activity_registration" | "independent_form";
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
  const navigate = useNavigate();
  const [createForm] = Form.useForm<CreateFormType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Local filter state
  const [searchInput, setSearchInput] = useState("");
  const [featureType, setFeatureType] = useState<
    "activity_registration" | "independent_form" | undefined
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
      const created = await createCustomForm({
        formName: values.formName,
        formDescription: values.formDescription,
        featureType: values.featureType,
        featureId: null,
        formSchema: {
          version: 2,
          ...(values.featureType === "independent_form"
            ? { settings: { accessMode: "public" as const } }
            : {}),
          fields: [],
        },
        isActive: false,
      });

      message.success("Formulir berhasil dibuat!");
      setIsModalVisible(false);
      createForm.resetFields();
      // Refresh the form list
      navigate(`/custom-form/${created.id}/edit`);
    } catch {
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
          <ResponsiveFilters
            onApply={handleSearch}
            values={[searchInput, featureType, featureId, isActive]}
            onReset={() => {
              setSearchInput("");
              setFeatureType(undefined);
              setFeatureId("");
              setIsActive(undefined);
              setParameter((prev) => ({
                ...prev,
                page: 1,
                search: "",
                feature_type: undefined,
                feature_id: "",
                is_active: undefined,
              }));
            }}
          >
            {({ apply }) => (
              <Space size={12} wrap>
                <Input.Search
                  placeholder="Cari nama formulir"
                  allowClear
                  style={{ width: 200 }}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onSearch={apply}
                  onPressEnter={apply}
                  prefix={
                    <SearchOutlined
                      style={{ color: "var(--app-color-text-secondary)" }}
                    />
                  }
                />

                <Select
                  placeholder="Tipe Fitur"
                  allowClear
                  style={{ width: 180 }}
                  value={featureType}
                  onChange={setFeatureType}
                  options={[
                    { label: "Formulir mandiri", value: "independent_form" },
                    {
                      label: "Pendaftaran Kegiatan",
                      value: "activity_registration",
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

                <Button icon={<SearchOutlined />} onClick={apply}>
                  Cari
                </Button>
              </Space>
            )}
          </ResponsiveFilters>

          {/* Right: Actions */}
          <Space size={8} wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
              Tambah formulir
            </Button>
            {refresh && (
              <Tooltip placement="left" title="Muat ulang data">
                <Button
                  aria-label="Muat ulang data"
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
        title="Buat Formulir Baru"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden
      >
        <Form
          scrollToFirstError={{ focus: true }}
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
          requiredMark={false}
          initialValues={{ featureType: "independent_form" }}
        >
          <Form.Item
            label="Jenis formulir"
            name="featureType"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                {
                  value: "independent_form",
                  label: "Formulir mandiri (tanpa kegiatan atau klub)",
                },
                {
                  value: "activity_registration",
                  label: "Pendaftaran kegiatan",
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Nama Formulir"
            name="formName"
            rules={[
              { required: true, message: "Nama formulir harus diisi" },
              { min: 3, message: "Nama formulir minimal 3 karakter" },
            ]}
          >
            <Input placeholder="Masukkan nama formulir" />
          </Form.Item>

          <Form.Item
            label="Deskripsi Formulir"
            name="formDescription"
            rules={[{ max: 500, message: "Deskripsi maksimal 500 karakter" }]}
          >
            <Input.TextArea
              placeholder="Masukkan deskripsi formulir (opsional)"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={handleCancel}>Batal</Button>
              <Button type="primary" htmlType="submit" loading={isCreating}>
                Buat formulir
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CustomFormFilter;
