import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Skeleton,
  message,
  Input,
  Select,
  Tag,
  Tooltip,
  Card,
  Popconfirm,
} from "antd";
import {
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useRequest, useToggle } from "ahooks";

import {
  getRegistrants,
  getActivity,
  getExportRegistrants,
} from "../../../api/services/activity";
import {
  getIssuedCertificates,
  issueBulkCertificates,
  issueSingleCertificate,
  revokeCertificate,
} from "../../../api/services/certificateTemplate";
import type {
  CertificatePayload,
  IssuedCertificate,
} from "../../../types/services/certificateTemplate";
import type { Registrant } from "../../../types/model/activity";

import {
  ALL_COLUMNS,
  ColumnConfig,
  generateTableColumns,
  loadColumnPreferences,
  saveColumnPreferences,
} from "./constants/columns";
import { getCustomFormByFeature } from "../../../api/services/customForm";

import ColumnManager from "./components/ColumnManager";
import StatusBulkActions from "./components/StatusBulkActions";
import MembersListModal from "../ActivityDetail/components/Modal/MembersListModal";
import { ACTIVITY_REGISTRANT_STATUS_OPTIONS } from "../../../constants/options";

interface FilterValues {
  search?: string;
  status?: string;
}

type ParticipantRow = Registrant & { activity_id: number };

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

const webAppUrl =
  import.meta.env.VITE_PUBLIC_WEB_URL || "http://localhost:3000";

function buildCertificatePayloadFromIssued(
  issued: IssuedCertificate,
): CertificatePayload {
  return {
    activity: {
      id: issued.activity_id,
      name: issued.participant_snapshot.activity_name,
      activity_start: null,
    },
    template: issued.template_snapshot,
    participant: issued.participant_snapshot,
    certificate: {
      id: issued.id,
      certificate_code: issued.certificate_code,
      registration_id: issued.registration_id,
      activity_id: issued.activity_id,
      template_id: issued.template_id,
      issued_at: issued.issued_at,
      revoked_at: issued.revoked_at,
      revoked_reason: issued.revoked_reason,
    },
  };
}

