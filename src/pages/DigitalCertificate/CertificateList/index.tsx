import { ResponsiveDialog as Modal } from "../../../components/common/Responsive/ResponsiveDialog";
import { ResponsiveTable as Table } from "../../../components/common/Responsive/ResponsiveTable";
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Collapse,
  Form,
  Input,
  message,
  Popconfirm,
  Radio,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { TableProps } from "antd/es/table/InternalTable";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createCertificateTemplate,
  deleteCertificateTemplate,
  getCertificateTemplates,
  updateCertificateTemplateLifecycle,
} from "../../../api/services/certificateTemplate";
import { duplicateTemplate } from "../../../api/services/certificateWorkflow";
import { usePermissions } from "../../../stores/authStore";
import type { Pagination } from "../../../types/services/base";
import type {
  CertificateTemplate,
  CertificateTemplateStatus,
} from "../../../types/services/certificateTemplate";
import { canManageCertificateTemplates } from "../../../utils/certificate-permissions";
import { TemplateThumbnail } from "../components";
import {
  getCertificateReadiness,
  getCertificateTemplateStatus,
  isCertificateTemplateReady,
} from "../utils/certificate-readiness";
import {
  buildStarterTemplate,
  CANVAS_PRESETS,
  STARTER_LAYOUTS,
} from "../utils/starter-templates";

const { Text, Title } = Typography;

const TOUCH_ACTION_STYLE: React.CSSProperties = {
  minWidth: 44,
  minHeight: 44,
};

interface CreateTemplateFormValues {
  name: string;
  description?: string;
  preset: string;
  layout: string;
}

const STATUS_OPTIONS: Array<{
  label: string;
  value: CertificateTemplateStatus;
}> = [
  { label: "Draf", value: "draft" },
  { label: "Dipublikasikan", value: "published" },
  { label: "Diarsipkan", value: "archived" },
];

