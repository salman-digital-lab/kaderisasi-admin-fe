import React, { useState } from "react";
import { Input, Button, Card, Space, Tooltip } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import AddAdminUser from "./modal/AddAdminUser";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

type FilterProps = {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      name: string;
    }>
  >;
  refresh?: () => void;
  loading?: boolean;
};

const AdminUserFilter = ({ setParameter, refresh, loading }: FilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = () => {
    setParameter((prev) => ({
      ...prev,
      name: searchInput,
      page: 1,
    }));
  };

  return (
    <Card style={cardStyle} styles={{ body: { padding: 12 } }}>
      <AddAdminUser isOpen={isOpen} setIsOpen={setIsOpen} />
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
            placeholder="Cari email"
            allowClear
            style={{ width: 280 }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          />
        </Space>

        {/* Right: Actions */}
        <Space size={8} wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsOpen(true)}
          >
            Tambah
          </Button>
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
};

export default AdminUserFilter;