const ActivityParticipants = () => {
  const { id } = useParams<{ id: string }>();

  // Modal states
  const [addParticipantModal, { toggle: toggleAddParticipant }] = useToggle();

  // Table state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState<
    number | null
  >(null);
  const [bulkIssuing, setBulkIssuing] = useState(false);
  const [revokingCertificate, setRevokingCertificate] = useState<number | null>(
    null,
  );

  // Pagination & sorting state
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
  });
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<FilterValues>({});
  const [searchInput, setSearchInput] = useState("");

  // Fetch activity details
  const { data: activity, loading: activityLoading } = useRequest(
    () => getActivity(Number(id)),
    {
      cacheKey: `activity-${id}`,
    },
  );

  // Fetch custom form to determine which profile columns to show
  const { data: customForm, loading: customFormLoading } = useRequest(
    () => getCustomFormByFeature("activity_registration", id!),
    {
      ready: !!id,
      cacheKey: `custom-form-activity-${id}`,
    },
  );

  // Derive columns allowed by the custom form's profile section (Pertanyaan Dasar)
  const formAllowedColumns = useMemo((): ColumnConfig[] => {
    const ALWAYS_VISIBLE = new Set(["name", "status"]);

    if (customForm) {
      const profileSection = customForm.form_schema.fields[0];
      const profileKeys = new Set(
        profileSection?.fields.map((f) => f.key) ?? [],
      );
      return ALL_COLUMNS.filter(
        (col) => ALWAYS_VISIBLE.has(col.key) || profileKeys.has(col.key),
      );
    }

    // No custom form configured — show all columns
    return ALL_COLUMNS;
  }, [customForm]);

  // Load column preferences from localStorage, constrained to form-allowed columns
  useEffect(() => {
    if (!id || customFormLoading) return;

    const savedVisibility = new Map(
      (loadColumnPreferences(id) ?? []).map((c) => [c.key, c.visible]),
    );
    setColumns(
      formAllowedColumns.map((col) => ({
        ...col,
        visible: savedVisibility.get(col.key) ?? col.visible,
      })),
    );
  }, [id, customFormLoading, formAllowedColumns]);

  // Fetch participants
  const {
    data: participantsData,
    loading: participantsLoading,
    run: fetchParticipants,
  } = useRequest(
    () =>
      getRegistrants(id, {
        page: String(pagination.page),
        per_page: String(pagination.per_page),
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filters,
      }),
    {
      refreshDeps: [id, pagination, sortBy, sortOrder, filters],
      loadingDelay: 200,
    },
  );

  const {
    data: issuedCertificates,
    loading: certificatesLoading,
    run: fetchIssuedCertificates,
  } = useRequest(() => getIssuedCertificates(Number(id)), {
    ready: !!id,
    refreshDeps: [id],
  });

  const issuedByRegistrationId = useMemo(() => {
    const map = new Map<number, IssuedCertificate>();
    issuedCertificates?.forEach((certificate) => {
      map.set(certificate.registration_id, certificate);
    });
    return map;
  }, [issuedCertificates]);

  // Handle column changes
  const handleColumnsChange = useCallback(
    (newColumns: ColumnConfig[]) => {
      setColumns(newColumns);
      if (id) {
        saveColumnPreferences(id, newColumns);
      }
    },
    [id],
  );

  // Handle sort
  const handleSort = useCallback(
    (field: string) => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortOrder("asc");
      }
      setPagination((prev) => ({ ...prev, page: 1 }));
    },
    [sortBy],
  );

  // Handle search
  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchInput]);

  // Handle status filter
  const handleStatusFilter = useCallback((value: string | undefined) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Handle table change (pagination)
  const handleTableChange = useCallback((paginationConfig: any) => {
    setPagination({
      page: paginationConfig.current || 1,
      per_page: paginationConfig.pageSize || 50,
    });
    setSelectedRowKeys([]);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchParticipants();
    fetchIssuedCertificates();
    setSelectedRowKeys([]);
  }, [fetchParticipants, fetchIssuedCertificates]);

  const openCertificatePreview = useCallback((data: CertificatePayload) => {
    sessionStorage.setItem("certificatePreview", JSON.stringify(data));
    window.open("/certificate-preview", "_blank");
  }, []);

  const handleIssueCertificate = useCallback(
    async (registrationId: number) => {
      setGeneratingCertificate(registrationId);
      try {
        const data = await issueSingleCertificate({
          registration_id: registrationId,
        });
        fetchIssuedCertificates();
        openCertificatePreview(data);
        message.success("Sertifikat berhasil diterbitkan");
      } catch {
        message.error("Gagal menerbitkan sertifikat");
      } finally {
        setGeneratingCertificate(null);
      }
    },
    [fetchIssuedCertificates, openCertificatePreview],
  );

  const handleViewCertificate = useCallback(
    (issued: IssuedCertificate) => {
      openCertificatePreview(buildCertificatePayloadFromIssued(issued));
    },
    [openCertificatePreview],
  );

  const handleCopyVerificationLink = useCallback(
    async (certificateCode: string) => {
      const url = `${webAppUrl}/certificate/${certificateCode}`;
      try {
        await navigator.clipboard.writeText(url);
        message.success("Link verifikasi disalin");
      } catch {
        message.error("Gagal menyalin link verifikasi");
      }
    },
    [],
  );

  const handleRevokeCertificate = useCallback(
    async (certificateId: number) => {
      setRevokingCertificate(certificateId);
      try {
        await revokeCertificate(certificateId, {
          reason: "Dicabut oleh admin",
        });
        fetchIssuedCertificates();
        message.success("Sertifikat berhasil dicabut");
      } catch {
        message.error("Gagal mencabut sertifikat");
      } finally {
        setRevokingCertificate(null);
      }
    },
    [fetchIssuedCertificates],
  );

  const handleIssueBulk = useCallback(async () => {
    setBulkIssuing(true);
    try {
      const result = await issueBulkCertificates({
        registration_ids: selectedRowKeys.map((key) => Number(key)),
      });
      fetchIssuedCertificates();
      message.success(
        `${result.total_issued} sertifikat diterbitkan, ${result.total_skipped} dilewati`,
      );
    } catch {
      message.error("Gagal menerbitkan sertifikat massal");
    } finally {
      setBulkIssuing(false);
    }
  }, [fetchIssuedCertificates, selectedRowKeys]);

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await getExportRegistrants(id);
      if (data) {
        const blob = new Blob([data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `peserta-${activity?.name || "kegiatan"}-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        message.success("Export berhasil");
      }
    } catch {
      message.error("Export gagal");
    } finally {
      setIsExporting(false);
    }
  }, [id, activity?.name]);

  // Generate table columns
  const tableColumns = useMemo(() => {
    const cols =
      generateTableColumns(columns, sortBy, sortOrder, handleSort) || [];

    // Check if activity has certificate template
    const hasCertificateTemplate =
      !!activity?.additional_config?.certificate_template_id;

    // Add certificate column for LULUS KEGIATAN participants
    if (hasCertificateTemplate) {
      cols.push({
        title: "Sertifikat",
        dataIndex: "id",
        key: "certificate",
        width: 220,
        fixed: "right" as const,
        render: (_: unknown, record: ParticipantRow) => {
          if (record.status !== "LULUS KEGIATAN") {
            return null;
          }

          const issued = issuedByRegistrationId.get(record.id);

          if (issued?.revoked_at) {
            return (
              <Space size={4}>
                <Tag color="red">Dicabut</Tag>
                <Tooltip title="Lihat Sertifikat">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewCertificate(issued)}
                  />
                </Tooltip>
              </Space>
            );
          }

          if (issued) {
            return (
              <Space size={4}>
                <Tag color="green">Terbit</Tag>
                <Tooltip title="Lihat Sertifikat">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewCertificate(issued)}
                  />
                </Tooltip>
                <Tooltip title="Salin Link Verifikasi">
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() =>
                      handleCopyVerificationLink(issued.certificate_code)
                    }
                  />
                </Tooltip>
                <Popconfirm
                  title="Cabut sertifikat?"
                  description="Sertifikat yang dicabut akan tampil tidak valid di halaman publik."
                  okText="Cabut"
                  cancelText="Batal"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleRevokeCertificate(issued.id)}
                >
                  <Tooltip title="Cabut Sertifikat">
                    <Button
                      type="text"
                      danger
                      icon={<StopOutlined />}
                      loading={revokingCertificate === issued.id}
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            );
          }

          return (
            <Tooltip title="Terbitkan Sertifikat">
              <Button
                type="text"
                icon={<SafetyCertificateOutlined />}
                loading={generatingCertificate === record.id}
                onClick={() => handleIssueCertificate(record.id)}
              />
            </Tooltip>
          );
        },
      });
    }

    return cols;
  }, [
    columns,
    sortBy,
    sortOrder,
    handleSort,
    activity,
    generatingCertificate,
    handleCopyVerificationLink,
    handleIssueCertificate,
    handleRevokeCertificate,
    handleViewCertificate,
    issuedByRegistrationId,
    revokingCertificate,
  ]);

  // Custom selection status from activity
  const customSelectionStatus = useMemo(
    () => activity?.additional_config?.custom_selection_status || [],
    [activity],
  );

  // Status options
  const statusOptions = useMemo(
    () => [
      ...ACTIVITY_REGISTRANT_STATUS_OPTIONS,
      ...(customSelectionStatus?.map((val: string) => ({
        label: val,
        value: val,
      })) || []),
    ],
    [customSelectionStatus],
  );

  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    preserveSelectedRowKeys: true,
  };

  if (activityLoading || customFormLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active />
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      {/* Add Participant Modal */}
      <MembersListModal
        open={addParticipantModal}
        toggle={toggleAddParticipant}
      />

      {/* Filter Section */}
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
          {/* Left: Search & Filter */}
          <Space size={12} wrap>
            <Input.Search
              placeholder="Cari nama atau email..."
              allowClear
              style={{ width: 240 }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            />

            <Select
              placeholder="Semua Status"
              allowClear
              style={{ width: 160 }}
              options={statusOptions}
              onChange={handleStatusFilter}
              value={filters.status}
            />
          </Space>

          {/* Right: Actions */}
          <Space size={8} wrap>
            {selectedRowKeys.length > 0 && (
              <Tag color="blue" variant="filled" style={{ marginRight: 8 }}>
                {selectedRowKeys.length} dipilih
              </Tag>
            )}

            <StatusBulkActions
              selectedRowKeys={selectedRowKeys}
              activityId={id || ""}
              customSelectionStatus={customSelectionStatus}
              onSuccess={handleRefresh}
            />

            {!!activity?.additional_config?.certificate_template_id &&
              selectedRowKeys.length > 0 && (
                <Button
                  icon={<SendOutlined />}
                  onClick={handleIssueBulk}
                  loading={bulkIssuing}
                >
                  Terbitkan Sertifikat
                </Button>
              )}

            <Tooltip title="Export Data">
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={isExporting}
              />
            </Tooltip>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={toggleAddParticipant}
            >
              Tambah
            </Button>

            <Tooltip placement="left" title="Refresh Data">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={participantsLoading}
              />
            </Tooltip>

            <ColumnManager
              columns={columns}
              defaultColumns={formAllowedColumns}
              onColumnsChange={handleColumnsChange}
              activityId={id || ""}
            />
          </Space>
        </div>
      </Card>

      {/* Participants Table */}
      <div style={{ marginTop: 12 }}>
        <Table
          rowKey="id"
          columns={tableColumns}
          dataSource={participantsData?.data?.map((item: ParticipantRow) => ({
            ...item,
            activity_id: Number(id),
          }))}
          loading={participantsLoading || certificatesLoading}
          rowSelection={rowSelection}
          pagination={{
            current: participantsData?.meta?.current_page || pagination.page,
            pageSize: participantsData?.meta?.per_page || pagination.per_page,
            total: participantsData?.meta?.total,
            showSizeChanger: true,
            pageSizeOptions: ["25", "50", "100", "200"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} dari ${total}`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400, y: "calc(100vh - 280px)" }}
          sticky={{ offsetHeader: 0 }}
          size="small"
          bordered
        />
      </div>
    </div>
  );
};

export default ActivityParticipants;