const CertificateList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const safeReturnTo =
    returnTo && /^\/activity\/[1-9][0-9]*\/certificates$/.test(returnTo)
      ? returnTo
      : null;
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const permissions = usePermissions();
  const canManage = canManageCertificateTemplates(permissions);
  const [form] = Form.useForm<CreateTemplateFormValues>();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [mutatingId, setMutatingId] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(
    searchParams.get("create") === "1",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    CertificateTemplateStatus | undefined
  >();
  const requestIdRef = useRef(0);
  const fetchController = useRef<AbortController | null>(null);
  const [data, setData] = useState<{
    meta: Pagination;
    data: CertificateTemplate[];
  }>();
  const [parameter, setParameter] = useState({
    page: 1,
    per_page: 10,
  });

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    fetchController.current?.abort();
    const controller = new AbortController();
    fetchController.current = controller;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getCertificateTemplates(
        {
          page: String(parameter.page),
          per_page: String(parameter.per_page),
          search: appliedSearch || undefined,
          status: statusFilter,
        },
        controller.signal,
      );
      if (requestId === requestIdRef.current && !controller.signal.aborted)
        setData(result);
    } catch {
      if (requestId === requestIdRef.current && !controller.signal.aborted) {
        setLoadError("Template gagal dimuat. Periksa koneksi lalu coba lagi.");
      }
    } finally {
      if (requestId === requestIdRef.current && !controller.signal.aborted)
        setLoading(false);
    }
  }, [appliedSearch, parameter.page, parameter.per_page, statusFilter]);

  useEffect(() => {
    fetchData();
    return () => fetchController.current?.abort();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchInput.trim());
      setParameter((current) => ({ ...current, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreate = async (values: CreateTemplateFormValues) => {
    setCreating(true);
    try {
      const templateData = buildStarterTemplate(values.preset, values.layout);
      const template = await createCertificateTemplate({
        name: values.name,
        description: values.description || null,
        templateData,
        isActive: false,
        status: "draft",
      });
      if (template) {
        message.success("Template berhasil dibuat");
        navigate(
          `/digital-certificate/${template.id}/edit${safeReturnTo ? `?returnTo=${encodeURIComponent(safeReturnTo)}` : ""}`,
        );
      }
    } catch {
      // Error handled by handleError
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    setMutatingId(id);
    try {
      await deleteCertificateTemplate(id);
      message.success("Template berhasil dihapus");
      await fetchData();
    } catch {
      // Error handled by handleError
    } finally {
      setMutatingId(null);
    }
  };

  const handleDuplicate = async (record: CertificateTemplate) => {
    setMutatingId(record.id);
    try {
      const template = await duplicateTemplate(record.id);
      if (template) {
        message.success("Template berhasil diduplikat");
        navigate(
          `/digital-certificate/${template.id}/edit${safeReturnTo ? `?returnTo=${encodeURIComponent(safeReturnTo)}` : ""}`,
        );
      }
    } catch {
      message.error(
        "Template tidak dapat disalin. Periksa aset dan coba lagi.",
      );
    } finally {
      setMutatingId(null);
    }
  };

  const handleLifecycleChange = async (
    record: CertificateTemplate,
    status: CertificateTemplateStatus,
  ): Promise<void> => {
    const readiness = getCertificateReadiness(
      record.template_data,
      record.background_image,
    );
    const ready =
      (record.readiness?.ready ?? true) &&
      isCertificateTemplateReady(readiness);
    if (status === "published" && !ready) {
      message.warning("Perbaiki masalah kesiapan sebelum mempublikasikan.");
      return;
    }

    setMutatingId(record.id);
    try {
      await updateCertificateTemplateLifecycle(
        record.id,
        status,
        Number(record.version),
      );
      message.success(
        status === "published"
          ? "Template dipublikasikan"
          : status === "archived"
            ? "Template diarsipkan"
            : "Template dikembalikan ke draf",
      );
      await fetchData();
    } catch {
      // Error handled centrally.
    } finally {
      setMutatingId(null);
    }
  };

  const applySearch = useCallback(() => {
    setAppliedSearch(searchInput.trim());
    setParameter((current) => ({ ...current, page: 1 }));
  }, [searchInput]);

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
      width: 240,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Deskripsi",
      dataIndex: "description",
      width: 200,
      render: (value: string | null) => value || "-",
      ellipsis: true,
    },
    {
      title: "Status",
      key: "status",
      width: 190,
      render: (_, record) => {
        const status = getCertificateTemplateStatus(record);
        const issues = getCertificateReadiness(
          record.template_data,
          record.background_image,
        );
        const ready =
          (record.readiness?.ready ?? true) &&
          isCertificateTemplateReady(issues);
        const label =
          status === "published"
            ? "Dipublikasikan"
            : status === "archived"
              ? "Diarsipkan"
              : "Draf";
        return (
          <Space direction="vertical" size={2}>
            <Tag
              color={
                status === "published"
                  ? "green"
                  : status === "archived"
                    ? "default"
                    : "gold"
              }
            >
              {label}
            </Tag>
            <Text type={ready ? "success" : "danger"} style={{ fontSize: 12 }}>
              {ready ? "Siap diterbitkan" : "Perlu diperbaiki"}
            </Text>
          </Space>
        );
      },
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
      width: 260,
      render: (_, record) => {
        if (!canManage) return <Text type="secondary">Hanya lihat</Text>;

        const status = getCertificateTemplateStatus(record);
        const ready =
          (record.readiness?.ready ?? true) &&
          isCertificateTemplateReady(
            getCertificateReadiness(
              record.template_data,
              record.background_image,
            ),
          );
        const isMutating = mutatingId === record.id;
        const isInUse =
          (record.activity_usage_count || 0) > 0 ||
          (record.issued_certificate_count || 0) > 0;

        return (
          <Space size={4} wrap>
            <Tooltip title="Edit template">
              <Button
                size="small"
                icon={<EditOutlined />}
                style={TOUCH_ACTION_STYLE}
                aria-label={`Edit ${record.name}`}
                onClick={() =>
                  navigate(`/digital-certificate/${record.id}/edit`)
                }
              />
            </Tooltip>
            <Tooltip title="Duplikat sebagai draf">
              <Button
                size="small"
                icon={<CopyOutlined />}
                style={TOUCH_ACTION_STYLE}
                aria-label={`Duplikat ${record.name}`}
                loading={isMutating}
                onClick={() => handleDuplicate(record)}
              />
            </Tooltip>
            {status !== "published" && (
              <Tooltip title={ready ? "Publikasikan" : "Template belum siap"}>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  style={TOUCH_ACTION_STYLE}
                  disabled={!ready || isMutating}
                  aria-label={`Publikasikan ${record.name}`}
                  onClick={() => handleLifecycleChange(record, "published")}
                />
              </Tooltip>
            )}
            {status !== "archived" && (
              <Popconfirm
                title="Arsipkan template?"
                description="Template tidak dapat dipilih untuk penerbitan baru. Sertifikat lama tetap tersedia."
                onConfirm={() => handleLifecycleChange(record, "archived")}
                okText="Arsipkan"
                cancelText="Batal"
              >
                <Tooltip title="Arsipkan">
                  <Button
                    size="small"
                    icon={<InboxOutlined />}
                    style={TOUCH_ACTION_STYLE}
                    aria-label={`Arsipkan ${record.name}`}
                    disabled={isMutating}
                  />
                </Tooltip>
              </Popconfirm>
            )}
            {status === "archived" && (
              <Button
                size="small"
                disabled={isMutating}
                style={{ minHeight: 44 }}
                onClick={() => handleDuplicate(record)}
              >
                Edit salinan
              </Button>
            )}
            <Popconfirm
              title={`Hapus ${record.name}?`}
              description={
                isInUse
                  ? "Template masih digunakan dan tidak dapat dihapus. Arsipkan sebagai gantinya."
                  : "Template yang dihapus tidak dapat dikembalikan."
              }
              disabled={isInUse}
              onConfirm={() => handleDelete(record.id)}
              okText="Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title={isInUse ? "Template masih digunakan" : "Hapus"}>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  style={TOUCH_ACTION_STYLE}
                  aria-label={`Hapus ${record.name}`}
                  disabled={isInUse || isMutating}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
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
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SafetyCertificateOutlined
              style={{ fontSize: 24, color: "#1890ff" }}
            />
            <div>
              <Title level={1} style={{ fontSize: 18, margin: 0 }}>
                Sertifikat Digital
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Kelola template sertifikat digital
              </Text>
            </div>
          </div>
          {canManage && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              loading={creating}
            >
              Buat desain
            </Button>
          )}
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
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onPressEnter={applySearch}
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              aria-label="Cari template sertifikat"
            />
            <Button
              icon={<SearchOutlined />}
              type="primary"
              onClick={applySearch}
            >
              Cari
            </Button>
            <Select
              allowClear
              placeholder="Semua status"
              aria-label="Filter status template"
              value={statusFilter}
              options={STATUS_OPTIONS}
              style={{ width: 180 }}
              onChange={(value: CertificateTemplateStatus | undefined) => {
                setStatusFilter(value);
                setParameter((current) => ({ ...current, page: 1 }));
              }}
            />
          </Space>
          <Tooltip title="Refresh Data">
            <Button
              icon={<ReloadOutlined />}
              style={TOUCH_ACTION_STYLE}
              onClick={fetchData}
              loading={loading}
              aria-label="Muat ulang template"
            />
          </Tooltip>
        </div>
      </Card>

      {!canManage && (
        <Alert
          type="info"
          showIcon
          title="Akses hanya lihat"
          description="Anda dapat melihat template dan menerbitkan sertifikat dari halaman peserta. Perubahan template hanya tersedia untuk admin yang berwenang."
          style={{ marginTop: 12 }}
        />
      )}

      {loadError && (
        <Alert
          type="error"
          showIcon
          title="Template tidak dapat dimuat"
          description={loadError}
          action={<Button onClick={fetchData}>Coba lagi</Button>}
          style={{ marginTop: 12 }}
        />
      )}

      {/* Table */}
      <Table
        listId="pages/DigitalCertificate/CertificateList/index:1"
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
        scroll={{ x: 1200 }}
        size="small"
        bordered
        locale={{ emptyText: "Belum ada template pada filter ini" }}
      />

      {canManage && (
        <Modal
          title="Buat desain sertifikat"
          open={createModalOpen}
          onCancel={() => {
            setCreateModalOpen(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          okText="Buat desain"
          cancelText="Batal"
          confirmLoading={creating}
          destroyOnHidden
        >
          <Form
            scrollToFirstError={{ focus: true }}
            form={form}
            preserve={false}
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
              rules={[
                { required: true, message: "Nama template wajib diisi" },
                { max: 255, message: "Nama template maksimal 255 karakter" },
              ]}
            >
              <Input placeholder="Nama template" />
            </Form.Item>
            <Form.Item name="layout" label="Pilih desain awal">
              <Radio.Group
                className="certificate-starter-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                {STARTER_LAYOUTS.map((layout) => (
                  <Radio.Button
                    key={layout.value}
                    value={layout.value}
                    style={{ height: "auto", padding: 8, whiteSpace: "normal" }}
                  >
                    <TemplateThumbnail
                      width={150}
                      templateData={buildStarterTemplate(
                        "a4-landscape",
                        layout.value,
                      )}
                    />
                    <span>{layout.label}</span>
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>
            <Collapse
              onChange={(keys) => setAdvancedOpen(keys.length > 0)}
              items={[
                {
                  key: "settings",
                  label: "Pengaturan tambahan",
                  children: advancedOpen ? (
                    <>
                      <Form.Item name="description" label="Deskripsi">
                        <Input.TextArea rows={2} />
                      </Form.Item>
                      <Form.Item name="preset" label="Ukuran dokumen">
                        <Select options={CANVAS_PRESETS} />
                      </Form.Item>
                    </>
                  ) : null,
                },
              ]}
            />
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default CertificateList;
