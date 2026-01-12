import React, { useState } from "react";
import { Button, Card, Space, Select, Input, Tooltip } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { PROBLEM_STATUS_ENUM } from "../../../../types/constants/ruangcurhat";
import {
  PROBLEM_STATUS_OPTIONS,
  GENDER_OPTION,
} from "../../../../constants/options";
import { GENDER } from "../../../../types/constants/profile";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

type FilterProps = {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      status?: PROBLEM_STATUS_ENUM;
      name?: string;
      gender?: GENDER;
      admin_display_name?: string;
    }>
  >;
  refresh?: () => void;
  loading?: boolean;
};

const RuangCurhatFilter = ({ setParameter, refresh, loading }: FilterProps) => {
  const [nameInput, setNameInput] = useState("");
  const [statusValue, setStatusValue] = useState<
    PROBLEM_STATUS_ENUM | undefined
  >();
  const [genderValue, setGenderValue] = useState<GENDER | undefined>();
  const [adminNameInput, setAdminNameInput] = useState("");

  const handleSearch = () => {
    setParameter((prev) => ({
      ...prev,
      status: statusValue,
      name: nameInput || undefined,
      gender: genderValue,
      admin_display_name: adminNameInput || undefined,
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
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 140 }}
            value={statusValue}
            onChange={setStatusValue}
            options={PROBLEM_STATUS_OPTIONS}
          />

          <Input
            placeholder="Nama pendaftar"
            allowClear
            style={{ width: 180 }}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          />

          <Select
            placeholder="Jenis Kelamin"
            allowClear
            style={{ width: 140 }}
            value={genderValue}
            onChange={setGenderValue}
            options={GENDER_OPTION}
          />

          <Input
            placeholder="Nama konselor"
            allowClear
            style={{ width: 160 }}
            value={adminNameInput}
            onPressEnter={handleSearch}
            onChange={(e) => setAdminNameInput(e.target.value)}
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
};

export default RuangCurhatFilter;
