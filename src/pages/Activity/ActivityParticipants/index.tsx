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
  Alert,
  List,
  Modal,
  Typography,
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
import dayjs from "dayjs";
import type { TablePaginationConfig } from "antd/es/table";

import {
  getRegistrants,
  getActivity,
  getExportRegistrants,
} from "../../../api/services/activity";
import {
  getCertificateTemplate,
  getIssuedCertificates,
  issueBulkCertificates,
  issueSingleCertificate,
  revokeCertificate,
} from "../../../api/services/certificateTemplate";
import type {
  IssuedCertificate,
  IssueBulkCertificatesResult,
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
import { useUser } from "../../../stores/authStore";
import {
  canAccessCertificates,
  canIssueCertificates,
  canRevokeCertificates,
} from "../../../utils/certificate-permissions";
import { getCertificateVerificationUrl } from "../../DigitalCertificate/utils/certificate-content";
import {
  getCertificateReadiness,
  getCertificateTemplateStatus,
  isCertificateTemplateReady,
} from "../../DigitalCertificate/utils/certificate-readiness";

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
const MAX_BULK_CERTIFICATES = 100;
const TOUCH_ACTION_STYLE: React.CSSProperties = {
  minWidth: 44,
  minHeight: 44,
};

const ActivityParticipants = () => {
  const { id } = useParams<{ id: string }>();
  const user = useUser();
  const canAccessCertificateFeature = canAccessCertificates(user?.role);
  const canIssue = canIssueCertificates(user?.role);
  const canRevoke = canRevokeCertificates(user?.role);

  // Modal states
  const [addParticipantModal, { toggle: toggleAddParticipant }] = useToggle();

  // Table state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [certificateSelectionMode, setCertificateSelectionMode] =
    useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState<
    number | null
  >(null);
  const [bulkIssuing, setBulkIssuing] = useState(false);
  const [bulkResult, setBulkResult] =
    useState<IssueBulkCertificatesResult | null>(null);
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
  const assignedTemplateId =
    activity?.additional_config?.certificate_template_id;
  const {
    data: assignedTemplate,
    loading: assignedTemplateLoading,
    run: fetchAssignedTemplate,
  } = useRequest(() => getCertificateTemplate(Number(assignedTemplateId)), {
    ready: canAccessCertificateFeature && Boolean(assignedTemplateId),
    refreshDeps: [assignedTemplateId, canAccessCertificateFeature],
  });

  const assignedTemplateReady = useMemo(() => {
    if (!assignedTemplate) return false;
    return (
      getCertificateTemplateStatus(assignedTemplate) === "published" &&
      (assignedTemplate.readiness?.ready ?? true) &&
      isCertificateTemplateReady(
        getCertificateReadiness(
          assignedTemplate.template_data,
          assignedTemplate.background_image,
        ),
      )
    );
  }, [assignedTemplate]);
  const certificateIssuanceAvailable = canIssue && assignedTemplateReady;

  useEffect(() => {
    if (certificateIssuanceAvailable || !certificateSelectionMode) return;
    setCertificateSelectionMode(false);
    setSelectedRowKeys([]);
  }, [certificateIssuanceAvailable, certificateSelectionMode]);

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
  } = useRequest(
    () => getIssuedCertificates({ activity_id: Number(id), per_page: 500 }),
    {
      ready: !!id,
      refreshDeps: [id],
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
    setSelectedRowKeys([]);
  }, [searchInput]);

  // Handle status filter
  const handleStatusFilter = useCallback((value: string | undefined) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedRowKeys([]);
  }, []);

  // Handle table change (pagination)
  const handleTableChange = useCallback(
    (paginationConfig: TablePaginationConfig) => {
      setPagination({
        page: paginationConfig.current || 1,
        per_page: paginationConfig.pageSize || 50,
      });
      setSelectedRowKeys([]);
    },
    [],
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchParticipants();
    fetchIssuedCertificates();
    if (assignedTemplateId) fetchAssignedTemplate();
    setSelectedRowKeys([]);
  }, [
    assignedTemplateId,
    fetchAssignedTemplate,
    fetchIssuedCertificates,
    fetchParticipants,
  ]);

  const openCertificatePreview = useCallback((certificateId: number) => {
    const previewWindow = window.open(
      `/certificate-preview/${certificateId}`,
      "_blank",
    );
    if (previewWindow) previewWindow.opener = null;
  }, []);

  const handleIssueCertificate = useCallback(
    async (registrationId: number) => {
      if (!certificateIssuanceAvailable) return;
      const previewWindow = window.open("", "_blank");
      if (previewWindow) {
        previewWindow.opener = null;
        previewWindow.document.body.textContent =
          "Menyiapkan preview sertifikat…";
      }

      setGeneratingCertificate(registrationId);
      try {
        const data = await issueSingleCertificate({
          registration_id: registrationId,
        });
        fetchIssuedCertificates();
        if (data.certificate?.id && previewWindow) {
          previewWindow.location.href = `/certificate-preview/${data.certificate.id}`;
        } else if (previewWindow) {
          previewWindow.close();
        }
        message.success("Sertifikat peserta siap dilihat");
      } catch {
        if (previewWindow && !previewWindow.closed) previewWindow.close();
      } finally {
        setGeneratingCertificate(null);
      }
    },
    [certificateIssuanceAvailable, fetchIssuedCertificates],
  );

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

  const selectedCertificateSummary = useMemo(() => {
    const selectedIds = new Set(selectedRowKeys.map(Number));
    const selectedRows = (participantsData?.data || []).filter((participant) =>
      selectedIds.has(participant.id),
    );
    const alreadyIssued = selectedRows.filter((participant) =>
      issuedByRegistrationId.has(participant.id),
    );
    const ineligible = selectedRows.filter(
      (participant) =>
        participant.status !== "LULUS KEGIATAN" &&
        !issuedByRegistrationId.has(participant.id),
    );
    const eligibleIds = selectedRows
      .filter(
        (participant) =>
          participant.status === "LULUS KEGIATAN" &&
          !issuedByRegistrationId.has(participant.id),
      )
      .map((participant) => participant.id);

    return { eligibleIds, alreadyIssued, ineligible };
  }, [issuedByRegistrationId, participantsData?.data, selectedRowKeys]);

  const bulkResultDetails = useMemo(() => {
    if (!bulkResult) return [];
    const created = bulkResult.created || bulkResult.issued || [];
    return [
      ...created.map((certificate) => ({
        key: `created-${certificate.certificate?.id || certificate.participant.registration_id}`,
        status: "Dibuat",
        color: "green",
        registrationId: certificate.participant.registration_id,
        reason: certificate.certificate?.certificate_code,
      })),
      ...bulkResult.already_issued.map((certificate) => ({
        key: `existing-${certificate.certificate?.id || certificate.participant.registration_id}`,
        status: "Sudah terbit",
        color: "blue",
        registrationId: certificate.participant.registration_id,
        reason: certificate.certificate?.certificate_code,
      })),
      ...(bulkResult.skipped || []).map((item) => ({
        key: `skipped-${item.registration_id}`,
        status: "Dilewati",
        color: "gold",
        registrationId: item.registration_id,
        reason: item.reason,
      })),
      ...bulkResult.failed.map((item) => ({
        key: `failed-${item.registration_id}`,
        status: "Gagal",
        color: "red",
        registrationId: item.registration_id,
        reason: item.reason,
      })),
    ];
  }, [bulkResult]);

  const handleIssueBulk = useCallback(() => {
    const registrationIds = selectedCertificateSummary.eligibleIds.slice(
      0,
      MAX_BULK_CERTIFICATES,
    );
    if (!certificateIssuanceAvailable || registrationIds.length === 0) return;

    Modal.confirm({
      title: "Terbitkan sertifikat massal?",
      content: (
        <Space direction="vertical" size={4} style={{ marginTop: 8 }}>
          <Text>{registrationIds.length} peserta memenuhi syarat.</Text>
          {selectedCertificateSummary.alreadyIssued.length > 0 && (
            <Text type="secondary">
              {selectedCertificateSummary.alreadyIssued.length} sudah memiliki
              sertifikat dan tidak dikirim ulang.
            </Text>
          )}
          {selectedCertificateSummary.ineligible.length > 0 && (
            <Text type="secondary">
              {selectedCertificateSummary.ineligible.length} belum berstatus
              LULUS KEGIATAN dan dilewati.
            </Text>
          )}
          {selectedCertificateSummary.eligibleIds.length >
            MAX_BULK_CERTIFICATES && (
            <Text type="warning">
              Maksimal {MAX_BULK_CERTIFICATES} sertifikat per permintaan;
              pilihan sisanya tetap dipilih untuk batch berikutnya.
            </Text>
          )}
        </Space>
      ),
      okText: `Terbitkan ${registrationIds.length}`,
      cancelText: "Batal",
      onOk: async () => {
        setBulkIssuing(true);
        try {
          const result = await issueBulkCertificates({
            registration_ids: registrationIds,
          });
          setBulkResult(result);
          setSelectedRowKeys(
            selectedCertificateSummary.eligibleIds.slice(MAX_BULK_CERTIFICATES),
          );
          fetchIssuedCertificates();
        } finally {
          setBulkIssuing(false);
        }
      },
    });
  }, [
    certificateIssuanceAvailable,
    fetchIssuedCertificates,
    selectedCertificateSummary,
  ]);

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

          if (!certificateIssuanceAvailable) {
            return <Tag color="red">Penerbitan tidak tersedia</Tag>;
          }

          return (
            <Tooltip title="Terbitkan Sertifikat">
              <Button
                type="text"
                icon={<SafetyCertificateOutlined />}
                style={TOUCH_ACTION_STYLE}
                aria-label="Terbitkan sertifikat"
                loading={generatingCertificate === record.id}
                onClick={() =>
                  Modal.confirm({
                    title: "Terbitkan sertifikat?",
                    content:
                      "Snapshot template dan data peserta akan dikunci untuk sertifikat ini.",
                    okText: "Terbitkan",
                    cancelText: "Batal",
                    onOk: () => handleIssueCertificate(record.id),
                  })
                }
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
    canAccessCertificateFeature,
    certificateIssuanceAvailable,
    canRevoke,
    generatingCertificate,
    handleCopyVerificationLink,
    handleIssueCertificate,
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
    getCheckboxProps: (record: ParticipantRow) => {
      if (!certificateSelectionMode) return {};
      const alreadyIssued = issuedByRegistrationId.has(record.id);
      const statusEligible = record.status === "LULUS KEGIATAN";
      const reason = alreadyIssued
        ? "Sertifikat sudah pernah diterbitkan"
        : !statusEligible
          ? "Peserta belum berstatus LULUS KEGIATAN"
          : undefined;
      return {
        disabled: Boolean(reason),
        title: reason,
        "aria-label":
          reason || `Pilih ${record.name} untuk penerbitan sertifikat`,
      };
    },
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

      <Modal
        title="Hasil penerbitan sertifikat"
        open={Boolean(bulkResult)}
        footer={
          <Button type="primary" onClick={() => setBulkResult(null)}>
            Selesai
          </Button>
        }
        onCancel={() => setBulkResult(null)}
        width={640}
      >
        {bulkResult && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space wrap>
              <Tag color="green">{bulkResult.total_created} dibuat</Tag>
              <Tag color="blue">
                {bulkResult.total_already_issued} sudah terbit
              </Tag>
              <Tag color="gold">{bulkResult.total_skipped} dilewati</Tag>
              <Tag color="red">{bulkResult.total_failed} gagal</Tag>
            </Space>
            <List
              size="small"
              bordered
              dataSource={bulkResultDetails}
              locale={{ emptyText: "Tidak ada detail hasil." }}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <Tag color={item.color}>{item.status}</Tag>
                    <Text>Registrasi #{item.registrationId}</Text>
                    {item.reason && <Text type="secondary">{item.reason}</Text>}
                  </Space>
                </List.Item>
              )}
              style={{ maxHeight: 360, overflow: "auto" }}
            />
          </Space>
        )}
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
          <Space size={12} wrap>
            <Input.Search
              placeholder="Cari nama atau email..."
              allowClear
              style={{ width: 240 }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={handleSearch}
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

            {!certificateSelectionMode && (
              <StatusBulkActions
                selectedRowKeys={selectedRowKeys}
                activityId={id || ""}
                customSelectionStatus={customSelectionStatus}
                onSuccess={handleRefresh}
              />
            )}

            {certificateIssuanceAvailable && assignedTemplateId && (
              <Button
                type={certificateSelectionMode ? "primary" : "default"}
                icon={<SafetyCertificateOutlined />}
                onClick={() => {
                  setCertificateSelectionMode((current) => !current);
                  setSelectedRowKeys([]);
                }}
              >
                {certificateSelectionMode
                  ? "Selesai pilih sertifikat"
                  : "Pilih untuk sertifikat"}
              </Button>
            )}

            {certificateSelectionMode &&
              certificateIssuanceAvailable &&
              assignedTemplateId &&
              selectedCertificateSummary.eligibleIds.length > 0 && (
                <Button
                  icon={<SendOutlined />}
                  onClick={handleIssueBulk}
                  loading={bulkIssuing}
                >
                  Terbitkan{" "}
                  {Math.min(
                    selectedCertificateSummary.eligibleIds.length,
                    MAX_BULK_CERTIFICATES,
                  )}{" "}
                  Sertifikat
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

      {canIssue && !assignedTemplateId && (
        <Alert
          type="warning"
          showIcon
          title="Template sertifikat belum dipilih"
          description="Pilih template yang sudah dipublikasikan di detail kegiatan sebelum menerbitkan sertifikat."
          style={{ marginTop: 12 }}
        />
      )}

      {canIssue && assignedTemplateId && (
        <Alert
          type={
            assignedTemplateLoading
              ? "info"
              : assignedTemplateReady
                ? "success"
                : "error"
          }
          showIcon
          title={
            assignedTemplateLoading
              ? "Memeriksa template sertifikat"
              : assignedTemplateReady
                ? `Template siap: ${assignedTemplate?.name}`
                : "Template yang dipilih belum dapat digunakan"
          }
          description={
            assignedTemplateLoading
              ? "Memeriksa kesiapan template…"
              : assignedTemplate
                ? `Status template: ${getCertificateTemplateStatus(assignedTemplate)}. Publikasikan dan perbaiki semua masalah kesiapan sebelum menerbitkan.`
                : "Template tidak dapat dimuat. Coba muat ulang sebelum menerbitkan."
          }
          action={
            !assignedTemplateReady ? (
              <Button size="small" onClick={fetchAssignedTemplate}>
                Periksa ulang
              </Button>
            ) : undefined
          }
          style={{ marginTop: 12 }}
        />
      )}

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
