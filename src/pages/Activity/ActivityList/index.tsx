import { useState } from "react";
import { Space, Button, Input, Select, Tooltip, Card } from "antd";
import { useRequest, useToggle } from "ahooks";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import { getActivities } from "../../../api/services/activity";
import {
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
} from "../../../constants/options";

import ActivityTable from "./components/ActivityTable";
import ActivityForm from "./components/ActivityForm";
import { FilterType } from "./constants/type";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

const MainActivity = () => {
  const [isFormOpen, { toggle: toggleForm }] = useToggle(false);

  // State for filter parameters
  const [parameters, setParameters] = useState<FilterType>({
    page: 1,
    per_page: 10,
    name: "",
    activity_type: undefined,
    activity_category: undefined,
  });

  // Local state for search input to avoid too many re-renders/requests
  const [searchInput, setSearchInput] = useState("");

  const { data, loading, error, refresh } = useRequest(
    () =>
      getActivities({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        search: parameters.name,
        activity_type: parameters.activity_type,
        category: parameters.activity_category,
      }),
    {
      refreshDeps: [parameters],
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
      page: 1,
    }));
  };

  const handleTypeChange = (value: any) => {
    setParameters((prev) => ({
      ...prev,
      activity_type: value,
      page: 1,
    }));
  };

  const handleCategoryChange = (value: any) => {
    setParameters((prev) => ({
      ...prev,
      activity_category: value,
      page: 1,
    }));
  };

  return (
    <div style={{ padding: 12 }}>
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
          <Space size={12} wrap>
            <Input.Search
              placeholder="Cari nama aktivitas"
              allowClear
              style={{ width: 240 }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            />

            <Select
              placeholder="Semua Tipe"
              allowClear
              style={{ width: 150 }}
              options={ACTIVITY_TYPE_OPTIONS}
              onChange={handleTypeChange}
              value={parameters.activity_type}
            />

            <Select
              placeholder="Semua Kategori"
              allowClear
              style={{ width: 160 }}
              options={ACTIVITY_CATEGORY_OPTIONS}
              onChange={handleCategoryChange}
              value={parameters.activity_category}
            />
          </Space>

          {/* Right: Actions */}
          <Space size={8} wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={toggleForm}>
              Tambah
            </Button>

            <Tooltip title="Refresh Data">
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

      <ActivityForm open={isFormOpen} onClose={toggleForm} refresh={refresh} />
    </div>
  );
};

export default MainActivity;
