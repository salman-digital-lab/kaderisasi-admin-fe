import { ResponsiveDialog as Modal } from "../../../components/common/Responsive/ResponsiveDialog";
import { ResponsiveTable as Table } from "../../../components/common/Responsive/ResponsiveTable";
import { ResponsiveFilters } from "../../../components/common/Responsive/ResponsiveFilters";
import { useAdminViewport } from "../../../hooks/useAdminViewport";
import {
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useRequest, useToggle } from "ahooks";
import {
  Alert,
  Button,
  Card,
  Grid,
  Input,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getActivity,
  getExportRegistrants,
  getRegistrants,
} from "../../../api/services/activity";
import {
  getIssuedCertificates,
  revokeCertificate,
} from "../../../api/services/certificateTemplate";
import type { Registrant } from "../../../types/model/activity";
import type { IssuedCertificate } from "../../../types/services/certificateTemplate";

import { getCustomFormByFeature } from "../../../api/services/customForm";
import {
  ALL_COLUMNS,
  ColumnConfig,
  generateTableColumns,
  loadColumnPreferences,
  saveColumnPreferences,
} from "./constants/columns";

import { ACTIVITY_REGISTRANT_STATUS_OPTIONS } from "../../../constants/options";
import { usePermissions } from "../../../stores/authStore";
import {
  canAccessCertificates,
  canRevokeCertificates,
} from "../../../utils/certificate-permissions";
import { getCertificateVerificationUrl } from "../../DigitalCertificate/utils/certificate-content";
import MembersListModal from "../ActivityDetail/components/Modal/MembersListModal";
import ColumnManager from "./components/ColumnManager";
import StatusBulkActions from "./components/StatusBulkActions";

interface FilterValues {
  search?: string;
  status?: string;
}

type ParticipantRow = Registrant & { activity_id: number };

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

const { Text } = Typography;
const TOUCH_ACTION_STYLE: React.CSSProperties = {
  minWidth: 44,
  minHeight: 44,
};

