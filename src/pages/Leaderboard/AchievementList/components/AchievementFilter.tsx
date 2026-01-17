import React, { useState } from "react";
import { Button, Card, Space, Select, Input, Tooltip } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  ACHIEVEMENT_STATUS_ENUM,
  ACHIEVEMENT_TYPE_ENUM,
} from "../../../../types/constants/achievement";
import {
  ACHIEVEMENT_STATUS_OPTIONS,
  ACHIEVEMENT_TYPE_OPTIONS,
} from "../../../../constants/options";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

type FilterProps = {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      status?: ACHIEVEMENT_STATUS_ENUM;
      email?: string;
      name?: string;
      type?: ACHIEVEMENT_TYPE_ENUM;
    }>
  >;
  refresh?: () => void;
  loading?: boolean;
};

const AchievementFilter = ({ setParameter, refresh, loading }: FilterProps) => {
  const [nameInput, setNameInput] = useState("");
  const [statusValue, setStatusValue] = useState<
    ACHIEVEMENT_STATUS_ENUM | undefined
  >();
  const [typeValue, setTypeValue] = useState<
    ACHIEVEMENT_TYPE_ENUM | undefined
  >();

  const handleSearch = () => {
    setParameter((prev) => ({
      ...prev,
      page: 1,
      status: statusValue,
      name: nameInput || undefined,
      type: typeValue,
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
          <Input
            placeholder="Cari nama"
            allowClear
            style={{ width: 200 }}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          />

          <Select
            placeholder="Kategori"
            allowClear
            style={{ width: 150 }}
            value={typeValue}
            onChange={setTypeValue}
            options={ACHIEVEMENT_TYPE_OPTIONS}
          />

          <Select
            placeholder="Status"
            allowClear
            style={{ width: 150 }}
            value={statusValue}
            onChange={setStatusValue}
            options={ACHIEVEMENT_STATUS_OPTIONS}
          />

          <Button
            icon={<SearchOutlined />}
            type="primary"
            onClick={handleSearch}
          />
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
};

export default AchievementFilter;
