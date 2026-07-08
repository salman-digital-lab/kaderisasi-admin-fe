import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Typography,
  Popconfirm,
  message,
  Tooltip,
  Modal,
  Form,
  Select,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { TableProps } from "antd/es/table/InternalTable";
import dayjs from "dayjs";
import {
  getCertificateTemplates,
  createCertificateTemplate,
  deleteCertificateTemplate,
} from "../../../api/services/certificateTemplate";
import {
  CertificateTemplate,
  CertificateTemplateData,
} from "../../../types/services/certificateTemplate";
import { Pagination } from "../../../types/services/base";
import { TemplateThumbnail } from "../components";

const { Text } = Typography;

interface CreateTemplateFormValues {
  name: string;
  description?: string;
  preset: string;
  layout: string;
}

const CANVAS_PRESETS = [
  { label: "A4 Landscape", value: "a4-landscape", width: 800, height: 566 },
  { label: "A4 Portrait", value: "a4-portrait", width: 566, height: 800 },
  {
    label: "Letter Landscape",
    value: "letter-landscape",
    width: 792,
    height: 612,
  },
  {
    label: "Letter Portrait",
    value: "letter-portrait",
    width: 612,
    height: 792,
  },
];

const STARTER_LAYOUTS = [
  { label: "Kosong", value: "blank" },
  { label: "Sertifikat Basic", value: "basic" },
  { label: "Penghargaan", value: "award" },
  { label: "Partisipasi", value: "participation" },
];

const createTextElement = (
  id: string,
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  options?: Partial<CertificateTemplateData["elements"][number]>,
): CertificateTemplateData["elements"][number] => ({
  id,
  type: "static-text",
  name: content,
  content,
  x,
  y,
  width,
  height,
  fontSize,
  fontFamily: "serif",
  color: "#1f2937",
  textAlign: "center",
  verticalAlign: "middle",
  fontWeight: "normal",
  fontStyle: "normal",
  textDecoration: "none",
  lineHeight: 1.2,
  letterSpacing: 0,
  opacity: 100,
  rotation: 0,
  borderRadius: 0,
  objectFit: "contain",
  visible: true,
  locked: false,
  ...options,
});

const createVariableElement = (
  id: string,
  variable: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  options?: Partial<CertificateTemplateData["elements"][number]>,
): CertificateTemplateData["elements"][number] => ({
  ...createTextElement(id, variable, x, y, width, height, fontSize, options),
  type: "variable-text",
  name,
  variable,
  content: undefined,
});

const buildStarterTemplate = (
  presetValue: string,
  layout: string,
): CertificateTemplateData => {
  const preset =
    CANVAS_PRESETS.find((item) => item.value === presetValue) ||
    CANVAS_PRESETS[0];
  const width = preset.width;
  const height = preset.height;
  const centerX = Math.round(width * 0.15);
  const contentWidth = Math.round(width * 0.7);

  if (layout === "blank") {
    return {
      backgroundUrl: null,
      elements: [],
      canvasWidth: width,
      canvasHeight: height,
    };
  }

  const elements: CertificateTemplateData["elements"] = [
    createTextElement(
      "starter-title",
      layout === "award" ? "PENGHARGAAN" : "SERTIFIKAT",
      centerX,
      Math.round(height * 0.16),
      contentWidth,
      48,
      36,
      { fontWeight: "bold", letterSpacing: 2 },
    ),
    createTextElement(
      "starter-subtitle",
      layout === "participation"
        ? "Diberikan sebagai apresiasi atas partisipasi"
        : "Diberikan kepada",
      centerX,
      Math.round(height * 0.31),
      contentWidth,
      34,
      18,
    ),
    createVariableElement(
      "starter-name",
      "{{name}}",
      "Nama Peserta",
      centerX,
      Math.round(height * 0.39),
      contentWidth,
      62,
      32,
      { fontWeight: "bold", color: "#0f766e" },
    ),
    createTextElement(
      "starter-body",
      layout === "award"
        ? "Atas pencapaian dan kontribusi terbaik dalam kegiatan"
        : "Telah mengikuti kegiatan",
      centerX,
      Math.round(height * 0.53),
      contentWidth,
      40,
      16,
    ),
    createVariableElement(
      "starter-activity",
      "{{activity_name}}",
      "Nama Kegiatan",
      centerX,
      Math.round(height * 0.61),
      contentWidth,
      42,
      20,
      { fontWeight: "bold" },
    ),
    createVariableElement(
      "starter-date",
      "{{activity_date}}",
      "Tanggal Kegiatan",
      Math.round(width * 0.12),
      Math.round(height * 0.78),
      Math.round(width * 0.28),
      32,
      14,
    ),
    {
      id: "starter-signature",
      type: "signature",
      name: "Tanda Tangan",
      x: Math.round(width * 0.65),
      y: Math.round(height * 0.72),
      width: Math.round(width * 0.2),
      height: Math.round(height * 0.13),
      opacity: 100,
      rotation: 0,
      borderRadius: 0,
      objectFit: "contain",
      visible: true,
      locked: false,
    },
  ];

  return {
    backgroundUrl: null,
    elements,
    canvasWidth: width,
    canvasHeight: height,
  };
};

