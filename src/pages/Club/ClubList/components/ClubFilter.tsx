import { Input, Card, Button, Space, Tooltip } from "antd";
import { useState } from "react";
import { useToggle } from "ahooks";
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import { FilterType } from "../constants/type";
import ClubForm from "./ClubForm";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

type FilterProps = {
  setParameter: React.Dispatch<React.SetStateAction<FilterType>>;
  refresh: () => void;
  loading?: boolean;
};

const ClubFilter = ({ setParameter, refresh, loading }: FilterProps) => {
  const [state, { toggle }] = useToggle(false);
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
            placeholder="Cari nama club"
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
          <Button type="primary" icon={<PlusOutlined />} onClick={toggle}>
            Tambah Club
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

      <ClubForm open={state} onClose={toggle} refresh={refresh} />
    </Card>
  );
};

export default ClubFilter;
