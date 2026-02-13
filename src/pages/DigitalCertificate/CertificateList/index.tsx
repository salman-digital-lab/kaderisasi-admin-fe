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
import { CertificateTemplate } from "../../../types/services/certificateTemplate";
import { Pagination } from "../../../types/services/base";

const { Text } = Typography;

const CertificateList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
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

  const handleCreate = async () => {
    setCreating(true);
    try {
      const template = await createCertificateTemplate({
        name: "Template Baru",
        templateData: {
          backgroundUrl: null,
          elements: [],
          canvasWidth: 800,
          canvasHeight: 566,
        },
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
              onClick={() =>
                navigate(`/digital-certificate/${record.id}/edit`)
              }
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
            onClick={handleCreate}
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
    </div>
  );
};

export default CertificateList;