const CertificateList: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<CreateTemplateFormValues>();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [data, setData] = useState<{
    meta: Pagination;
    data: CertificateTemplate[];
  }>();
  const [parameter, setParameter] = useState({
    page: 1,
    per_page: 10,
    search: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCertificateTemplates({
        page: String(parameter.page),
        per_page: String(parameter.per_page),
        search: parameter.search || undefined,
      });
      if (result) setData(result);
    } finally {
      setLoading(false);
    }
  }, [parameter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (values: CreateTemplateFormValues) => {
    setCreating(true);
    try {
      const templateData = buildStarterTemplate(values.preset, values.layout);
      const template = await createCertificateTemplate({
        name: values.name,
        description: values.description || null,
        templateData,
      });
      if (template) {
        message.success("Template berhasil dibuat");
        navigate(`/digital-certificate/${template.id}/edit`);
      }
    } catch {
      // Error handled by handleError
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCertificateTemplate(id);
      message.success("Template berhasil dihapus");
      fetchData();
    } catch {
      // Error handled by handleError
    }
  };

  const handleDuplicate = async (record: CertificateTemplate) => {
    try {
      const template = await createCertificateTemplate({
        name: `${record.name} (Salinan)`,
        description: record.description,
        templateData: record.template_data,
      });
      if (template) {
        message.success("Template berhasil diduplikat");
        fetchData();
      }
    } catch {
      // Error handled by handleError
    }
  };

  const columns: TableProps<CertificateTemplate>["columns"] = [
    {
      title: "Preview",
      dataIndex: "template_data",
      width: 150,
      render: (_value, record) => (
        <TemplateThumbnail
          templateData={record.template_data}
          backgroundImage={record.background_image}
        />
      ),
    },
    {
      title: "Nama Template",
      dataIndex: "name",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Deskripsi",
      dataIndex: "description",
      render: (value: string | null) => value || "-",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      width: 100,
      render: (value: boolean) => (
        <Tag color={value ? "green" : "default"}>
          {value ? "Aktif" : "Nonaktif"}
        </Tag>
      ),
    },
    {
      title: "Tanggal Dibuat",
      dataIndex: "created_at",
      width: 160,
      render: (value: string) =>
        dayjs(value).locale("id").format("DD MMMM YYYY"),
    },
    {
      title: "Aksi",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/digital-certificate/${record.id}/edit`)}
            />
          </Tooltip>
          <Tooltip title="Duplikat">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleDuplicate(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Hapus template?"
            description="Template yang dihapus tidak dapat dikembalikan."
            onConfirm={() => handleDelete(record.id)}
            okText="Hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Hapus">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 12 }}>
      {/* Header */}
      <Card
        variant="outlined"
        style={{ borderRadius: 0, marginBottom: 12 }}
        styles={{ body: { padding: "12px 16px" } }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SafetyCertificateOutlined
              style={{ fontSize: 24, color: "#1890ff" }}
            />
            <div>
              <Text strong style={{ fontSize: 16 }}>
                Sertifikat Digital
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Kelola template sertifikat digital
              </Text>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
            loading={creating}
          >
            Buat Template
          </Button>
        </div>
      </Card>

      {/* Filter */}
      <Card
        variant="outlined"
        style={{ borderRadius: 0, marginBottom: 0 }}
        styles={{ body: { padding: 12 } }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Space size={12} wrap>
            <Input
              placeholder="Cari template"
              allowClear
              style={{ width: 250 }}
              value={parameter.search}
              onChange={(e) =>
                setParameter((prev) => ({ ...prev, search: e.target.value }))
              }
              onPressEnter={() =>
                setParameter((prev) => ({ ...prev, page: 1 }))
              }
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            />
            <Button
              icon={<SearchOutlined />}
              type="primary"
              onClick={() => setParameter((prev) => ({ ...prev, page: 1 }))}
            />
          </Space>
          <Tooltip title="Refresh Data">
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            />
          </Tooltip>
        </div>
      </Card>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.data}
        pagination={{
          current: data?.meta.current_page,
          pageSize: data?.meta.per_page,
          showSizeChanger: true,
          showQuickJumper: true,
          total: data?.meta.total,
          showTotal: (total, range) =>
            `Menampilkan ${range[0]}-${range[1]} dari ${total} template`,
          pageSizeOptions: ["10", "20", "50"],
        }}
        loading={loading}
        onChange={(pagination) =>
          setParameter((prev) => ({
            ...prev,
            page: pagination.current || 1,
            per_page: pagination.pageSize || 10,
          }))
        }
        scroll={{ x: 800 }}
        size="small"
        bordered
      />

      <Modal
        title="Buat Template Sertifikat"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        okText="Buat Template"
        cancelText="Batal"
        confirmLoading={creating}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: "Template Baru",
            preset: "a4-landscape",
            layout: "basic",
          }}
          onFinish={handleCreate}
        >
          <Form.Item
            name="name"
            label="Nama Template"
            rules={[{ required: true, message: "Nama template wajib diisi" }]}
          >
            <Input placeholder="Nama template" />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={2} placeholder="Deskripsi opsional" />
          </Form.Item>
          <Form.Item name="preset" label="Ukuran Kanvas">
            <Select options={CANVAS_PRESETS} />
          </Form.Item>
          <Form.Item name="layout" label="Starter Layout">
            <Select options={STARTER_LAYOUTS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CertificateList;
