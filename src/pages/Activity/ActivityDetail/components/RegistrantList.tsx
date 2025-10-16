import {
  Input,
  Col,
  Row,
  Card,
  Form,
  Button,
  Space,
  Table,
  Select,
  Skeleton,
  Dropdown,
  MenuProps,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DownloadOutlined,
  MailOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useRequest, useToggle } from "ahooks";
import { useParams } from "react-router-dom";

import {
  getActivity,
  getExportRegistrants,
  getRegistrants,
  putRegistrant,
} from "../../../../api/services/activity";

import { generateTableSchema, clearSchemaCache } from "../constants/schema";
import { useBulkActions } from "../hooks/useBulkActions";

import MembersListModal from "./Modal/MembersListModal";
import ChangeStatusModal from "./Modal/ChangesStatusModal";
import ChangeStatusByEmailModal from "./Modal/ChangeStatusByEmailModal";
import { ACTIVITY_REGISTRANT_STATUS_OPTIONS } from "../../../../constants/options";

type FieldType = {
  fullname?: string;
  status?: string;
};

const RegistrantList = () => {
  const { id } = useParams<{ id: string }>();

  const [form] = Form.useForm<FieldType>();

  const [modalState, { toggle: toggleModal }] = useToggle();
  const [modalChangeStatusState, { toggle: toggleChangeStatusModal }] =
    useToggle();
  const [
    modalChangeStatusByEmailState,
    { toggle: toggleChangeStatusByEmailModal },
  ] = useToggle();

  const [parameters, setParameter] = useState({
    page: 1,
    per_page: 25, // Increased default page size for better performance
    name: "",
    status: "",
  });

  const [mandatoryData, setMandatoryData] = useState<string[]>([]);
  const [customSelectionStatus, setCustomSelectionStatus] = useState<string[]>(
    [],
  );

  const [isExporting, setIsExporting] = useState(false);

  const { data, loading, run: fetchData } = useRequest(
    (params) =>
      getRegistrants(id, {
        page: String(params.page),
        per_page: String(params.per_page),
        name: params.name,
        status: params.status,
      }),
    {
      manual: true, // Don't auto-run on mount
      loadingDelay: 200, // Prevent flickering on quick requests
    },
  );

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData(parameters);
  }, []); // Only run once on mount

  // Fetch data when pagination changes (not search parameters)
  useEffect(() => {
    if (parameters.page > 1 || parameters.per_page !== 25) {
      fetchData(parameters);
    }
  }, [parameters.page, parameters.per_page]);

  // Bulk actions hook for better performance
  const bulkActions = useBulkActions({
    onStatusChange: async (ids: React.Key[], status: string) => {
      await putRegistrant({
        registrations_id: ids.map(String),
        status: status as any,
      });
      fetchData(parameters);
    },
    onExport: async (ids: React.Key[]) => {
      // Implementation for selective export if needed
      console.log("Exporting selected:", ids);
    },
  });

  // Search function that will be called only on button click
  const handleSearch = useCallback((searchParams: { name: string; status: string }) => {
    const newParams = {
      ...parameters,
      name: searchParams.name,
      status: searchParams.status,
      page: 1, // Reset to first page on search
    };
    setParameter(newParams);
    fetchData(newParams);
  }, [parameters, fetchData]);

  const handleExportRegistrants = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await getExportRegistrants(id);
      if (data) {
        const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-pendaftar-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [id]);

  useRequest(() => getActivity(Number(id)), {
    cacheKey: `activity-${id}`,
    onSuccess: (data) => {
      if (data && data.additional_config.mandatory_profile_data) {
        setMandatoryData(
          data.additional_config.mandatory_profile_data.map(
            (item) => item.name,
          ),
        );
      }
      if (data && data.additional_config.custom_selection_status) {
        setCustomSelectionStatus(
          data.additional_config.custom_selection_status,
        );
      }
    },
  });

  useEffect(() => {
    if (!modalState && !modalChangeStatusState)
      setTimeout(() => {
        fetchData(parameters);
      }, 500); // Reduced timeout for better UX
  }, [modalState, modalChangeStatusState, fetchData, parameters]);

  // Optimized table columns with memoization
  const tableColumns = useMemo(() => {
    return generateTableSchema(mandatoryData);
  }, [mandatoryData]);

  // Clear schema cache when mandatory data changes
  useEffect(() => {
    clearSchemaCache();
  }, [mandatoryData]);

  // Handle pagination changes
  const handleTableChange = useCallback((pagination: any) => {
    setParameter((prev) => ({
      ...prev,
      page: pagination.current || 1,
      per_page: pagination.pageSize || 25,
    }));
  }, []);

  // Dropdown menus for better UI organization
  const statusActionsMenu: MenuProps["items"] = [
    {
      key: "bulk-status",
      label: bulkActions.selectionInfo.hasSelection ? (
        `Ubah Status (${bulkActions.selectionInfo.count})`
      ) : (
        <Tooltip
          title="Pilih data terlebih dahulu untuk mengubah status"
          placement="right"
        >
          <span>Ubah Status ({bulkActions.selectionInfo.count})</span>
        </Tooltip>
      ),
      icon: <EditOutlined />,
      disabled: !bulkActions.selectionInfo.hasSelection,
      onClick: () => toggleChangeStatusModal(),
    },
    {
      key: "email-status",
      label: "Ubah Status Berdasarkan Email",
      icon: <MailOutlined />,
      onClick: () => toggleChangeStatusByEmailModal(),
    },
  ];

  const adminActionsMenu: MenuProps["items"] = [
    {
      key: "export",
      label: isExporting ? "Mengexport..." : "Export Data Semua Peserta (XLSX)",
      icon: <DownloadOutlined />,
      disabled: isExporting,
      onClick: handleExportRegistrants,
    },
    {
      key: "add-participant",
      label: "Tambah Peserta",
      icon: <PlusOutlined />,
      onClick: () => toggleModal(),
    },
  ];

  // Clear all selections when page changes
  useEffect(() => {
    bulkActions.clearSelection();
  }, [parameters.page, bulkActions.clearSelection]);

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <MembersListModal open={modalState} toggle={toggleModal} />
      <ChangeStatusModal
        open={modalChangeStatusState}
        toggle={toggleChangeStatusModal}
        selectedRegistrationID={bulkActions.selectedRowKeys}
        customSelectionStatus={customSelectionStatus}
      />
      <ChangeStatusByEmailModal
        open={modalChangeStatusByEmailState}
        toggle={toggleChangeStatusByEmailModal}
        activityId={id || ""}
        customSelectionStatus={customSelectionStatus}
      />
      <Card>
        <Form
          layout="vertical"
          form={form}
          onFinish={(val) => {
            const searchParams = {
              name: val.fullname || "",
              status: val.status || "",
            };
            handleSearch(searchParams);
          }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Nama Pendaftar" name="fullname">
                <Input
                  placeholder="Nama Pendaftar"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Status Pendaftaran" name="status">
                <Select
                  options={[
                    ...ACTIVITY_REGISTRANT_STATUS_OPTIONS,
                    ...(customSelectionStatus?.map((val) => ({
                      label: val,
                      value: val,
                    })) || []),
                  ]}
                  placeholder="Status Pendaftaran"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end">
            <Space>
              <Dropdown menu={{ items: statusActionsMenu }} trigger={["click"]}>
                <Button
                  icon={<EditOutlined />}
                  type={
                    bulkActions.selectionInfo.hasSelection ? "primary" : "default"
                  }
                  loading={bulkActions.selectionInfo.isProcessing}
                >
                  Ubah Status <DownOutlined />
                </Button>
              </Dropdown>
              <Dropdown menu={{ items: adminActionsMenu }} trigger={["click"]}>
                <Button icon={<DownloadOutlined />}>
                  Aksi Lainnya <DownOutlined />
                </Button>
              </Dropdown>
              <Button
                icon={<SearchOutlined />}
                type="primary"
                htmlType="submit"
              >
                Cari
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>

      <Card>
        {loading && !data ? (
          <div style={{ padding: "20px" }}>
            <Skeleton active paragraph={{ rows: 10 }} />
          </div>
        ) : (
          <Table
            rowKey="id"
            columns={tableColumns}
            dataSource={data?.data}
            pagination={{
              current: data?.meta.current_page,
              pageSize: data?.meta.per_page,
              showSizeChanger: true,
              pageSizeOptions: ["10", "25", "50", "100", "200"],
              total: data?.meta.total,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} dari ${total} data`,
              showQuickJumper: (data?.meta?.total || 0) > 100,
              size: "default",
            }}
            loading={loading && !!data} // Only show loading overlay if data exists
            onChange={handleTableChange}
            rowSelection={bulkActions.rowSelection}
            scroll={{ x: 1200, y: 600 }} // Added vertical scroll for better performance
            size="middle" // Compact size for better data density
            sticky={{
              offsetHeader: 64, // Adjust based on your header height
            }}
          />
        )}
      </Card>
    </Space>
  );
};

export default memo(RegistrantList);
