import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Typography,
  Skeleton,
  message,
  Input,
  Select,
  Tag,
  Tooltip,
} from "antd";
import {
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useRequest, useToggle } from "ahooks";

import {
  getRegistrants,
  getRegistrantStatistics,
  getActivity,
  getExportRegistrants,
} from "../../../api/services/activity";

import {
  ColumnConfig,
  generateTableColumns,
  getDefaultColumns,
  loadColumnPreferences,
  saveColumnPreferences,
} from "./constants/columns";

import ColumnManager from "./components/ColumnManager";
import StatusBulkActions from "./components/StatusBulkActions";
import MembersListModal from "../ActivityDetail/components/Modal/MembersListModal";
import { ACTIVITY_REGISTRANT_STATUS_OPTIONS } from "../../../constants/options";

const { Text } = Typography;

interface FilterValues {
  search?: string;
  status?: string;
}

const ActivityParticipants = () => {
  const { id } = useParams<{ id: string }>();

  // Modal states
  const [addParticipantModal, { toggle: toggleAddParticipant }] = useToggle();

  // Table state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination & sorting state
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
  });
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<FilterValues>({});
  const [searchInput, setSearchInput] = useState("");

  // Load column preferences from localStorage
  useEffect(() => {
    if (id) {
      const saved = loadColumnPreferences(id);
      setColumns(saved || getDefaultColumns());
    }
  }, [id]);

  // Fetch activity details
  const { data: activity, loading: activityLoading } = useRequest(
    () => getActivity(Number(id)),
    {
      cacheKey: `activity-${id}`,
    },
  );

  // Fetch participant statistics
  const {
    data: stats,
    loading: statsLoading,
    run: refreshStats,
  } = useRequest(() => getRegistrantStatistics(id), {
    refreshDeps: [id],
  });

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
    refreshStats();
    setSelectedRowKeys([]);
  }, [fetchParticipants, refreshStats]);

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
    } catch (error) {
      message.error("Export gagal");
    } finally {
      setIsExporting(false);
    }
  }, [id, activity?.name]);

  // Generate table columns
  const tableColumns = useMemo(
    () => generateTableColumns(columns, sortBy, sortOrder, handleSort),
    [columns, sortBy, sortOrder, handleSort],
  );

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

  if (activityLoading) {
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

      {/* Compact Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
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

          <div
            style={{
              width: 1,
              height: 24,
              background: "#f0f0f0",
              margin: "0 4px",
            }}
          />

          <Text type="secondary" style={{ fontSize: 13 }}>
            Total:{" "}
            <Text strong>{statsLoading ? "..." : stats?.total || 0}</Text>
          </Text>
        </Space>

        {/* Right: Actions */}
        <Space size={8} wrap>
          {selectedRowKeys.length > 0 && (
            <Tag color="blue" bordered={false} style={{ marginRight: 8 }}>
              {selectedRowKeys.length} dipilih
            </Tag>
          )}

          <StatusBulkActions
            selectedRowKeys={selectedRowKeys}
            activityId={id || ""}
            customSelectionStatus={customSelectionStatus}
            onSuccess={handleRefresh}
          />

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

          <Tooltip title="Refresh Data">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={participantsLoading}
            />
          </Tooltip>

          <ColumnManager
            columns={columns}
            onColumnsChange={handleColumnsChange}
            activityId={id || ""}
          />
        </Space>
      </div>

      {/* Participants Table */}
      <Table
        rowKey="id"
        columns={tableColumns}
        dataSource={participantsData?.data}
        loading={participantsLoading}
        rowSelection={rowSelection}
        pagination={{
          current: participantsData?.meta?.current_page || pagination.page,
          pageSize: participantsData?.meta?.per_page || pagination.per_page,
          total: participantsData?.meta?.total,
          showSizeChanger: true,
          pageSizeOptions: ["25", "50", "100", "200"],
          showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total}`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1400, y: "calc(100vh - 280px)" }}
        sticky={{ offsetHeader: 0 }}
      />
    </div>
  );
};

export default ActivityParticipants;
