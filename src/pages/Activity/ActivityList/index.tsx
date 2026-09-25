import { ResponsiveFilters } from "../../../components/common/Responsive/ResponsiveFilters";
import { useState, type ReactElement } from "react";
import { Space, Button, Input, Select, Tooltip, Card, Alert } from "antd";
import { useRequest } from "ahooks";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../../stores/authStore";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import { getActivities } from "../../../api/services/activity";
import { getClubs } from "../../../api/services/club";
import {
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
} from "../../../constants/options";

import ActivityTable from "./components/ActivityTable";
import { FilterType } from "./constants/type";
import {
  ACTIVITY_CATEGORY_ENUM,
  ACTIVITY_TYPE_ENUM,
} from "../../../types/constants/activity";
import { CLUB_TYPE_LABELS } from "../../../types/model/club";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

const MainActivity = (): ReactElement => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const canReadClubs = permissions.includes("clubs.read");

  // State for filter parameters
  const [parameters, setParameters] = useState<FilterType>({
    page: 1,
    per_page: 10,
    name: "",
    activity_type: undefined,
    activity_category: undefined,
    club_id: undefined,
  });

  // Local state for search input to avoid too many re-renders/requests
  const [searchInput, setSearchInput] = useState("");
  const [typeInput, setTypeInput] = useState<ACTIVITY_TYPE_ENUM | undefined>(
    undefined,
  );
  const [categoryInput, setCategoryInput] = useState<
    ACTIVITY_CATEGORY_ENUM | undefined
  >(undefined);
  const [clubInput, setClubInput] = useState<string | undefined>(undefined);
  const [publicationInput, setPublicationInput] = useState<
    "0" | "1" | undefined
  >(undefined);

  const { data: clubsData } = useRequest(
    () => getClubs({ page: "1", per_page: "100" }),
    { ready: canReadClubs },
  );

  const clubOptions =
    clubsData?.data.map((club) => ({
      label: `${club.name} (${CLUB_TYPE_LABELS[club.club_type]})`,
      value: String(club.id),
    })) || [];

  const { data, loading, error, refresh } = useRequest(
    () =>
      getActivities({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        search: parameters.name,
        activity_type: parameters.activity_type,
        category: parameters.activity_category,
        club_id: canReadClubs ? parameters.club_id : undefined,
        is_published: parameters.is_published,
      }),
    {
      refreshDeps: [parameters, canReadClubs],
      retryCount: 3,
      retryInterval: 1000,
      onError: (err) => {
        console.error("Failed to fetch activities:", err);
      },
    },
  );

  const handleSearch = () => {
    setParameters((prev) => ({
      ...prev,
      name: searchInput,
      activity_type: typeInput,
      activity_category: categoryInput,
      club_id: canReadClubs ? clubInput : undefined,
      is_published: publicationInput,
      page: 1,
    }));
  };

  return (
    <div style={{ padding: 12 }}>
      {permissions.includes("activities.manage") && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          title={
            <>
              Pilih <strong>Detail</strong>, lalu gunakan tab
              <strong> Ringkasan</strong> sebagai panduan untuk melengkapi
              pengaturan kegiatan.
            </>
          }
        />
      )}
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
          {/* Left: Filters */}
          <ResponsiveFilters
            onApply={handleSearch}
            values={[
              searchInput,
              typeInput,
              categoryInput,
              publicationInput,
              canReadClubs ? clubInput : undefined,
            ]}
            onReset={() => {
              setSearchInput("");
              setTypeInput(undefined);
              setCategoryInput(undefined);
              setClubInput(undefined);
              setPublicationInput(undefined);
              setParameters((prev) => ({
                ...prev,
                page: 1,
                name: "",
                activity_type: undefined,
                activity_category: undefined,
                club_id: undefined,
                is_published: undefined,
              }));
            }}
          >
            {({ apply }) => (
              <Space size={12} wrap>
                <Input
                  placeholder="Cari nama aktivitas"
                  allowClear
                  style={{ width: 240 }}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onPressEnter={apply}
                />

                <Select
                  placeholder="Semua Tipe"
                  allowClear
                  style={{ width: 150 }}
                  options={ACTIVITY_TYPE_OPTIONS}
                  onChange={setTypeInput}
                  value={typeInput}
                />

                <Select
                  placeholder="Semua Kategori"
                  allowClear
                  style={{ width: 160 }}
                  options={ACTIVITY_CATEGORY_OPTIONS}
                  onChange={setCategoryInput}
                  value={categoryInput}
                />

                {canReadClubs && (
                  <Select
                    placeholder="Semua Klub"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    style={{ width: 180 }}
                    options={clubOptions}
                    onChange={setClubInput}
                    value={clubInput}
                  />
                )}

                <Select
                  aria-label="Tampilkan kegiatan"
                  placeholder="Semua publikasi"
                  allowClear
                  value={publicationInput}
                  style={{ width: 190 }}
                  options={[
                    { value: "0", label: "Draf / belum tayang" },
                    { value: "1", label: "Sudah tayang" },
                  ]}
                  onChange={setPublicationInput}
                />

                <Button
                  type="primary"
                  aria-label="Terapkan filter kegiatan"
                  icon={<SearchOutlined />}
                  onClick={apply}
                />
              </Space>
            )}
          </ResponsiveFilters>

          {/* Right: Actions */}
          <Space size={8} wrap>
            {permissions.includes("activities.manage") && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/activity/new")}
              >
                Buat Kegiatan
              </Button>
            )}

            <Tooltip placement="left" title="Refresh Data">
              <Button
                icon={<ReloadOutlined />}
                onClick={refresh}
                loading={loading}
              />
            </Tooltip>
          </Space>
        </div>
      </Card>

      {/* Table Section */}
      <div style={{ marginTop: 12 }}>
        <ActivityTable
          data={data}
          loading={loading}
          error={error}
          onRetry={refresh}
          setParameter={setParameters}
        />
      </div>
    </div>
  );
};

export default MainActivity;
