import { useState } from "react";
import { Space, Button, Input, Tooltip, Card } from "antd";
import { useRequest } from "ahooks";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";

import { getProfiles } from "../../../api/services/member";

import MemberTable from "./components/MemberTable";

const MemberListPage = () => {
  // State for filter parameters
  const [parameters, setParameters] = useState({
    page: 1,
    per_page: 10,
    search: "",
    badge: "",
  });

  // Local state for search input to avoid too many re-renders/requests
  const [searchInput, setSearchInput] = useState("");
  const [badgeInput, setBadgeInput] = useState("");

  const { data, loading, error, refresh } = useRequest(
    () =>
      getProfiles({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        search: parameters.search,
        badge: parameters.badge,
      }),
    {
      refreshDeps: [parameters],
      retryCount: 3,
      retryInterval: 1000,
      onError: (err) => {
        console.error("Failed to fetch members:", err);
      },
    },
  );

  const handleSearch = () => {
    setParameters((prev) => ({
      ...prev,
      search: searchInput,
      badge: badgeInput,
      page: 1,
    }));
  };

  const handleBadgeSearch = () => {
    setParameters((prev) => ({
      ...prev,
      badge: badgeInput,
      page: 1,
    }));
  };

  const cardStyle = {
    borderRadius: 0,
    boxShadow: "none",
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
              placeholder="Cari nama atau email"
              allowClear
              style={{ width: 280 }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            />

            <Input.Search
              placeholder="Cari lencana"
              allowClear
              style={{ width: 180 }}
              value={badgeInput}
              onChange={(e) => setBadgeInput(e.target.value)}
              onSearch={handleBadgeSearch}
            />
          </Space>

          {/* Right: Actions */}
          <Space size={8} wrap>
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
      <div style={{ ...cardStyle, marginTop: 12 }}>
        <MemberTable
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

export default MemberListPage;