const ActivityParticipants = () => {
  const { compact } = useAdminViewport();
  const screens = Grid.useBreakpoint();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const permissions = usePermissions();
  const canAccessCertificateFeature = canAccessCertificates(permissions);
  const canRevoke = canRevokeCertificates(permissions);

  // Modal states
  const [addParticipantModal, { toggle: toggleAddParticipant }] = useToggle();

  // Table state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [revokingCertificate, setRevokingCertificate] = useState<number | null>(
    null,
  );
  const [revokeTarget, setRevokeTarget] = useState<IssuedCertificate | null>(
    null,
  );
  const [revokeReason, setRevokeReason] = useState("");

  // Pagination & sorting state
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
  });
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<FilterValues>({});
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState<string>();

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
    const ALWAYS_VISIBLE = new Set(["name", "created_at", "status"]);

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

  const { data: issuedCertificates, run: fetchIssuedCertificates } = useRequest(
    () =>
      getIssuedCertificates({
        activity_id: Number(id),
        registration_ids: (participantsData?.data || []).map((row) => row.id),
      }),
    {
      ready: canAccessCertificateFeature && Boolean(participantsData),
      refreshDeps: [id, participantsData],
    },
  );

  const issuedByRegistrationId = useMemo(() => {
    const map = new Map<number, IssuedCertificate>();
    issuedCertificates?.forEach((certificate) => {
      const current = map.get(certificate.registration_id);
      if (
        !current ||
        new Date(certificate.issued_at).getTime() >=
          new Date(current.issued_at).getTime()
      ) {
        map.set(certificate.registration_id, certificate);
      }
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

  // Handle search
  const handleSearch = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput || undefined,
      status: statusInput,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedRowKeys([]);
  }, [searchInput, statusInput]);

  // Handle status filter
  const handleStatusFilter = useCallback((value: string | undefined) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedRowKeys([]);
  }, []);

  // Sort the entire result set through the API before paginating.
  const handleTableChange = useCallback<
    NonNullable<TableProps<ParticipantRow>["onChange"]>
  >((paginationConfig, _filters, sorter, extra) => {
    if (extra.action === "sort" && !Array.isArray(sorter)) {
      setSortBy(String(sorter.columnKey || "created_at"));
      setSortOrder(sorter.order === "ascend" ? "asc" : "desc");
    }
    setPagination({
      page: extra.action === "sort" ? 1 : paginationConfig.current || 1,
      per_page: paginationConfig.pageSize || 50,
    });
    setSelectedRowKeys([]);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchParticipants();
    fetchIssuedCertificates();
    setSelectedRowKeys([]);
  }, [fetchIssuedCertificates, fetchParticipants]);

  const openCertificatePreview = useCallback((certificateId: number) => {
    const previewWindow = window.open(
      `/certificate-preview/${certificateId}`,
      "_blank",
    );
    if (previewWindow) previewWindow.opener = null;
  }, []);

  const handleViewCertificate = useCallback(
    (issued: IssuedCertificate) => {
      openCertificatePreview(issued.id);
    },
    [openCertificatePreview],
  );

  const handleCopyVerificationLink = useCallback(
    async (certificateCode: string) => {
      const url = getCertificateVerificationUrl(certificateCode);
      if (!url) {
        message.error(
          "VITE_PUBLIC_WEB_URL belum dikonfigurasi. Link tidak dapat disalin.",
        );
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        message.success("Link verifikasi disalin");
      } catch {
        message.error("Gagal menyalin link verifikasi");
      }
    },
    [],
  );

  const handleRevokeCertificate = useCallback(async () => {
    if (!revokeTarget || !canRevoke || !revokeReason.trim()) return;
    setRevokingCertificate(revokeTarget.id);
    try {
      await revokeCertificate(revokeTarget.id, {
        reason: revokeReason.trim(),
      });
      fetchIssuedCertificates();
      message.success("Sertifikat berhasil dicabut");
      setRevokeTarget(null);
      setRevokeReason("");
    } catch {
      // API errors are surfaced by the shared error handler.
    } finally {
      setRevokingCertificate(null);
    }
  }, [canRevoke, fetchIssuedCertificates, revokeReason, revokeTarget]);

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
    const cols = generateTableColumns(columns, sortBy, sortOrder) || [];

    // Check if activity has certificate template
    const hasCertificateTemplate =
      !!activity?.additional_config?.certificate_template_id;

    if (
      canAccessCertificateFeature &&
      (hasCertificateTemplate || issuedByRegistrationId.size > 0)
    ) {
      cols.push({
        title: "Sertifikat",
        dataIndex: "id",
        key: "certificate",
        width: 300,
        fixed: "right" as const,
        render: (_: unknown, record: ParticipantRow) => {
          const issued = issuedByRegistrationId.get(record.id);

          if (issued?.revoked_at) {
            return (
              <Space direction="vertical" size={2}>
                <Space size={4}>
                  <Tag color="red">Dicabut</Tag>
                  <Tooltip title="Lihat sertifikat yang dicabut">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      style={TOUCH_ACTION_STYLE}
                      aria-label="Lihat sertifikat yang dicabut"
                      onClick={() => handleViewCertificate(issued)}
                    />
                  </Tooltip>
                </Space>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {issued.revoked_reason || "Tanpa alasan"} ·{" "}
                  {dayjs(issued.revoked_at).format("DD MMM YYYY HH:mm")}
                  {issued.revoked_by_name
                    ? ` · ${issued.revoked_by_name}`
                    : issued.revoked_by
                      ? ` · Admin #${issued.revoked_by}`
                      : ""}
                </Text>
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
                    style={TOUCH_ACTION_STYLE}
                    aria-label="Lihat sertifikat"
                    onClick={() => handleViewCertificate(issued)}
                  />
                </Tooltip>
                <Tooltip title="Salin Link Verifikasi">
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    style={TOUCH_ACTION_STYLE}
                    aria-label="Salin link verifikasi sertifikat"
                    onClick={() =>
                      handleCopyVerificationLink(issued.certificate_code)
                    }
                  />
                </Tooltip>
                {canRevoke && (
                  <Tooltip title="Cabut Sertifikat">
                    <Button
                      type="text"
                      danger
                      icon={<StopOutlined />}
                      style={TOUCH_ACTION_STYLE}
                      aria-label="Cabut sertifikat"
                      loading={revokingCertificate === issued.id}
                      onClick={() => {
                        setRevokeTarget(issued);
                        setRevokeReason("");
                      }}
                    />
                  </Tooltip>
                )}
              </Space>
            );
          }

          if (!hasCertificateTemplate) {
            return <Tag>Template belum dipilih</Tag>;
          }

          if (record.status !== "LULUS KEGIATAN") {
            return <Tag color="gold">Belum memenuhi syarat</Tag>;
          }

          return (
            <Button
              type="link"
              onClick={() => navigate(`/activity/${id}/certificates`)}
            >
              Kelola sertifikat
            </Button>
          );
        },
      });
    }

    return screens.md
      ? cols
      : cols.map((col) => ({ ...col, fixed: undefined }));
  }, [
    columns,
    sortBy,
    sortOrder,
    screens.md,
    activity,
    id,
    canAccessCertificateFeature,
    canRevoke,
    handleCopyVerificationLink,
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
    preserveSelectedRowKeys: false,
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

      <Modal
        title="Cabut sertifikat"
        open={Boolean(revokeTarget)}
        okText="Cabut sertifikat"
        cancelText="Batal"
        okButtonProps={{
          danger: true,
          disabled: revokeReason.trim().length < 3,
        }}
        confirmLoading={Boolean(revokingCertificate)}
        onOk={handleRevokeCertificate}
        onCancel={() => {
          if (revokingCertificate) return;
          setRevokeTarget(null);
          setRevokeReason("");
        }}
      >
        <Alert
          type="warning"
          showIcon
          title="Sertifikat akan tetap tersimpan, tetapi ditandai tidak valid."
          style={{ marginBottom: 16 }}
        />
        <Input.TextArea
          value={revokeReason}
          onChange={(event) => setRevokeReason(event.target.value)}
          placeholder="Tuliskan alasan pencabutan"
          aria-label="Alasan pencabutan sertifikat"
          autoSize={{ minRows: 3, maxRows: 6 }}
          maxLength={500}
          showCount
        />
      </Modal>

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
          <ResponsiveFilters
            onApply={handleSearch}
            activeCount={
              [filters.search, filters.status].filter(Boolean).length
            }
            onReset={() => {
              setSearchInput("");
              setStatusInput(undefined);
              setFilters({});
              setPagination((prev) => ({ ...prev, page: 1 }));
              setSelectedRowKeys([]);
            }}
          >
            {({ apply }) => (
              <Space size={12} wrap>
                <Input.Search
                  placeholder="Cari nama atau email..."
                  allowClear
                  style={{ width: 240 }}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onSearch={apply}
                  aria-label="Cari peserta berdasarkan nama atau email"
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                />

                <Select
                  placeholder="Semua Status"
                  allowClear
                  style={{ width: 160 }}
                  options={statusOptions}
                  onChange={(value) => {
                    setStatusInput(value);
                    if (!compact) handleStatusFilter(value);
                  }}
                  value={statusInput}
                  aria-label="Status peserta"
                />
              </Space>
            )}
          </ResponsiveFilters>

          {/* Right: Actions */}
          <Space size={8} wrap>
            {selectedRowKeys.length > 0 && (
              <Tag color="blue" variant="filled" style={{ marginRight: 8 }}>
                {selectedRowKeys.length} dipilih
              </Tag>
            )}

            {
              <StatusBulkActions
                selectedRowKeys={selectedRowKeys}
                activityId={id || ""}
                customSelectionStatus={customSelectionStatus}
                onSuccess={handleRefresh}
              />
            }

            {canAccessCertificateFeature && (
              <Button
                icon={<SafetyCertificateOutlined />}
                onClick={() => navigate(`/activity/${id}/certificates`)}
              >
                Kelola sertifikat
              </Button>
            )}

            <Tooltip title="Export Data">
              <Button
                aria-label="Export Data"
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
                aria-label="Muat ulang peserta"
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
          listId="pages/Activity/ActivityParticipants/index:1"
          rowKey="id"
          columns={tableColumns}
          dataSource={participantsData?.data?.map((item: ParticipantRow) => ({
            ...item,
            activity_id: Number(id),
          }))}
          loading={participantsLoading}
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
          scroll={{
            x: tableColumns.reduce(
              (width, col) => width + Number(col.width || 200),
              48,
            ),
            y: "calc(100vh - 280px)",
          }}
          sticky={{ offsetHeader: 0 }}
          size="small"
          bordered
        />
      </div>
    </div>
  );
};

export default ActivityParticipants;
