import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Skeleton,
  message,
} from "antd";
import {
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
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
import ParticipantStats from "./components/ParticipantStats";
import FilterPanel, { FilterValues } from "./components/FilterPanel";
import StatusBulkActions from "./components/StatusBulkActions";
import MembersListModal from "../ActivityDetail/components/Modal/MembersListModal";

const { Text } = Typography;

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
      refreshDeps: [id, pagination, sortBy, sortOrder],
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

  // Handle filter search
  const handleSearch = useCallback((values: FilterValues) => {
    setFilters(values);
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
    <div>
      {/* Add Participant Modal */}
      <MembersListModal
        open={addParticipantModal}
        toggle={toggleAddParticipant}
      />

      {/* Statistics */}
      <ParticipantStats
        total={stats?.total || 0}
        byStatus={stats?.by_status || {}}
        loading={statsLoading}
      />

      {/* Filter Panel */}
      <FilterPanel
        onSearch={handleSearch}
        customSelectionStatus={customSelectionStatus}
        loading={participantsLoading}
      />

      {/* Table Actions */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space>
            <StatusBulkActions
              selectedRowKeys={selectedRowKeys}
              activityId={id || ""}
              customSelectionStatus={customSelectionStatus}
              onSuccess={handleRefresh}
            />
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={isExporting}
            >
              Export
            </Button>
            <Button icon={<PlusOutlined />} onClick={toggleAddParticipant}>
              Tambah Peserta
            </Button>
          </Space>

          <Space>
            {selectedRowKeys.length > 0 && (
              <Text type="secondary">
                {selectedRowKeys.length} peserta dipilih
              </Text>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={participantsLoading}
            >
              Refresh
            </Button>
            <ColumnManager
              columns={columns}
              onColumnsChange={handleColumnsChange}
              activityId={id || ""}
            />
          </Space>
        </div>
      </Card>

      {/* Participants Table */}
      <Card>
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
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} dari ${total} data`,
            showQuickJumper: (participantsData?.meta?.total || 0) > 100,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400, y: 600 }}
          size="middle"
          sticky={{ offsetHeader: 64 }}
        />
      </Card>
    </div>
  );
};

export default ActivityParticipants;
