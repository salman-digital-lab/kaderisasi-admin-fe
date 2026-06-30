import React, { useState } from "react";
import { Button, Card, Space, Select, Input, Tooltip, message } from "antd";
import {
  DownloadOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  ACHIEVEMENT_STATUS_ENUM,
  ACHIEVEMENT_TYPE_ENUM,
} from "../../../../types/constants/achievement";
import {
  ACHIEVEMENT_STATUS_OPTIONS,
  ACHIEVEMENT_TYPE_OPTIONS,
} from "../../../../constants/options";
import type { AchievementListParameters } from "../index";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

type FilterProps = {
  setParameter: React.Dispatch<
    React.SetStateAction<AchievementListParameters>
  >;
  refresh?: () => void;
  loading?: boolean;
  exportAchievements: () => Promise<Blob | undefined>;
};

const AchievementFilter = ({
  setParameter,
  refresh,
  loading,
  exportAchievements,
}: FilterProps) => {
  const [nameInput, setNameInput] = useState("");
  const [statusValue, setStatusValue] = useState<
    ACHIEVEMENT_STATUS_ENUM | undefined
  >();
  const [typeValue, setTypeValue] = useState<
    ACHIEVEMENT_TYPE_ENUM | undefined
  >();
  const [exportLoading, setExportLoading] = useState(false);

  const handleSearch = () => {
    setParameter((prev) => ({
      ...prev,
      page: 1,
      status: statusValue,
      name: nameInput || undefined,
      type: typeValue,
    }));
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const data = await exportAchievements();

      if (!data) {
        message.error("Download gagal");
        return;
      }

      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `achievement-data-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      message.success("Download berhasil");
    } finally {
      setExportLoading(false);
    }
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
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exportLoading}
          >
            Download All
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

export default AchievementFilter;
