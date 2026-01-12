import { Input, Card, Button, Space, Tooltip } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useState } from "react";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

interface LifetimeLeaderboardFilterProps {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      email: string;
      name: string;
    }>
  >;
  refresh?: () => void;
  loading?: boolean;
}

export default function LifetimeLeaderboardFilter({
  setParameter,
  refresh,
  loading,
}: LifetimeLeaderboardFilterProps) {
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const handleSearch = () => {
    setParameter((prev) => ({
      ...prev,
      name: nameInput,
      email: emailInput,
      page: 1,
    }));
  };

  return (
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
            placeholder="Cari nama"
            allowClear
            style={{ width: 200 }}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          />

          <Input
            placeholder="Cari email"
            allowClear
            style={{ width: 220 }}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />

          <Button
            icon={<SearchOutlined />}
            type="primary"
            onClick={handleSearch}
          >
            Cari
          </Button>
        </Space>

        {/* Right: Actions */}
        <Space size={8} wrap>
          {refresh && (
            <Tooltip placement="left" title="Refresh Data">
              <Button
                icon={<ReloadOutlined />}
                onClick={refresh}
                loading={loading}
              />
            </Tooltip>
          )}
        </Space>
      </div>
    </Card>
  );
}
