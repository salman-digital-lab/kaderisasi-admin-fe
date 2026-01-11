import { Input, Card, Button, DatePicker, Space, Tooltip } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useState } from "react";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

interface MonthlyLeaderboardFilterProps {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      month: string;
      year: string;
      email: string;
      name: string;
    }>
  >;
  refresh?: () => void;
  loading?: boolean;
}

export default function MonthlyLeaderboardFilter({
  setParameter,
  refresh,
  loading,
}: MonthlyLeaderboardFilterProps) {
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [monthYear, setMonthYear] = useState<dayjs.Dayjs | null>(null);

  const handleSearch = () => {
    setParameter((prev) => ({
      ...prev,
      name: nameInput,
      email: emailInput,
      month: monthYear ? String(monthYear.month() + 1) : "",
      year: monthYear ? String(monthYear.year()) : "",
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
            style={{ width: 180 }}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          />

          <Input
            placeholder="Cari email"
            allowClear
            style={{ width: 200 }}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />

          <DatePicker.MonthPicker
            placeholder="Pilih bulan dan tahun"
            style={{ width: 180 }}
            format="MMMM YYYY"
            allowClear
            value={monthYear}
            onChange={setMonthYear}
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
            <Tooltip title="Refresh Data">
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
