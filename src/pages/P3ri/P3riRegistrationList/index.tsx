import { useRequest } from "ahooks";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Input, Select, Space, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  exportP3riRegistrations,
  getP3riForm,
  getP3riRegistrations,
} from "../../../api/services/p3ri";
import PageHeader from "../../../components/common/PageHeader";
import LoadErrorAlert from "../../../components/common/LoadErrorAlert";
import { ResponsiveFilters } from "../../../components/common/Responsive/ResponsiveFilters";
import { ResponsiveTable as Table } from "../../../components/common/Responsive/ResponsiveTable";
import { NAV_LABELS } from "../../../constants/navigation";
import { usePermissions } from "../../../stores/authStore";
import { formatDateTime } from "../../../utils/date-format";
import {
  P3riRegistration,
  P3riRegistrationFilter,
  P3riStatus,
} from "../../../types/model/p3ri";
import {
  P3RI_STATUSES,
  P3RI_STATUS_COLORS,
  P3RI_STATUS_LABELS,
  P3RI_STATUS_OPTIONS,
  divisionName,
} from "../constants";

const GENDER_OPTIONS = [
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
];

const RANK_OPTIONS = [1, 2, 3].map((rank) => ({
  value: rank,
  label: `Pilihan ${rank}`,
}));

export default function P3riRegistrationList() {
  const permissions = usePermissions();
  const canExport = permissions.includes("p3ri.registrations.export");
  const [parameters, setParameters] = useState<P3riRegistrationFilter>({
    page: 1,
    per_page: 20,
  });
  const [status, setStatus] = useState<P3riStatus>();
  const [division, setDivision] = useState<string>();
  const [rank, setRank] = useState<number>();
  const [gender, setGender] = useState<string>();
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data: form } = useRequest(getP3riForm);
  const { data, loading, error, refresh } = useRequest(
    () => getP3riRegistrations(parameters),
    { refreshDeps: [parameters] },
  );

  const apply = () =>
    setParameters((prev) => ({
      ...prev,
      page: 1,
      status,
      division,
      choice_rank: division ? rank : undefined,
      gender,
      search: search.trim() || undefined,
    }));

  const reset = () => {
    setStatus(undefined);
    setDivision(undefined);
    setRank(undefined);
    setGender(undefined);
    setSearch("");
    setParameters((prev) => ({ page: 1, per_page: prev.per_page }));
  };

  const pickStatus = (value?: P3riStatus) => {
    setStatus(value);
    setParameters((prev) => ({ ...prev, page: 1, status: value }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const filter = { ...parameters, page: undefined, per_page: undefined };
      const blob = await exportP3riRegistrations(filter);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Pendaftar-P3RI-1448-H.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Error is already shown by the API function
    } finally {
      setExporting(false);
    }
  };

  const divisionOptions = form?.divisions.map((d) => ({
    value: d.code,
    label: d.name,
  }));
  const total = P3RI_STATUSES.reduce(
    (sum, key) => sum + (data?.counts[key] ?? 0),
    0,
  );

  const columns: ColumnsType<P3riRegistration> = [
    {
      title: "Nama",
      key: "name",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Link to={`/p3ri/${record.id}`}>
            {String(record.answers.common.nama_lengkap ?? record.email)}
          </Link>
          <span style={{ color: "var(--app-color-text-secondary)" }}>
            {record.email}
          </span>
        </Space>
      ),
    },
    {
      title: "Jenis Kelamin",
      key: "gender",
      render: (_, record) => String(record.answers.common.jenis_kelamin ?? "-"),
    },
    {
      title: "Instansi",
      key: "institution",
      render: (_, record) => String(record.answers.common.instansi ?? "-"),
    },
    ...[0, 1, 2].map((index) => ({
      title: `Pilihan ${index + 1}`,
      key: `choice-${index}`,
      render: (_: unknown, record: P3riRegistration) =>
        record.choices[index] ? divisionName(form, record.choices[index]) : "-",
    })),
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color={P3RI_STATUS_COLORS[record.status]}>
            {P3RI_STATUS_LABELS[record.status]}
          </Tag>
          {record.accepted_division && (
            <span>{divisionName(form, record.accepted_division)}</span>
          )}
        </Space>
      ),
    },
    {
      title: "Waktu Daftar",
      key: "submitted_at",
      render: (_, record) => formatDateTime(record.submitted_at),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title={NAV_LABELS.p3ri}
        description="Tinjau pendaftar panitia P3RI 1448 H dan perbarui status seleksinya."
        extra={
          canExport && (
            <Button
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={handleExport}
            >
              Ekspor Excel
            </Button>
          )
        }
      />
      {(error || (!loading && !data)) && (
        <LoadErrorAlert
          title="Daftar pendaftar gagal dimuat"
          onRetry={refresh}
        />
      )}
      <Space wrap size={8} style={{ marginBottom: 12 }}>
        <Tag.CheckableTag
          checked={!parameters.status}
          onChange={() => pickStatus(undefined)}
        >
          Semua ({total})
        </Tag.CheckableTag>
        {P3RI_STATUSES.map((key) => (
          <Tag.CheckableTag
            key={key}
            checked={parameters.status === key}
            onChange={() => pickStatus(key)}
          >
            {P3RI_STATUS_LABELS[key]} ({data?.counts[key] ?? 0})
          </Tag.CheckableTag>
        ))}
      </Space>
      <Card style={{ boxShadow: "none" }} styles={{ body: { padding: 12 } }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <ResponsiveFilters
            onApply={apply}
            onReset={reset}
            values={[status, division, rank, gender, search]}
          >
            {({ apply: applyFilters }) => (
              <Space size={12} wrap>
                <Input
                  placeholder="Nama, email, WhatsApp, instansi"
                  allowClear
                  style={{ width: 240 }}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onPressEnter={applyFilters}
                  prefix={
                    <SearchOutlined
                      style={{ color: "var(--app-color-text-secondary)" }}
                    />
                  }
                />
                <Select
                  placeholder="Status"
                  allowClear
                  style={{ width: 160 }}
                  value={status}
                  onChange={setStatus}
                  options={P3RI_STATUS_OPTIONS}
                />
                <Select
                  placeholder="Bidang/Divisi"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  style={{ width: 220 }}
                  value={division}
                  onChange={setDivision}
                  options={divisionOptions}
                />
                <Select
                  placeholder="Urutan pilihan"
                  allowClear
                  disabled={!division}
                  style={{ width: 150 }}
                  value={rank}
                  onChange={setRank}
                  options={RANK_OPTIONS}
                />
                <Select
                  placeholder="Jenis Kelamin"
                  allowClear
                  style={{ width: 150 }}
                  value={gender}
                  onChange={setGender}
                  options={GENDER_OPTIONS}
                />
                <Button
                  aria-label="Cari"
                  icon={<SearchOutlined />}
                  onClick={applyFilters}
                />
              </Space>
            )}
          </ResponsiveFilters>
          <Tooltip placement="left" title="Muat ulang data">
            <Button
              aria-label="Muat ulang data"
              icon={<ReloadOutlined />}
              onClick={refresh}
              loading={loading}
            />
          </Tooltip>
        </div>
      </Card>
      <div style={{ marginTop: 12 }}>
        <Table
          listId="pages/P3ri/P3riRegistrationList:1"
          rowKey="id"
          columns={columns}
          dataSource={data?.data}
          loading={loading}
          pagination={{
            current: data?.meta.current_page,
            pageSize: data?.meta.per_page,
            total: data?.meta.total,
            showSizeChanger: true,
            pageSizeOptions: ["20", "50", "100"],
            showTotal: (count, range) =>
              `Menampilkan ${range[0]}-${range[1]} dari ${count} pendaftar`,
          }}
          onChange={(pagination) =>
            setParameters((prev) => ({
              ...prev,
              page: pagination.current || 1,
              per_page: pagination.pageSize || 20,
            }))
          }
          scroll={{ x: 1000 }}
          size="small"
          bordered
        />
      </div>
    </div>
  );
}
